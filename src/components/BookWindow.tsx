import { useEffect, useRef, useState } from 'react'
import { LESSONS } from '../academy/lessons'
import { glassStrong } from './glass'
import { btn } from './Panel'

interface BookWindowProps {
  done: string[]
  onClose: () => void
}

interface PointerLike {
  clientX: number
  clientY: number
  pointerId: number
  currentTarget: { setPointerCapture(id: number): void }
}

interface KeyLike {
  key: string
  shiftKey: boolean
  target: unknown
  currentTarget: unknown
  preventDefault(): void
  stopPropagation(): void
}

const WIDTH = 440
const MARGIN = 16
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}
const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hi/70'

/** Keeps the window fully on screen. */
function clamp(x: number, y: number, h: number): { x: number; y: number } {
  const maxX = Math.max(MARGIN, window.innerWidth - Math.min(WIDTH, window.innerWidth - 2 * MARGIN) - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - Math.min(h, window.innerHeight - 2 * MARGIN) - MARGIN)
  return { x: Math.min(Math.max(MARGIN, x), maxX), y: Math.min(Math.max(MARGIN, y), maxY) }
}

/**
 * Floating "Book": a short summary of every lesson, built from the lesson data so it can never
 * disagree with the lessons. It is a non-modal window: the page behind it stays usable.
 * Keyboard: Esc closes it (while focus is inside it), and with the title bar focused the arrow keys
 * move it (Shift = bigger steps). Closing returns focus to whatever opened it. Drag with the mouse too.
 */
export function BookWindow({ done, onClose }: BookWindowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [pos, setPos] = useState(() => clamp(window.innerWidth - WIDTH - 24, 84, 600))

  // The parent may pass a new onClose on every render. Keeping it in a ref means the window is
  // focused once when it opens, and never again while you work on the page behind it.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => {
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.x, p.y, ref.current?.offsetHeight ?? 600))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const height = () => ref.current?.offsetHeight ?? 600

  const startDrag = (e: PointerLike) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const moveDrag = (e: PointerLike) => {
    if (drag.current) setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy, height()))
  }
  const endDrag = () => {
    drag.current = null
  }

  /** Esc closes the Book only when focus is inside it, and does not also close other windows. */
  const onWindowKey = (e: KeyLike) => {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    closeRef.current()
  }

  /** Arrow keys move the window while the title bar itself has focus. */
  const onTitleKey = (e: KeyLike) => {
    const step = ARROWS[e.key]
    if (!step || e.target !== e.currentTarget) return
    e.preventDefault()
    const size = e.shiftKey ? 64 : 16
    setPos((p) => clamp(p.x + step[0] * size, p.y + step[1] * size, height()))
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Book: summary of all lessons"
      tabIndex={-1}
      onKeyDown={onWindowKey}
      style={{
        left: pos.x,
        top: pos.y,
        width: `min(${WIDTH}px, calc(100vw - ${2 * MARGIN}px))`,
        maxHeight: `calc(100vh - ${pos.y}px - ${MARGIN}px)`,
      }}
      className={`${glassStrong} fixed z-40 flex flex-col rounded-2xl outline-none`}
    >
      <div
        role="group"
        tabIndex={0}
        aria-label="Book title bar. Use the arrow keys to move the window, Shift for bigger steps."
        onKeyDown={onTitleKey}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`${FOCUS_RING} flex cursor-grab touch-none select-none items-center justify-between gap-3 rounded-t-2xl border-b border-white/10 px-4 py-2.5 active:cursor-grabbing`}
      >
        <h2 className="text-sm font-medium">
          <span className="mr-2 rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] font-normal text-hi">04.B</span>
          Book
        </h2>
        <span className="font-mono text-xs text-muted">
          {done.length} of {LESSONS.length} lessons done
        </span>
        <button
          type="button"
          onClick={onClose}
          onPointerDown={(e: { stopPropagation(): void }) => e.stopPropagation()}
          aria-label="Close"
          className="rounded px-2 py-0.5 font-mono text-sm text-muted transition-colors hover:bg-bg hover:text-ink"
        >
          ✕
        </button>
      </div>

      {/* Focusable so the keyboard can scroll it (arrow keys, Page Up/Down). */}
      <div
        role="region"
        tabIndex={0}
        aria-label="Lesson summaries"
        className={`${FOCUS_RING} min-h-0 flex-1 space-y-6 overflow-y-auto p-4`}
      >
        {LESSONS.map((l, i) => (
          <section key={l.id}>
            <h3 className="mb-1 flex items-center gap-2 font-medium text-hi">
              <span className="font-mono text-xs text-muted">{i + 1}</span>
              {l.title}
              {done.includes(l.id) && <span className="font-mono text-xs font-normal text-pos">done</span>}
            </h3>
            <p className="mb-2 text-muted">{l.summary}</p>
            {l.formula && (
              <p className="mb-2 overflow-x-auto rounded-md border border-line/50 bg-bg px-3 py-2 font-mono text-xs">{l.formula}</p>
            )}
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {l.check.map((q) => (
                <li key={q.q}>{q.why}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <button type="button" className={btn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}