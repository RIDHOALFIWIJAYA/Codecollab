import { useEffect, useRef } from 'react'
import { Users } from 'lucide-react'

export default function FullRoomModal({ roomId, maxUsers, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (closeRef.current) closeRef.current.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fullroom-title"
        className="w-full max-w-sm panel p-8 text-center"
      >
        <span className="mx-auto grid place-items-center w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 mb-4">
          <Users size={24} />
        </span>
        <h2 id="fullroom-title" className="text-lg font-semibold mb-2">
          Room Penuh
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Room <span className="font-mono">{roomId}</span> sudah mencapai batas{' '}
          {maxUsers} orang. Coba lagi nanti, atau buat room baru.
        </p>
        <div className="flex gap-3">
          <button ref={closeRef} type="button" onClick={onClose} className="btn-primary flex-1">
            Buat / Gabung Room Lain
          </button>
        </div>
      </div>
    </div>
  )
}