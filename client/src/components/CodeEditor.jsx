import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { MonacoBinding } from 'y-monaco'

export default function CodeEditor({ ytext, awareness, theme, languageId }) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const bindingRef = useRef(null)

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (editor && monaco && ytext && awareness) {
      if (bindingRef.current) {
        bindingRef.current.destroy()
      }
      bindingRef.current = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        awareness
      )
    }
  }, [ytext, awareness])

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (editor && monaco && languageId) {
      monaco.editor.setModelLanguage(editor.getModel(), languageId)
    }
  }, [languageId])

  function handleMount(editor, monaco) {
    editorRef.current = editor
    monacoRef.current = monaco

    if (ytext && awareness) {
      if (bindingRef.current) bindingRef.current.destroy()
      bindingRef.current = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        awareness
      )
    }
  }

  return (
    <div className="flex-1 min-h-0">
      <Editor
        height="100%"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        language={languageId}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        }}
      />
    </div>
  )
}