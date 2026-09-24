import { useEffect, useRef, useState } from 'react'
import { Send, Users, X, ChevronDown, MessageSquare } from 'lucide-react'
import { colorFor } from '../utils/constants.js'
import { formatTime } from '../utils/format.js'

export default function ChatPanel({
  messages,
  users,
  roomSize,
  maxUsers,
  onSend,
  onClose,
  open,
}) {
  const [draft, setDraft] = useState('')
  const [showUsers, setShowUsers] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    onSend(draft)
    setDraft('')
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw] flex flex-col border-l border-edge bg-white dark:bg-canvas-darker
        transition-transform duration-200 md:static md:z-auto md:w-80 md:transition-none md:translate-x-0 md:shrink-0
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
      aria-label="Panel chat room"
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-edge shrink-0">
        <MessageSquare size={18} className="text-slate-500 dark:text-slate-400" />
        <h2 className="text-sm font-semibold flex-1">Chat Room</h2>

        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
          <Users size={13} />
          {roomSize}/{maxUsers}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="btn-ghost !px-2 md:hidden"
          aria-label="Tutup chat"
        >
          <X size={18} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowUsers((v) => !v)}
        className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-edge"
        aria-expanded={showUsers}
      >
        <span>Anggota online</span>
        <ChevronDown size={14} className={`transition-transform ${showUsers ? 'rotate-180' : ''}`} />
      </button>

      {showUsers && (
        <ul className="px-4 py-2 border-b border-edge space-y-1 text-sm max-h-32 overflow-y-auto scrollbar-slim">
          {users.length === 0 ? (
            <li className="text-xs text-slate-500 dark:text-slate-400 py-1">Belum ada anggota lain.</li>
          ) : (
            users.map((user) => (
              <li key={user.id} className="flex items-center gap-2 py-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colorFor(user.name) }}
                />
                <span className="truncate">{user.name}</span>
              </li>
            ))
          )}
        </ul>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-slim">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[220px]">
              Belum ada pesan. Ajak teman masuk room untuk mulai ngobrol.
            </p>
          </div>
        ) : (
          messages.map((message) =>
            message.type === 'system' ? (
              <p
                key={message.id}
                className="text-center text-xs text-slate-500 dark:text-slate-400"
              >
                {message.content}
              </p>
            ) : (
              <div key={message.id} className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: colorFor(message.from) }}
                  >
                    {message.from}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatTime(message.time)}
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/5 rounded-lg rounded-tl-sm px-3 py-2">
                  {message.content}
                </p>
              </div>
            )
          )
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-edge shrink-0 flex gap-2">
        <input
          ref={inputRef}
          className="input flex-1 h-11"
          value={draft}
          maxLength={500}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ketik pesan..."
          aria-label="Pesan chat"
        />
        <button type="submit" className="btn-primary !px-3 shrink-0" aria-label="Kirim pesan">
          <Send size={17} />
        </button>
      </form>
    </aside>
  )
}