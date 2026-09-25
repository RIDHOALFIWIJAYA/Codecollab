import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import { ROOM_MAX, DEFAULT_LANGUAGE, BUILDABLE, colorFor, languageById } from '../utils/constants.js'
import '../monacoSetup.js'

const MAX_MESSAGES = 200

const RUN_REASON_TEXT = {
  busy: 'Masih ada eksekusi yang berjalan. Tunggu hasilnya dulu.',
  cooldown: 'Terlalu cepat. Tunggu sebentar sebelum menjalankan lagi.',
  unsupported: 'Bahasa ini belum didukung untuk eksekusi.',
  empty: 'Kode masih kosong.',
  too_large: 'Kode terlalu besar untuk dijalankan.',
}

export function useYjsSocket() {
  const [status, setStatus] = useState('idle')
  const [roomId, setRoomId] = useState('')
  const [name, setName] = useState('')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [roomFull, setRoomFull] = useState(false)
  const [socketError, setSocketError] = useState('')
  const [syncStatus, setSyncStatus] = useState('idle')
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [run, setRun] = useState(null)

  const socketRef = useRef(null)
  const providerRef = useRef(null)
  const docRef = useRef(null)
  const textRef = useRef(null)
  const mountedRef = useRef(true)
  const messagesRef = useRef([])
  const statusRef = useRef('idle')
  const languageRef = useRef(DEFAULT_LANGUAGE)
  const runRef = useRef(null)
  const teardownRef = useRef(null)

  useEffect(() => {
    languageRef.current = language
  }, [language])

  const appendMessage = useCallback((message) => {
    if (!mountedRef.current) return
    const next = [...messagesRef.current, message]
    const capped = next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next
    messagesRef.current = capped
    setMessages(capped)
  }, [])

  const clearMessages = useCallback(() => {
    messagesRef.current = []
    setMessages([])
  }, [])

  const teardown = useCallback(() => {
    const provider = providerRef.current
    providerRef.current = null
    if (provider) provider.destroy()
    const doc = docRef.current
    docRef.current = null
    if (doc) doc.destroy()
    const socket = socketRef.current
    socketRef.current = null
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect(true)
    }
    textRef.current = null
    statusRef.current = 'idle'
    runRef.current = null
    setRun(null)
    setStatus('idle')
    setRoomFull(false)
    setSocketError('')
    setSyncStatus('idle')
    setLanguage(DEFAULT_LANGUAGE)
    clearMessages()
  }, [clearMessages])
  teardownRef.current = teardown

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      teardown()
    }
  }, [teardown])

  const start = useCallback(
    ({ roomId: nextRoomId, name: nextName, isNew = false }) => {
      if (statusRef.current !== 'idle') return
      const cleanName = (nextName || '').trim().slice(0, 24) || 'Anonim'
      const color = colorFor(cleanName)

      setRoomId(nextRoomId)
      setName(cleanName)
      statusRef.current = 'connecting'
      setStatus('connecting')
      setSyncStatus('connecting')
      setSocketError('')
      clearMessages()

      const socket = io({ autoConnect: false })
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit(
          'join_room',
          { roomId: nextRoomId, name: cleanName },
          (res) => {
            if (!mountedRef.current) return
            if (!res || !res.ok) {
              if (res && res.reason === 'full') {
                setRoomFull(true)
              }
              statusRef.current = 'idle'
              setStatus('idle')
              setSyncStatus('idle')
              socket.disconnect(true)
              return
            }

            setUsers(res.users || [])
            if (typeof res.language === 'string' && res.language) {
              setLanguage(res.language)
            }

            const existing = providerRef.current
            if (existing && existing.ws) {
              statusRef.current = 'connected'
              setStatus('connected')
              return
            }
            if (existing) {
              providerRef.current = null
              existing.destroy()
            }

            appendMessage({
              id: 'system-local',
              type: 'system',
              content: `Kamu bergabung ke room ${nextRoomId}`,
              time: Date.now(),
            })

            const doc = new Y.Doc()
            const text = doc.getText('code')
            if (text.length === 0 && isNew) {
              text.insert(0, languageById('javascript').snippet)
            }

            const provider = new WebsocketProvider('/ws', nextRoomId, doc, {
              connect: false,
            })
            provider.on('status', ({ status: providerStatus } = {}) => {
              if (!mountedRef.current || providerRef.current !== provider) return
              if (providerStatus === 'connected') setSyncStatus('syncing')
              if (providerStatus === 'disconnected') setSyncStatus('reconnecting')
            })
            provider.on('sync', (synced) => {
              if (!mountedRef.current || providerRef.current !== provider) return
              if (synced) {
                setSyncStatus('synced')
                setSocketError('')
              }
            })
            provider.on('connection-error', () => {
              if (!mountedRef.current || providerRef.current !== provider) return
              setSyncStatus('error')
              setSocketError('Koneksi sinkronisasi kode gagal. Coba muat ulang halaman.')
            })
            provider.on('connection-close', () => {
              if (!mountedRef.current || providerRef.current !== provider) return
              setSyncStatus('reconnecting')
              setSocketError('Sinkronisasi kode terputus. Mencoba menyambung kembali...')
            })
            provider.awareness.setLocalStateField('user', {
              name: cleanName,
              color,
            })

            providerRef.current = provider
            docRef.current = doc
            textRef.current = text
            provider.connect()
            statusRef.current = 'connected'
            setStatus('connected')
          }
        )
      })

      socket.on('room_full', () => {
        if (mountedRef.current) setRoomFull(true)
      })

      socket.on('user_list', (list) => {
        if (mountedRef.current) setUsers(list || [])
      })

      socket.on('chat_message', (message) => {
        appendMessage({ ...message, type: 'chat' })
      })

      socket.on('chat_system', (message) => {
        appendMessage({ ...message, type: 'system' })
      })

      socket.on('language_changed', (languageId) => {
        if (!mountedRef.current) return
        if (typeof languageId === 'string' && languageId) setLanguage(languageId)
      })

      socket.on('run_start', (payload) => {
        if (!mountedRef.current || !payload) return
        runRef.current = {
          status: 'running',
          runId: payload.runId,
          from: payload.from,
          language: payload.language,
          at: payload.at,
        }
        setRun(runRef.current)
      })

      socket.on('run_result', (payload) => {
        if (!mountedRef.current || !payload) return
        const fatal =
          payload.error === 'transpile_failed' || payload.error === 'unknown_language'
        runRef.current = fatal
          ? {
              status: 'error',
              message: payload.message || 'Gagal menjalankan kode.',
              from: payload.from,
              language: payload.language,
              at: payload.at,
            }
          : {
              status: 'done',
              runId: payload.runId,
              from: payload.from,
              language: payload.language,
              output: payload.stdout || '',
              error: payload.stderr || '',
              exitCode: payload.exitCode,
              signal: payload.signal,
              timedOut: !!payload.timedOut,
              durationMs: payload.durationMs,
              at: payload.at,
            }
        setRun(runRef.current)
      })

      socket.on('disconnect', (reason) => {
        if (!mountedRef.current) return
        if (reason === 'io server disconnect' || reason === 'io client disconnect') return
        statusRef.current = 'idle'
        setStatus('idle')
        setSyncStatus('reconnecting')
        setSocketError('Koneksi ke server terputus. Coba gabung kembali.')
      })

      socket.on('connect_error', () => {
        if (!mountedRef.current) return
        teardownRef.current()
        setSocketError('Tidak dapat terhubung ke server.')
      })

      socket.connect()
    },
    [appendMessage, clearMessages, statusRef, teardownRef]
  )

  const sendMessage = useCallback(
    (content) => {
      const socket = socketRef.current
      const trimmed = (content || '').trim()
      if (!socket || !trimmed || statusRef.current !== 'connected') return
      socket.emit('chat_message', { content: trimmed })
    },
    [statusRef]
  )

  const changeLanguage = useCallback(
    (id) => {
      const socket = socketRef.current
      if (!socket || statusRef.current !== 'connected') return
      setLanguage(id)
      socket.emit('language_change', { language: id })
    },
    [statusRef]
  )

  const runCode = useCallback(() => {
    const socket = socketRef.current
    const text = textRef.current
    if (!socket || !text || statusRef.current !== 'connected') return
    const language = languageRef.current
    if (!BUILDABLE.includes(language)) return
    const code = text.toString()
    socket.emit('run_code', { language, code }, (res) => {
      if (!mountedRef.current || !res || res.ok) return
      runRef.current = {
        status: 'error',
        message: RUN_REASON_TEXT[res.reason] || 'Tidak dapat menjalankan kode.',
      }
      setRun(runRef.current)
    })
  }, [])

  const clearRun = useCallback(() => {
    runRef.current = null
    setRun(null)
  }, [])

  const leave = useCallback(() => {
    teardown()
  }, [teardown])

  return {
    status,
    roomId,
    name,
    users,
    messages,
    roomFull,
    socketError,
    syncStatus,
    language,
    run,
    maxUsers: ROOM_MAX,
    roomSize: users.length,
    ydoc: docRef.current,
    ytext: textRef.current,
    awareness: providerRef.current?.awareness || null,
    start,
    sendMessage,
    changeLanguage,
    runCode,
    clearRun,
    leave,
  }
}