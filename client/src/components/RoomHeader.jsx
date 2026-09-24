import { useEffect, useRef, useState } from 'react'
import {
  Code2,
  Copy,
  Check,
  Download,
  Languages,
  LogOut,
  MessageSquare,
  Moon,
  Play,
  Sun,
  Users,
} from 'lucide-react'
import { LANGUAGES } from '../utils/constants.js'
import { roomJoinUrl } from '../utils/format.js'

export default function RoomHeader({
  roomId,
  name,
  roomSize,
  maxUsers,
  languageId,
  onLanguageChange,
  theme,
  onToggleTheme,
  onRun,
  onDownload,
  onLeave,
  onOpenChat,
  running = false,
}) {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)
  const full = roomSize >= maxUsers

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomJoinUrl(roomId))
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <header className="flex items-center gap-3 px-3 h-14 border-b border-edge shrink-0 bg-white dark:bg-canvas-dark">
      <div className="flex items-center gap-2 min-w-0">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
          <Code2 size={20} />
        </span>
        <div className="hidden sm:block min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{name}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                full
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {roomSize}/{maxUsers}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Room code:{' '}
            <button
              type="button"
              onClick={handleCopy}
              className="font-mono text-slate-600 dark:text-slate-300 hover:underline inline-flex items-center gap-1"
              aria-label="Salin link undangan room"
            >
              {copied ? (
                <>
                  <Check size={12} /> Tersalin
                </>
              ) : (
                <>
                  <Copy size={12} /> {roomId}
                </>
              )}
            </button>
          </p>
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onOpenChat}
        className="btn-ghost md:hidden"
        aria-label="Buka chat"
      >
        <MessageSquare size={18} />
      </button>

      <label className="hidden sm:flex items-center gap-2">
        <Languages size={16} className="text-slate-500 dark:text-slate-400" aria-hidden />
        <select
          className="input !w-40 h-11 pr-8"
          value={languageId}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Bahasa pemrograman"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onToggleTheme}
        className="btn-ghost shrink-0"
        aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
        title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="btn-primary shrink-0"
        title="Jalankan kode"
      >
        {running ? (
          <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : (
          <Play size={16} />
        )}
        <span className="hidden lg:inline">Run</span>
      </button>

      <button
        type="button"
        onClick={onDownload}
        className="btn-ghost shrink-0"
        title="Download file kode"
      >
        <Download size={18} />
        <span className="hidden lg:inline">Download</span>
      </button>

      <button
        type="button"
        onClick={onLeave}
        className="btn-ghost shrink-0"
        title="Keluar dari room"
      >
        <LogOut size={18} />
        <span className="hidden lg:inline">Keluar</span>
      </button>
    </header>
  )
}