export const AI_SERVER_URL = 'http://127.0.0.1:8080'

export type AiServerStatus = 'checking' | 'offline' | 'loading' | 'ready' | 'error'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamUpdate {
  thinking: string
  answer: string
}

interface ChatChunk {
  choices?: Array<{
    delta?: {
      content?: string | null
      reasoning_content?: string | null
    }
  }>
  error?: { message?: string }
}

export async function checkAiServer(signal?: AbortSignal): Promise<AiServerStatus> {
  try {
    const response = await fetch(`${AI_SERVER_URL}/health`, {
      method: 'GET',
      signal,
      cache: 'no-store',
    })

    if (response.ok) return 'ready'
    if (response.status === 503) return 'loading'
    return 'error'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return 'offline'
  }
}

/**
 * Streams an OpenAI-compatible llama.cpp chat completion.
 * Thinking text is kept separate from the final answer when the model exposes
 * reasoning_content or wraps it in <think>...</think> tags.
 */
export async function streamChat(
  messages: ChatMessage[],
  signal: AbortSignal,
  onUpdate: (update: StreamUpdate) => void,
): Promise<void> {
  const response = await fetch(`${AI_SERVER_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: 'Qwen3-0.6B',
      messages,
      stream: true,
      temperature: 0.7,
      top_p: 0.8,
      top_k: 20,
      min_p: 0,
      presence_penalty: 1.5,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Local AI server returned HTTP ${response.status}`)
  }

  if (!response.body) throw new Error('The local AI server did not provide a response stream.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let pendingContent = ''
  let inThinkTag = false
  let thinking = ''
  let answer = ''

  const publish = () => onUpdate({ thinking, answer })

  const appendContent = (chunk: string) => {
    pendingContent += chunk

    while (pendingContent) {
      if (inThinkTag) {
        const end = pendingContent.indexOf('</think>')
        if (end >= 0) {
          thinking += pendingContent.slice(0, end)
          pendingContent = pendingContent.slice(end + '</think>'.length)
          inThinkTag = false
          publish()
          continue
        }
        const safeLength = Math.max(0, pendingContent.length - '</think>'.length + 1)
        if (safeLength > 0) {
          thinking += pendingContent.slice(0, safeLength)
          pendingContent = pendingContent.slice(safeLength)
          publish()
        }
        break
      }

      const start = pendingContent.indexOf('<think>')
      if (start >= 0) {
        answer += pendingContent.slice(0, start)
        pendingContent = pendingContent.slice(start + '<think>'.length)
        inThinkTag = true
        publish()
        continue
      }

      const safeLength = Math.max(0, pendingContent.length - '<think>'.length + 1)
      if (safeLength > 0) {
        answer += pendingContent.slice(0, safeLength)
        pendingContent = pendingContent.slice(safeLength)
        publish()
      }
      break
    }
  }

  const handleEvent = (event: string) => {
    const data = event
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n')

    if (!data || data === '[DONE]') return

    let chunk: ChatChunk
    try {
      chunk = JSON.parse(data) as ChatChunk
    } catch {
      return
    }

    if (chunk.error?.message) throw new Error(chunk.error.message)

    const delta = chunk.choices?.[0]?.delta
    if (delta?.reasoning_content) {
      thinking += delta.reasoning_content
      publish()
    }
    if (delta?.content) appendContent(delta.content)
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        handleEvent(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }

      if (done) break
    }

    if (buffer.trim()) handleEvent(buffer)
    if (pendingContent) {
      if (inThinkTag) thinking += pendingContent
      else answer += pendingContent
      pendingContent = ''
    }
    publish()
  } finally {
    reader.releaseLock()
  }
}
