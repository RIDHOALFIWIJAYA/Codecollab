import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Eraser, Play, Terminal } from 'lucide-react'
import { BUILDABLE, languageById } from '../utils/constants.js'
import { formatTime } from '../utils/format.js'

const PREVIEW_LANGUAGES = ['html', 'css']

function cssPreviewDoc(css) {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<style>${css || ''}</style>
</head>
<body>
<article class="demo">
  <h1>Preview CSS</h1>
  <p>Gaya dari stylesheet diterapkan di sini.</p>
  <button type="button">Tombol</button>
</article>
</body>
</html>`
}

function MetaLine({ run }) {
  const items = []
  if (typeof run.exitCode === 'number') {
    items.push(run.exitCode === 0 ? 'exit 0' : `exit ${run.exitCode}`)
  }
  if (run.timedOut) items.push('timeout 5s')
  if (typeof run.durationMs === 'number') items.push(`${run.durationMs} ms`)
  if (run.at) items.push(formatTime(run.at))
  return <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{items.join(' · ')}</span>
}

export default function RunConsole({ ytext, languageId, run, onRun, onClear }) {
  const [open, setOpen] = useState(true)
  const [source, setSource] = useState('')

  useEffect(() => {
    if (!ytext) return
    setSource(ytext.toString())
    const update = () => setSource(ytext.toString())
    ytext.observe(update)
    return () => ytext.unobserve(update)
  }, [ytext])

  const buildable = BUILDABLE.includes(languageId)
  const previewing = PREVIEW_LANGUAGES.includes(languageId)
  const running = run?.status === 'running'
  const runLabel = run?.language ? languageById(run.language).label : ''

  return (
    <section className="shrink-0 border-t border-edge bg-white dark:bg-canvas-darker">
      <header className="flex items-center gap-2 px-3 h-10 shrink-0">
        <Terminal size={15} className="text-slate-500 dark:text-slate-400" aria-hidden />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {previewing ? 'Preview' : 'Konsol'}
        </span>

        {running && (
          <span className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
            <span className="w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            {run?.from} menjalankan {runLabel}...
          </span>
        )}
        {run?.status === 'done' && (
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {run.from} · {runLabel}
            <span className="ml-2 hidden sm:inline">
              <MetaLine run={run} />
            </span>
          </span>
        )}

        <div className="flex-1" />

        {buildable && !running && (
          <button type="button" onClick={onRun} className="btn-primary !h-9 !px-3" title="Jalankan kode">
            <Play size={14} />
            <span className="hidden sm:inline">Run</span>
          </button>
        )}
        {buildable && run?.status === 'done' && (
          <button
            type="button"
            onClick={onClear}
            className="btn-ghost !h-9 !px-2"
            title="Bersihkan output"
          >
            <Eraser size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost !h-9 !px-2"
          aria-label={open ? 'Tutup konsol' : 'Buka konsol'}
          aria-expanded={open}
        >
          {open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </header>

      {open && (
        <div className="h-48 border-t border-edge overflow-y-auto scrollbar-slim">
          {previewing ? (
            source.trim() ? (
              <iframe
                title="Preview kode"
                sandbox="allow-scripts allow-modals allow-forms"
                className="w-full h-full bg-white"
                srcDoc={
                  languageId === 'css' ? cssPreviewDoc(source) : source
                }
              />
            ) : (
              <EmptyState text="Kode masih kosong. Preview akan tampil di sini." />
            )
          ) : !run ? (
            <EmptyState text="Jalankan kode untuk melihat output di sini." />
          ) : run.status === 'error' ? (
            <div className="p-3">
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {run.message}
              </p>
            </div>
          ) : run.output || run.error ? (
            <div className="p-3 space-y-2">
              {run.output && (
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                  {run.output}
                </pre>
              )}
              {run.error && (
                <pre className="font-mono text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                  {run.error}
                </pre>
              )}
              <div className="sm:hidden">
                <MetaLine run={run} />
              </div>
            </div>
          ) : (
            <div className="h-full grid place-items-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">Selesai tanpa output.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function EmptyState({ text }) {
  return (
    <div className="h-full grid place-items-center p-4 text-center">
      <p className="text-xs text-slate-400 dark:text-slate-500">{text}</p>
    </div>
  )
}