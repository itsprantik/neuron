import { useEffect, useRef, useState } from 'react'
import { glassStrong } from './glass'
import { btn, btnPrimary } from './Panel'

interface NeuronHelpProps {
  onClose: () => void
  /** Opens the interactive "Meet a neuron" lesson. */
  onOpenLesson: () => void
}

interface PointerLike {
  clientX: number
  clientY: number
  pointerId: number
  currentTarget: { setPointerCapture(id: number): void }
}

const WIDTH = 400
const MARGIN = 16

/** Keeps the window fully on screen. */
function clamp(x: number, y: number, h: number): { x: number; y: number } {
  const maxX = Math.max(MARGIN, window.innerWidth - Math.min(WIDTH, window.innerWidth - 2 * MARGIN) - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - Math.min(h, window.innerHeight - 2 * MARGIN) - MARGIN)
  return { x: Math.min(Math.max(MARGIN, x), maxX), y: Math.min(Math.max(MARGIN, y), maxY) }
}

/** A tiny picture of one neuron: two clues in, one answer out. */
function Picture() {
  return (
    <svg viewBox="0 0 360 120" role="img" aria-label="Two clues go into a neuron, which gives one answer." className="block w-full rounded-md border border-line/60 bg-bg">
      <g stroke="var(--color-pos)" strokeWidth="2">
        <line x1="70" y1="36" x2="200" y2="60" />
      </g>
      <g stroke="var(--color-neg)" strokeWidth="1.5" strokeDasharray="5 4">
        <line x1="70" y1="86" x2="200" y2="60" />
      </g>
      <line x1="224" y1="60" x2="290" y2="60" stroke="var(--color-line)" strokeWidth="2" />
      <circle cx="52" cy="36" r="18" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="1.5" />
      <circle cx="52" cy="86" r="18" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="1.5" />
      <circle cx="212" cy="60" r="24" fill="var(--color-surface)" stroke="var(--color-hi)" strokeWidth="2" />
      <circle cx="310" cy="60" r="18" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="1.5" />
      <g className="fill-ink font-mono" fontSize="11" textAnchor="middle">
        <text x="52" y="40">clue</text>
        <text x="52" y="90">clue</text>
        <text x="212" y="64">neuron</text>
        <text x="310" y="64">answer</text>
      </g>
      <g className="fill-muted font-mono" fontSize="10" textAnchor="middle">
        <text x="132" y="38">weight</text>
        <text x="132" y="96">weight</text>
      </g>
    </svg>
  )
}

const steps: { title: string; text: string }[] = [
  { title: 'Clues come in', text: 'Each clue is just a number. For an umbrella: how cloudy is it (0.8) and what does the forecast say (0.3)?' },
  { title: 'Each clue gets a weight', text: 'The weight says how much you care about that clue. A big weight means “this clue matters a lot”. A negative weight pushes the other way.' },
  { title: 'Add it all up', text: 'Multiply each clue by its weight, add the results, then add the bias (your habit before seeing any clue). This total is called z.' },
  { title: 'Squash it into an answer', text: 'An activation function bends z into a neat answer, for example between 0 (no) and 1 (yes). That is the neuron’s output.' },
]

/**
 * A small floating help window. You can drag it by its title bar, close it with Esc or the Close button,
 * and keep using the app while it is open (it does not block anything).
 */
export function NeuronHelp({ onClose, onOpenLesson }: NeuronHelpProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [pos, setPos] = useState(() => clamp(window.innerWidth - WIDTH - 24, 84, 560))

  // Move keyboard focus into the window when it opens; close on Escape.
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: { key: string }) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Keep it on screen if the browser window is resized.
  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.x, p.y, ref.current?.offsetHeight ?? 560))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const startDrag = (e: PointerLike) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const moveDrag = (e: PointerLike) => {
    if (!drag.current) return
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy, ref.current?.offsetHeight ?? 560))
  }
  const endDrag = () => {
    drag.current = null
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="What is a neuron?"
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
          <span className="mr-2 rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] font-normal text-hi">?</span>
          What is a neuron?
        </h2>
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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-[15px] leading-snug">
          A neuron is a <span className="text-hi">tiny decision-maker</span>. It takes a few numbers in, thinks about
          how much each one matters, and gives back <span className="text-hi">one number</span>.
        </p>

        <Picture />

        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-hi font-mono text-[11px] font-semibold text-bg">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-md border border-line/50 bg-bg px-3 py-2.5 font-mono text-xs leading-relaxed">
          <p className="text-muted">Umbrella example</p>
          <p>0.8 × 1.5 + 0.3 × 2.0 − 1.0 = <span className="text-hi">0.8</span> (z)</p>
          <p>sigmoid(0.8) ≈ <span className="text-hi">0.69</span> → probably yes</p>
        </div>

        <p className="text-muted">
          A <span className="text-ink">neural network</span> is many neurons wired together: each neuron’s answer
          becomes a clue for the next. <span className="text-ink">Training</span> means finding weights and biases that
          make the final answers right. In the lab, each circle is a neuron and the number inside is its answer.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
        <button type="button" className={btnPrimary} onClick={onOpenLesson}>
          Try it with sliders
        </button>
        <button type="button" className={btn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
