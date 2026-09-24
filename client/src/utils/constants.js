export const ROOM_MAX = 5

export const BUILDABLE = ['javascript', 'typescript', 'python']

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js', snippet: `// Selamat datang di CodeCollab\n// Mulai tulis kode bersama anggota room.\n\nfunction halo(nama) {\n  return \`Halo, \${nama}!\`;\n}\n\nconsole.log(halo('semua'));` },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', snippet: `// Kolaborasi dalam mode ketat.\ntype User = { id: string; nama: string };\n\nconst aktif: User[] = [];\n\nexport function tambah(u: User) {\n  aktif.push(u);\n}` },
  { id: 'python', label: 'Python', ext: 'py', snippet: `def halo(nama):\n    print(f"Halo, {nama}!")` },
  { id: 'html', label: 'HTML', ext: 'html', snippet: `<!doctype html>\n<html lang="id">\n  <body>\n    <h1>CodeCollab</h1>\n  </body>\n</html>` },
  { id: 'css', label: 'CSS', ext: 'css', snippet: `/* Tulis gaya bersama */\nbody {\n  font-family: sans-serif;\n}` },
]

export const DEFAULT_LANGUAGE = 'javascript'

export function languageById(id) {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[LANGUAGES.length - 1]
}

export function colorFor(name) {
  const palette = [
    '#22d3ee',
    '#a78bfa',
    '#34d399',
    '#f472b6',
    '#fbbf24',
    '#60a5fa',
    '#fb7185',
    '#4ade80',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return palette[Math.abs(hash) % palette.length]
}

export function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const length = 6
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let id = ''
  for (let i = 0; i < length; i += 1) {
    id += chars[bytes[i] % chars.length]
  }
  return id
}