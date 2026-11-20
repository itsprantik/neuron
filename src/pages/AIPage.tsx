import { useCallback, useEffect, useRef, useState } from 'react'
import { AI_SERVER_URL, checkAiServer, streamChat } from '../ai/client'
import type { AiServerStatus, ChatMessage } from '../ai/client'
import { btn, btnPrimary, Chip, Panel, Readout } from '../components/Panel'

interface DisplayMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  thinking: string
}

interface AIPageProps {
  onStatusChange: (status: AiServerStatus) => void
}

const suggestions = [
  'What is a neuron?',
  'Why does XOR need a hidden layer?',
  'Explain backpropagation simply.',
]

const setupSteps = [
  { title: 'Download llama.cpp', detail: 'Use the Windows x64 CPU build. Keep its executable and DLL files together in the ai folder.' },
  { title: 'Add the model', detail: 'Place your Qwen3-0.6B GGUF file inside ai/models. NEURON never downloads it automatically.' },
  { title: 'Start the local server', detail: 'Run ai/start-ai.bat and keep its terminal window open while using the tutor.' },
]

function StatusChip({ status }: { status: AiServerStatus }) {
  if (status === 'ready') return <Chip tone="good">READY</Chip>
  if (status === 'loading' || status === 'checking') return <Chip tone="warn">{status === 'loading' ? 'LOADING' : 'CHECKING'}</Chip>
  if (status === 'error') return <Chip tone="warn">SERVER ERROR</Chip>
  return <Chip tone="idle">NOT RUNNING</Chip>
}

export function AIPage({ onStatusChange }: AIPageProps) {
  const [status, setStatus] = useState<AiServerStatus>('checking')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [draft, setDraft] = useState('')
  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const controller = useRef<AbortController | null>(null)
  const nextId = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const refreshStatus = useCallback(async () => {
    setChecking(true)
    const request = new AbortController()
    try {
      const next = await checkAiServer(request.signal)
      setStatus(next)
      onStatusChange(next)
    } catch {
      // A superseded status check is intentionally ignored.
    } finally {
      setChecking(false)
    }
  }, [onStatusChange])

  useEffect(() => {
    void refreshStatus()
    const timer = window.setInterval(() => void refreshStatus(), 8000)
    return () => {
      window.clearInterval(timer)
      controller.current?.abort()
    }
  }, [refreshStatus])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = async (text = draft) => {
    const content = text.trim()
    if (!content || sending || status !== 'ready') return

    const userMessage: DisplayMessage = {
      id: nextId.current++,
      role: 'user',
      content,
      thinking: '',
    }
    const assistantId = nextId.current++
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', thinking: '' },
    ])
    setDraft('')
    setNotice('')
    setSending(true)

    const history: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are NEURON, a concise educational tutor. Teach AI, machine learning, neural networks, the NEURON simulator, and beginner programming. Explain concepts clearly with small examples. Be honest when uncertain. Keep the final answer focused and do not hide your reasoning; provide a clear answer after your thinking.',
      },
      ...messages.map(({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      })),
      { role: 'user', content },
    ]

    const activeController = new AbortController()
    controller.current = activeController

    try {
      await streamChat(history, activeController.signal, (update) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: update.answer, thinking: update.thinking }
              : message,
          ),
        )
      })
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        const message = error instanceof Error ? error.message : 'The local AI request failed.'
        setNotice(message)
        setStatus('error')
        onStatusChange('error')
      }
    } finally {
      if (controller.current === activeController) controller.current = null
      setSending(false)
      inputRef.current?.focus()
      void refreshStatus()
    }
  }

  const stop = () => controller.current?.abort()

  return (
    <div className="space-y-4">
      <Panel
        code="02"
        title="LOCAL AI TUTOR"
        aside={<StatusChip status={checking && status === 'checking' ? 'checking' : status} />}
      >
        <div className="space-y-5">
          {status === 'ready' ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Readout label="MODEL" value="Qwen3-0.6B" />
                <Readout label="RUNTIME" value="llama.cpp · CPU" />
                <Readout label="ADDRESS" value="127.0.0.1:8080" />
                <Readout label="CONTEXT" value="4,096 tokens" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">Running locally. Your prompts stay on this computer.</p>
                <button type="button" className={btn} onClick={() => void refreshStatus()} disabled={checking}>
                  {checking ? 'Checking…' : 'Check again'}
                </button>
              </div>
            </>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-hi" aria-hidden="true" />
                  <p className="font-mono text-xs uppercase tracking-wider text-hi">
                    {status === 'loading' ? 'MODEL LOADING' : status === 'error' ? 'SERVER NEEDS ATTENTION' : 'LOCAL MODEL NOT RUNNING'}
                  </p>
                </div>
                <h3 className="text-lg font-medium text-ink">
                  {status === 'loading'
                    ? 'Qwen3 is starting up.'
                    : status === 'error'
                      ? 'The local server responded with an error.'
                      : 'Start your offline tutor.'}
                </h3>
                <p className="max-w-xl text-sm text-muted">
                  {status === 'error'
                    ? 'Check the llama-server terminal for its error message, then restart ai/start-ai.bat.'
                    : 'Open NEURON from localhost to use the tutor. It connects only to llama.cpp on this computer and never downloads a model or contacts a cloud AI service.'}
                </p>
                <button type="button" className={btn} onClick={() => void refreshStatus()} disabled={checking}>
                  {checking ? 'Checking…' : 'Check again'}
                </button>
              </div>
              <div className="rounded-lg border border-dashed border-line/70 bg-bg/60 p-4">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Setup checklist</p>
                <ol className="space-y-3">
                  {setupSteps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line font-mono text-xs text-hi">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Panel
        code="02.1"
        title="TUTOR CHAT"
        aside={<span className="font-mono text-[10px] text-muted">OFFLINE · THINKING ENABLED</span>}
      >
        <div className="space-y-4">
          {status !== 'ready' && (
            <div className="rounded-lg border border-dashed border-line/60 bg-bg/40 px-4 py-8 text-center">
              <p className="text-sm font-medium text-ink">Chat is waiting for the local model.</p>
              <p className="mt-1 text-xs text-muted">Start llama-server to unlock the conversation.</p>
            </div>
          )}

          {status === 'ready' && messages.length === 0 && (
            <div className="rounded-lg border border-line/50 bg-bg/50 px-4 py-6">
              <p className="text-sm font-medium text-ink">What would you like to understand?</p>
              <p className="mt-1 text-xs text-muted">Ask about neural networks, training, or the experiments in CORE.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={btn}
                    onClick={() => void send(suggestion)}
                    disabled={sending}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="max-h-[min(58vh,560px)] space-y-4 overflow-y-auto pr-1" aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={message.role === 'user'
                    ? 'ml-auto max-w-[88%] rounded-lg border border-hi/30 bg-hi/10 px-4 py-3'
                    : 'mr-auto max-w-[96%] rounded-lg border border-line/60 bg-bg/70 px-4 py-3'}
                >
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {message.role === 'user' ? 'YOU' : 'NEURON · QWEN3'}
                  </p>
                  {message.thinking && (
                    <details className="mb-3 rounded-md border border-line/50 bg-surface/70 px-3 py-2" open={sending && message.id === messages[messages.length - 1]?.id}>
                      <summary className="cursor-pointer select-none text-xs font-medium text-hi">
                        Thinking process
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">{message.thinking}</p>
                    </details>
                  )}
                  {message.content ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{message.content}</p>
                  ) : message.role === 'assistant' && sending ? (
                    <p className="text-xs text-muted">Thinking…</p>
                  ) : null}
                </article>
              ))}
              <div ref={endRef} />
            </div>
          )}

          {notice && (
            <div role="alert" className="rounded-md border border-neg/40 bg-neg/10 px-3 py-2 text-xs text-neg">
              {notice}
            </div>
          )}

          <form
            className="space-y-2 border-t border-white/[0.07] pt-4"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            <label htmlFor="ai-prompt" className="font-mono text-[10px] uppercase tracking-wider text-muted">
              MESSAGE THE LOCAL TUTOR
            </label>
            <textarea
              ref={inputRef}
              id="ai-prompt"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
              disabled={status !== 'ready' || sending}
              placeholder={status === 'ready' ? 'Ask NEURON something… (Enter to send)' : 'Start the local model to chat'}
              rows={3}
              className="w-full resize-y rounded-md border border-line/70 bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted">Thinking is enabled. Replies may take a moment.</p>
              {sending ? (
                <button type="button" className={btn} onClick={stop}>Stop response</button>
              ) : (
                <button type="submit" className={btnPrimary} disabled={status !== 'ready' || !draft.trim()}>
                  Send message
                </button>
              )}
            </div>
          </form>
        </div>
      </Panel>
      <p className="px-1 text-[11px] leading-relaxed text-muted">
        Local model outputs can be incorrect. Check important information, especially code and technical explanations.
        The tutor is available only while the llama.cpp server is running at {AI_SERVER_URL}.
      </p>
    </div>
  )
}
