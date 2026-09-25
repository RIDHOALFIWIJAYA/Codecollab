const crypto = require('crypto')
const http = require('http')
const path = require('path')
const fs = require('fs')
const express = require('express')
const { Server } = require('socket.io')
const { WebSocketServer } = require('ws')
const { setupWSConnection, docs } = require('y-websocket/bin/utils')
const { runCode, RUNNERS, MAX_CODE_LEN } = require('./codeRunner')

const PORT = Number(process.env.PORT || 3001)
const ROOM_MAX = 5
const MAX_NAME_LEN = 24
const MAX_MESSAGE_LEN = 500
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist')

const isValidRoomId = (id) => /^[A-Za-z0-9_-]{3,32}$/.test(id || '')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  cors: { origin: '*' },
})

const roomUsers = new Map()
const roomLanguage = new Map()
const runState = new Map()
const RUN_COOLDOWN_MS = 1500
const DEFAULT_LANGUAGE = 'javascript'

function usersInRoom(roomId) {
  const ids = io.sockets.adapter.rooms.get(roomId)
  if (!ids) return []
  return Array.from(ids, (socketId) => {
    const user = roomUsers.get(socketId)
    return user ? { id: socketId, name: user.name } : null
  }).filter(Boolean)
}

function sendUsersToRoom(roomId) {
  io.to(roomId).emit('user_list', usersInRoom(roomId))
}

function broadcastSystem(roomId, text) {
  io.to(roomId).emit('chat_system', {
    id: crypto.randomUUID(),
    text,
    time: Date.now(),
  })
}

io.on('connection', (socket) => {
  socket.on('join_room', (payload = {}, ack) => {
    const roomId = String(payload.roomId || '').slice(0, 32)
    const rawName = String(payload.name || '').trim().slice(0, MAX_NAME_LEN)
    const name = rawName || 'Anonim'

    if (!isValidRoomId(roomId)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_room' })
      return
    }

    const current = usersInRoom(roomId).length
    if (current >= ROOM_MAX) {
      socket.emit('room_full', { roomId })
      if (typeof ack === 'function') ack({ ok: false, reason: 'full' })
      socket.disconnect(true)
      return
    }

    const isRejoin = roomUsers.has(socket.id)

    roomUsers.set(socket.id, { name, roomId })
    socket.join(roomId)

    sendUsersToRoom(roomId)
    if (!isRejoin) broadcastSystem(roomId, `${name} bergabung ke room`)

    if (typeof ack === 'function') {
      ack({
        ok: true,
        roomId,
        users: usersInRoom(roomId),
        max: ROOM_MAX,
        language: roomLanguage.get(roomId) || DEFAULT_LANGUAGE,
      })
    }
  })

  socket.on('language_change', (payload = {}) => {
    const user = roomUsers.get(socket.id)
    if (!user) return
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id)
    if (!roomId) return
    const language = String(payload.language || '').slice(0, 32)
    if (!language) return

    roomLanguage.set(roomId, language)
    io.to(roomId).emit('language_changed', language)
  })

  socket.on('chat_message', (payload = {}, ack) => {
    const user = roomUsers.get(socket.id)
    if (!user) return
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id)
    if (!roomId) return
    const content = String(payload.content || '').trim().slice(0, MAX_MESSAGE_LEN)
    if (!content) return

    const message = {
      id: crypto.randomUUID(),
      fromId: socket.id,
      from: user.name,
      content,
      time: Date.now(),
    }
    io.to(roomId).emit('chat_message', message)
    if (typeof ack === 'function') ack({ ok: true, id: message.id })
  })

  socket.on('run_code', async (payload = {}, ack) => {
    const user = roomUsers.get(socket.id)
    if (!user) return
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id)
    if (!roomId) return
    const language = String(payload.language || '')
    if (!RUNNERS[language]) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'unsupported' })
      return
    }
    const code = String(payload.code || '')
    if (!code.trim()) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'empty' })
      return
    }
    if (code.length > MAX_CODE_LEN) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'too_large' })
      return
    }

    const now = Date.now()
    const state = runState.get(socket.id) || { running: false, lastRunAt: 0 }
    if (state.running) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'busy' })
      return
    }
    if (now - state.lastRunAt < RUN_COOLDOWN_MS) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'cooldown' })
      return
    }

    state.running = true
    state.lastRunAt = now
    runState.set(socket.id, state)

    const runId = crypto.randomUUID()
    io.to(roomId).emit('run_start', { runId, from: user.name, language, at: now })

    const result = await runCode({ language, code })
    state.running = false
    io.to(roomId).emit('run_result', {
      runId,
      from: user.name,
      language,
      at: Date.now(),
      ...result,
    })
    if (typeof ack === 'function') ack({ ok: true, runId })
  })

  socket.on('disconnect', () => {
    runState.delete(socket.id)
    const user = roomUsers.get(socket.id)
    if (!user) return
    roomUsers.delete(socket.id)

    const roomId = user.roomId
    if (!roomId) return

    if (usersInRoom(roomId).length === 0) {
      const yDoc = docs.get(roomId)
      if (yDoc) {
        yDoc.destroy()
        docs.delete(roomId)
      }
      roomLanguage.delete(roomId)
    } else {
      sendUsersToRoom(roomId)
      broadcastSystem(roomId, `${user.name} meninggalkan room`)
    }
  })
})

const wss = new WebSocketServer({ noServer: true })

function parseYjsRoomPath(req) {
  const urlPath = (req.url || '').split('?')[0]
  if (urlPath === '/ws') return { matched: true, roomId: '' }
  if (!urlPath.startsWith('/ws/')) return { matched: false, roomId: null }

  try {
    return { matched: true, roomId: decodeURIComponent(urlPath.slice(4)) }
  } catch {
    return { matched: true, roomId: null }
  }
}

server.on('upgrade', (req, socket, head) => {
  const { matched, roomId } = parseYjsRoomPath(req)
  if (!matched) return

  wss.handleUpgrade(req, socket, head, (conn) => {
    wss.emit('connection', conn, req, roomId)
  })
})

wss.on('connection', (conn, req, roomId) => {
  if (!isValidRoomId(roomId)) {
    conn.close(4002, 'INVALID_ROOM')
    return
  }

  const existingDoc = docs.get(roomId)
  const connectionCount = existingDoc ? existingDoc.conns.size : 0
  if (connectionCount >= ROOM_MAX) {
    conn.close(4001, 'ROOM_FULL')
    return
  }

  setupWSConnection(conn, req, { docName: roomId })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, roomMax: ROOM_MAX })
})

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  app.get(/^\/(?!socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

server.listen(PORT, () => {
  console.log(`CodeCollab server: http://localhost:${PORT} (max ${ROOM_MAX} user/room)`)
})