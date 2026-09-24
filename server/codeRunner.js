const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn, spawnSync } = require('child_process')

const MAX_CODE_LEN = 50000
const MAX_OUTPUT = 65536
const DEFAULT_TIMEOUT_MS = 5000

const RUNNERS = {
  javascript: { file: 'main.js' },
  typescript: { file: 'main.js' },
  python: { file: 'main.py' },
}

let tsTranspile
let pythonCommand = null

function transpileTypescript(code) {
  if (!tsTranspile) {
    const ts = require('typescript')
    tsTranspile = (src) =>
      ts.transpileModule(src, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      }).outputText
  }
  return tsTranspile(code)
}

function resolvePython() {
  if (pythonCommand) return pythonCommand
  const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']
  for (const cmd of candidates) {
    try {
      const res = spawnSync(cmd, ['--version'], {
        stdio: 'ignore',
        windowsHide: true,
        timeout: 2000,
      })
      if (!res.error) {
        pythonCommand = cmd
        break
      }
    } catch {
      // coba perintah berikutnya
    }
  }
  pythonCommand = pythonCommand || candidates[0]
  return pythonCommand
}

function spawnOne(entry, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(entry.command, entry.args, { cwd, windowsHide: true })
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {
        // proses mungkin sudah berakhir
      }
    }, timeoutMs)

    let settled = false
    const settle = (payload) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(payload)
    }

    child.stdout.on('data', (buf) => {
      stdout += buf
      if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(stdout.length - MAX_OUTPUT)
    })
    child.stderr.on('data', (buf) => {
      stderr += buf
      if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(stderr.length - MAX_OUTPUT)
    })
    child.on('error', (err) =>
      settle({
        stdout,
        stderr,
        exitCode: -1,
        signal: null,
        timedOut,
        missing: err.code === 'ENOENT',
        errorMessage: err.message,
      })
    )
    child.on('close', (code, signal) =>
      settle({ stdout, stderr, exitCode: code, signal, timedOut })
    )
  })
}

function commandFor(language, dirPath) {
  const filePath = path.join(dirPath, RUNNERS[language].file)
  if (language === 'python') return { command: resolvePython(), args: [filePath] }
  return { command: process.execPath, args: [filePath] }
}

async function runCode({ language, code }) {
  if (!RUNNERS[language]) return { error: 'unknown_language' }
  const source = String(code || '').slice(0, MAX_CODE_LEN)
  const dirPath = fs.mkdtempSync(path.join(os.tmpdir(), 'codecollab-'))

  try {
    if (language === 'typescript') {
      try {
        fs.writeFileSync(path.join(dirPath, RUNNERS[language].file), transpileTypescript(source), 'utf8')
      } catch (err) {
        return { error: 'transpile_failed', message: err.message }
      }
    } else {
      fs.writeFileSync(path.join(dirPath, RUNNERS[language].file), source, 'utf8')
    }

    const started = Date.now()
    const result = await spawnOne(commandFor(language, dirPath), dirPath, DEFAULT_TIMEOUT_MS)
    delete result.missing
    delete result.errorMessage
    return { ...result, durationMs: Date.now() - started }
  } finally {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

module.exports = { runCode, RUNNERS, MAX_CODE_LEN }