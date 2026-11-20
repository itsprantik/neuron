
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  checkAiServer,
  streamChat,
  type AiServerStatus,
  type ChatMessage,
} from '../ai/client'

import { Panel, Chip, btn, btnPrimary } from '../components/Panel'

const SYSTEM_PROMPT = `
You are NEURON, an offline educational AI tutor.

Your purpose is to help students understand:
- Artificial intelligence
- Machine learning
- Neural networks
- Deep learning
- Programming
- Mathematics behind AI

Explain concepts clearly using examples.
Adapt explanations to the student's level.
Be accurate and admit uncertainty.
Do not claim to have internet access.
Do not invent information about the NEURON application.
Give concise explanations rather than unnecessarily long answers.
When appropriate, provide code examples and explain them.
When useful, provide a short explanation of your answer.
`

interface DisplayMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  thinking: string
}

export function AIPage() {
  const [status, setStatus] = useState<AiServerStatus>('checking')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showThinking, setShowThinking] = useState<
    Record<number, boolean>
  >({})

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageId = useRef(0)

  // Check the local llama.cpp server.
  const refreshStatus = useCallback(async () => {
    setStatus('checking')

    try {
      const serverStatus = await checkAiServer()
      setStatus(serverStatus)
    } catch {
      setStatus('offline')
    }
  }, [])

  // Initial server check and periodic status refresh.
  useEffect(() => {
    void refreshStatus()

    const interval = window.setInterval(() => {
      void refreshStatus()
    }, 10000)

    return () => window.clearInterval(interval)
  }, [refreshStatus])

  // Keep the latest message visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages])

  // Send a message to the local model.
  const sendMessage = async () => {
    const text = input.trim()

    if (!text || loading) return

    if (status !== 'ready') {
      setError('Start the local AI server before sending a message.')
      return
    }

    setError(null)
    setInput('')
    setLoading(true)

    const userMessage: DisplayMessage = {
      id: ++messageId.current,
      role: 'user',
      content: text,
      thinking: '',
    }

    const assistantMessage: DisplayMessage = {
      id: ++messageId.current,
      role: 'assistant',
      content: '',
      thinking: '',
    }

    // Add both messages to the visible conversation.
    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ])

    // Build the model conversation.
    // Previous assistant messages are included, but thinking output
    // is not sent back as conversation content.
    const conversation: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: 'user',
        content: text,
      },
    ]

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat(
        conversation,
        controller.signal,
        (update) => {
          setMessages((current) =>
            current.map((message) => {
              if (message.id !== assistantMessage.id) {
                return message
              }

              return {
                ...message,
                thinking: update.thinking,
                content: update.answer,
              }
            }),
          )
        },
      )
    } catch (err) {
      if (controller.signal.aborted) {
        setError('Response stopped.')
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong.',
        )
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }

      setLoading(false)
      void refreshStatus()
    }
  }

  // Stop receiving the current response.
  const stopResponse = () => {
    abortRef.current?.abort()
  }

  // Clear the conversation.
  const clearConversation = () => {
    if (loading) return

    setMessages([])
    setError(null)
    setShowThinking({})
  }

  // Status badge styling.
  const statusTone =
    status === 'ready'
      ? 'good'
      : status === 'offline' || status === 'error'
        ? 'warn'
        : 'idle'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] text-hi">
            MODULE 02 / LOCAL INFERENCE
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            NEURON AI
          </h1>

          <p className="mt-2 max-w-xl text-sm text-muted">
            Your offline AI learning companion, powered by
            Qwen3 and llama.cpp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={statusTone}>
            {status === 'ready'
              ? 'LOCAL SERVER ONLINE'
              : status === 'checking'
                ? 'CHECKING SERVER'
                : status === 'loading'
                  ? 'LOADING MODEL'
                  : status === 'error'
                    ? 'SERVER ERROR'
                    : 'SERVER OFFLINE'}
          </Chip>

          <button
            type="button"
            className={btn}
            onClick={() => void refreshStatus()}
            disabled={status === 'checking'}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        {/* Conversation panel */}
        <Panel
          code="AI.01"
          title="Conversation"
          aside={
            <button
              type="button"
              className={btn}
              onClick={clearConversation}
              disabled={loading || messages.length === 0}
            >
              Clear
            </button>
          }
        >
          <div className="flex min-h-[420px] flex-col">
            <div
              className="flex-1 space-y-5 overflow-y-auto pr-1"
              aria-live="polite"
              aria-label="AI conversation"
            >
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-hi/30 bg-hi/10 font-mono text-2xl text-hi">
                    N
                  </div>

                  <h2 className="text-lg font-medium">
                    Ready to learn?
                  </h2>

                  <p className="mt-2 max-w-sm text-sm text-muted">
                    Ask NEURON about neural networks, AI,
                    programming or your experiments.
                  </p>

                  <p className="mt-4 font-mono text-[11px] text-muted">
                    POWERED LOCALLY · NO CLOUD API
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[95%] ${
                    message.role === 'user'
                      ? 'ml-auto'
                      : 'mr-auto'
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {message.role === 'user' ? 'YOU' : 'NEURON'}
                    </span>

                    {message.role === 'assistant' &&
                      message.thinking && (
                        <button
                          type="button"
                          className="font-mono text-[10px] text-hi hover:underline"
                          onClick={() =>
                            setShowThinking((current) => ({
                              ...current,
                              [message.id]: !current[message.id],
                            }))
                          }
                        >
                          {showThinking[message.id]
                            ? 'HIDE THINKING'
                            : 'SHOW THINKING'}
                        </button>
                      )}
                  </div>

                  {/* Thinking output */}
                  {message.role === 'assistant' &&
                    showThinking[message.id] &&
                    message.thinking && (
                      <div className="mb-2 rounded-lg border border-hi/20 bg-hi/[0.05] p-3">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hi">
                          MODEL THINKING OUTPUT
                        </p>

                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
                          {message.thinking}
                        </p>
                      </div>
                    )}

                  {/* Message content */}
                  <div
                    className={`rounded-xl border px-4 py-3 ${
                      message.role === 'user'
                        ? 'border-hi/30 bg-hi/10'
                        : 'border-line/60 bg-bg'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content ||
                        (loading && message.role === 'assistant'
                          ? 'Thinking...'
                          : '')}
                    </p>
                  </div>
                </article>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-neg/30 bg-neg/10 px-3 py-2 text-xs text-neg"
              >
                {error}
              </div>
            )}

            {/* Input */}
            <form
              className="mt-5 flex gap-2 border-t border-line/50 pt-4"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage()
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={loading || status !== 'ready'}
                placeholder={
                  status === 'ready'
                    ? 'Ask something about AI...'
                    : 'Start the local AI server first...'
                }
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-hi disabled:opacity-50"
              />

              {loading ? (
                <button
                  type="button"
                  className={btn}
                  onClick={stopResponse}
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={!input.trim() || status !== 'ready'}
                >
                  Send
                </button>
              )}
            </form>
          </div>
        </Panel>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Model information */}
          <Panel code="AI.02" title="Model">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-muted">MODEL</p>
                <p className="mt-1 text-sm font-medium">
                  Qwen3 0.6B Q8_0
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted">ENGINE</p>
                <p className="mt-1 text-sm">llama.cpp</p>
              </div>

              <div>
                <p className="text-[11px] text-muted">CONNECTION</p>
                <p className="mt-1 break-all font-mono text-xs">
                  127.0.0.1:8080
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted">MODE</p>
                <p className="mt-1 text-sm">Offline inference</p>
              </div>
            </div>
          </Panel>

          {/* Suggested prompts */}
          <Panel code="AI.03" title="Learning prompts">
            <div className="space-y-2">
              {[
                'What is a neural network?',
                'Explain backpropagation.',
                'What are activation functions?',
                'How does Qwen3 work?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading || status !== 'ready'}
                  onClick={() => setInput(prompt)}
                  className="w-full rounded-lg border border-line/60 bg-bg px-3 py-2 text-left text-xs transition hover:border-hi/50 disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Panel>

          {/* Privacy */}
          <Panel code="AI.04" title="Privacy">
            <p className="text-xs leading-relaxed text-muted">
              Messages are sent to your local llama.cpp
              server on this computer. This interface does
              not use a cloud AI API.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
