import { useEffect, useState } from 'react'
import { useYjsSocket } from './hooks/useYjsSocket.js'
import JoinScreen from './components/JoinScreen.jsx'
import RoomHeader from './components/RoomHeader.jsx'
import CodeEditor from './components/CodeEditor.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import FullRoomModal from './components/FullRoomModal.jsx'
import RunConsole from './components/RunConsole.jsx'
import { LANGUAGES } from './utils/constants.js'
import { exportCode } from './utils/downloadHelper.js'
import { Languages, X } from 'lucide-react'

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [chatOpen, setChatOpen] = useState(false)
  const [initialRoom] = useState(
    () => new URLSearchParams(window.location.search).get('room') || ''
  )
  const collab = useYjsSocket()
  const running = collab.run?.status === 'running'

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  function handleJoin({ roomId, name, isNew }) {
    setChatOpen(false)
    collab.start({ roomId, name, isNew })
  }

  function handleDownload() {
    if (!collab.ytext) return
    exportCode({
      roomId: collab.roomId,
      languageId: collab.language,
      content: collab.ytext.toString(),
    })
  }

  if (collab.roomFull) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-canvas-dark">
        <FullRoomModal
          roomId={collab.roomId}
          maxUsers={collab.maxUsers}
          onClose={collab.leave}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-canvas-dark">
      {collab.socketError && (
        <div
          role="alert"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm shadow-lg max-w-[90vw]"
        >
          <span className="truncate">{collab.socketError}</span>
          <button
            type="button"
            onClick={collab.leave}
            className="btn !h-8 !px-2 text-red-100 hover:bg-red-500"
            aria-label="Tutup notifikasi"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {collab.status === 'idle' && <JoinScreen onJoin={handleJoin} initialRoom={initialRoom} />}

      {collab.status === 'connecting' && (
        <div className="flex-1 grid place-items-center p-4">
          <div className="text-center space-y-3">
            <span className="mx-auto block w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-sky-500 animate-spin" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Menghubungkan ke room{' '}
              <span className="font-mono uppercase">{collab.roomId}</span>...
            </p>
          </div>
        </div>
      )}

      {collab.status === 'connected' && (
        <div className="flex-1 flex flex-col min-h-0">
          <RoomHeader
            roomId={collab.roomId}
            name={collab.name}
            roomSize={collab.roomSize}
            maxUsers={collab.maxUsers}
            languageId={collab.language}
            onLanguageChange={collab.changeLanguage}
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            onRun={collab.runCode}
            running={running}
            onDownload={handleDownload}
            onLeave={collab.leave}
            onOpenChat={() => setChatOpen(true)}
          />

          <div className="sm:hidden flex items-center gap-2 px-3 py-2 border-b border-edge shrink-0">
            <Languages size={15} className="text-slate-500 dark:text-slate-400" />
            <select
              className="input flex-1 h-10"
              value={collab.language}
              onChange={(e) => collab.changeLanguage(e.target.value)}
              aria-label="Bahasa pemrograman"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex min-h-0">
            <main className="flex-1 flex flex-col min-w-0 border-r border-edge">
              <CodeEditor
                ytext={collab.ytext}
                awareness={collab.awareness}
                theme={theme}
                languageId={collab.language}
              />
              <RunConsole
                ytext={collab.ytext}
                languageId={collab.language}
                run={collab.run}
                onRun={collab.runCode}
                onClear={collab.clearRun}
              />
            </main>

            <ChatPanel
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              messages={collab.messages}
              users={collab.users}
              roomSize={collab.roomSize}
              maxUsers={collab.maxUsers}
              onSend={collab.sendMessage}
            />

            {chatOpen && (
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="fixed inset-0 z-30 md:hidden bg-black/40"
                aria-label="Tutup chat"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}