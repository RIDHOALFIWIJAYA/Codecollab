import { useState } from 'react'
import { Code2, Users, ArrowRight, Plus } from 'lucide-react'
import { generateRoomId, ROOM_MAX } from '../utils/constants.js'

export default function JoinScreen({ onJoin, initialRoom = '' }) {
  const [name, setName] = useState('')
  const [room, setRoom] = useState(initialRoom)
  const [error, setError] = useState('')

  function validate(requiredRoom) {
    if (!name.trim()) {
      setError('Isi nama kamu dulu.')
      return false
    }
    if (requiredRoom && !room.trim()) {
      setError('Masukkan kode room untuk bergabung.')
      return false
    }
    if (requiredRoom && room.trim().length < 3) {
      setError('Kode room minimal 3 karakter.')
      return false
    }
    return true
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!validate(false)) return
    onJoin({ roomId: generateRoomId(), name: name.trim(), isNew: true })
  }

  function handleJoin(e) {
    e.preventDefault()
    if (!validate(true)) return
    onJoin({ roomId: room.trim(), name: name.trim(), isNew: false })
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm panel p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <Code2 size={22} />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">CodeCollab</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Editor kode real-time untuk tim kecil
            </p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Users size={14} />
          Maksimal {ROOM_MAX} orang per room. Semua perubahan tersinkron otomatis.
        </p>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Nama kamu</span>
            <input
              className="input"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Ridho"
              autoFocus
            />
          </label>

          <button type="submit" className="btn-primary w-full">
            <Plus size={16} />
            Buat Room Baru
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          <span className="text-xs text-slate-400 dark:text-slate-500">atau</span>
          <span className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        </div>

        <form onSubmit={handleJoin}>
          <label className="block mb-4">
            <span className="block text-sm font-medium mb-1.5">Kode room</span>
            <input
              className="input font-mono uppercase tracking-widest"
              value={room}
              maxLength={24}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="KODE6"
            />
          </label>

          <button type="submit" className="btn-ghost w-full">
            Gabung ke Room
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}