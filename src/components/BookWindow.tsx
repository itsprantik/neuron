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

const WIDTH = 440
const MARGIN = 16

/** Keeps the window fully on screen. */
function clamp(x: number, y: number, h: number): { x: number; y: number } {
  const maxX = Math.max(MARGIN, window.innerWidth - Math.min(WIDTH, window.innerWidth - 2 * MARGIN) - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - Math.min(h, window.innerHeight - 2 * MARGIN) - MARGIN)
  return { x: Math.min(Math.max(MARGIN, x), maxX), y: Math.min(Math.max(MARGIN, y), maxY) }
}

/**
 * Floating "Book": a short summary of every lesson, built from the lesson data so it can never
 * disagree with the lessons. Drag it by the title bar; Esc or Close shuts it. The page stays usable.
 */
export function BookWindow({ done, onClose }: BookWindowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [pos, setPos] = useState(() => clamp(window.innerWidth - WIDTH - 24, 84, 600))

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: { key: string }) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.x, p.y, ref.current?.offsetHeight ?? 600))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const startDrag = (e: PointerLike) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const moveDrag = (e: PointerLike) => {
    if (drag.current) setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy, ref.current?.offsetHeight ?? 600))
  }
  const endDrag = () => {
    drag.current = null
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Book: summary of all lessons"
      tabIndex={-1}
      style={{
        left: pos.x,
        top: pos.y,
        width: `min(${WIDTH}px, calc(100vw - ${2 * MARGIN}px))`,
        maxHeight: `calc(100vh - ${pos.y}px - ${MARGIN}px)`,
      }}
      className={`${glassStrong} fixed z-40 flex flex-col rounded-2xl outline-none`}
    >
      <div
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex cursor-grab touch-none select-none items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 active:cursor-grabbing"
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

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
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