import { useEffect, useRef, useState } from 'react'
import { Chip, Panel, Segmented, btn, btnPrimary } from '../components/Panel'
import { LOG_KINDS, buildDoc, buildDownload } from '../create/sandbox'
import type { LogKind } from '../create/sandbox'
import { TEMPLATES } from '../create/templates'
import type { Draft } from '../create/templates'
import { MAX_PROJECTS, deleteProject, explain, listProjects, saveProject } from '../vault/vault'
import type { SavedProject } from '../vault/vault'

type FileKey = 'html' | 'css' | 'js'

const FILES: { value: FileKey; label: string }[] = [
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'js', label: 'JavaScript' },
]

const MAX_LOGS = 100
const logTone: Record<LogKind, string> = { log: 'text-ink', info: 'text-pos', warn: 'text-hi', error: 'text-neg' }

interface CreatePageProps {
  draft: Draft
  onDraft: (d: Draft) => void
}

const same = (a: Draft, b: { html: string; css: string; js: string }) =>
  a.html === b.html && a.css === b.css && a.js === b.js

export function CreatePage({ draft, onDraft }: CreatePageProps) {
  const [file, setFile] = useState<FileKey>('html')
  const [run, setRun] = useState<{ doc: string; n: number } | null>(null)
  const [logs, setLogs] = useState<{ k: LogKind; t: string }[]>([])
  const [projects, setProjects] = useState<SavedProject[] | null>(null)
  const [note, setNote] = useState<{ bad: boolean; text: string } | null>(null)
  const frame = useRef<HTMLIFrameElement>(null)

  // Console lines from the preview. Only messages from our own iframe are accepted, and only plain text is used.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { neuron?: number; k?: LogKind; t?: unknown } | null
      if (e.source !== frame.current?.contentWindow || !d || d.neuron !== 1) return
      if (!d.k || !LOG_KINDS.includes(d.k) || typeof d.t !== 'string') return
      const line = { k: d.k, t: d.t }
      setLogs((l) => [...l.slice(-(MAX_LOGS - 1)), line])
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const refresh = async () => {
    try {
      setProjects(await listProjects())
    } catch (e) {
      setProjects([])
      setNote({ bad: true, text: explain(e) })
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  const start = () => {
    setLogs([])
    setRun({ doc: buildDoc(draft), n: (run?.n ?? 0) + 1 })
  }

  /** Replacing the code asks first, unless the current code is already a template or a saved project. */
  const replace = (next: Draft) => {
    const known = TEMPLATES.some((t) => same(draft, t.files)) || (projects ?? []).some((p) => same(draft, p))
    if (!known && !window.confirm('Replace your current code? Save it to the Vault first if you want to keep it.')) return
    onDraft(next)
    setRun(null)
    setLogs([])
    setNote(null)
  }

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn()
      setNote({ bad: false, text: ok })
    } catch (e) {
      setNote({ bad: true, text: explain(e) })
    }
    await refresh()
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([buildDownload(draft, draft.name)], { type: 'text/html' }))
    const a = document.createElement('a')
    a.href = url
    a.download = (draft.name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'project') + '.html'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-4">
      <Panel code="03.A" title="Start from">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => replace({ name: t.name, ...t.files })}
              className="rounded-md border border-line/60 bg-bg px-4 py-2 text-left transition-colors duration-150 hover:border-ink"
            >
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-[11px] text-muted">{t.note}</span>
            </button>
          ))}
        </div>

        {projects && projects.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              My projects ({projects.length} of {MAX_PROJECTS})
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-md border border-line/50 bg-bg px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted">{new Date(p.savedAt).toLocaleString()}</p>
                  </div>
                  <button type="button" className={btn} onClick={() => replace({ name: p.name, html: p.html, css: p.css, js: p.js })}>
                    Open
                  </button>
                  <button
                    type="button"
                    className={btn}
                    aria-label={`Delete ${p.name}`}
                    onClick={() => act(() => deleteProject(p.id).then(() => undefined), 'Project deleted.')}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel code="03.B" title="Editor">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <input
              value={draft.name}
              onChange={(e) => onDraft({ ...draft, name: e.target.value })}
              maxLength={60}
              aria-label="Project name"
              className="min-w-0 flex-1 rounded-md border border-line/60 bg-bg px-3 py-1.5 outline-none focus:border-hi"
            />
            <Segmented label="File" value={file} options={FILES} onChange={setFile} />
          </div>

          <textarea
            value={draft[file]}
            onChange={(e) => onDraft({ ...draft, [file]: e.target.value })}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') start()
            }}
            aria-label={`${FILES.find((f) => f.value === file)?.label} code`}
            spellCheck={false}
            wrap="off"
            className="h-[24rem] w-full resize-y overflow-auto rounded-md border border-line/60 bg-bg p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-hi"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className={btnPrimary} onClick={start}>
              Run
            </button>
            <button type="button" className={btn} disabled={!run} onClick={() => setRun(null)}>
              Stop
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => act(() => saveProject(draft.name, draft), 'Saved to the Vault.')}
            >
              Save to Vault
            </button>
            <button type="button" className={btn} onClick={download}>
              Download .html
            </button>
            <span className="text-[11px] text-muted">Ctrl+Enter runs</span>
          </div>

          {note && (
            <p role="status" className={`mt-3 text-xs ${note.bad ? 'text-neg' : 'text-pos'}`}>
              {note.text}
            </p>
          )}
        </Panel>

        <Panel code="03.C" title="Preview" aside={<Chip tone="good">sandboxed · no network</Chip>} className="self-start">
          <div className="overflow-hidden rounded-md border border-line/60 bg-white">
            {run ? (
              <iframe
                key={run.n}
                ref={frame}
                title="Preview of your page"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={run.doc}
                className="block h-[24rem] w-full"
              />
            ) : (
              <p className="grid h-[24rem] place-items-center bg-bg px-6 text-center text-muted">
                Press Run to see your page here.
              </p>
            )}
          </div>

          <p className="mb-1 mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">Console</p>
          <div role="log" className="h-28 overflow-y-auto rounded-md border border-line/50 bg-bg p-2 font-mono text-xs">
            {logs.length === 0 ? (
              <span className="text-muted">console.log output and errors appear here.</span>
            ) : (
              logs.map((l, i) => (
                <p key={i} className={logTone[l.k]}>
                  {l.k === 'log' ? '' : `${l.k}: `}
                  {l.t}
                </p>
              ))
            )}
          </div>

          <p className="mt-3 text-xs text-muted">
            Your page runs in a locked box. It cannot reach NEURON, your files or the internet. An endless loop in
            your code can still freeze this tab; reload the page to recover.
          </p>
        </Panel>
      </div>
    </div>
  )
}   