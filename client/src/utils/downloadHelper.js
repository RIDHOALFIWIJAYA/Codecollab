export function exportCode({ roomId, languageId, content }) {
  const extensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    jsx: 'jsx',
    tsx: 'tsx',
    markdown: 'md',
    yaml: 'yml',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    sql: 'sql',
    sh: 'sh',
    plaintext: 'txt',
  }
  const ext = extensions[languageId] || 'txt'
  const fileName = `${roomId || 'collab'}.${ext}`
  const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}