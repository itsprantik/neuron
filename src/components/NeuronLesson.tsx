import { useState } from 'react'
import { sigmoid } from '../core/activations'
import { Panel, btn } from './Panel'

interface State {
  x1: number // "weather is good" 0..1
  x2: number // "friends are free" 0..1
  w1: number
  w2: number
  b: number
}

const START: State = { x1: 0.8, x2: 0.3, w1: 1.5, w2: 1, b: -1.2 }

const PRESETS: { label: string; state: State }[] = [
  { label: 'Only weather matters', state: { x1: 0.8, x2: 0.3, w1: 2, w2: 0, b: -1 } },
  { label: 'Friends matter most', state: { x1: 0.8, x2: 0.3, w1: 0.5, w2: 2, b: -1 } },
  { label: 'Always keen to play', state: { x1: 0.2, x2: 0.2, w1: 0.5, w2: 0.5, b: 2 } },
]

const signed = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2)

interface RowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

function Row({ label, value, min, max, step, onChange, format = signed }: RowProps) {
  return (
    <label className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-hi"
      />
      <span className="text-right font-mono text-xs tabular-nums">{format(value)}</span>
    </label>
  )
}

function Heading({ children }: { children: string }) {
  return (
    <h3 className="mb-2 mt-4 font-mono text-[11px] uppercase tracking-wider text-hi first:mt-0">
      {children}
    </h3>
  )
}

function Neuron({ s, z, a }: { s: State; z: number; a: number }) {
  const edge = (w: number) => ({
    stroke: w >= 0 ? 'var(--color-pos)' : 'var(--color-neg)',
    strokeWidth: 0.8 + Math.min(Math.abs(w), 2) * 1.6,
    strokeDasharray: w >= 0 ? undefined : '5 4',
  })
  return (
    <svg
      viewBox="0 0 360 170"
      role="img"
      aria-label={`One neuron. Two inputs go in, one answer comes out: ${Math.round(a * 100)} percent.`}
      className="blueprint-grid block w-full rounded-md border border-line/60 bg-bg"
    >
      <line x1="62" y1="52" x2="168" y2="85" {...edge(s.w1)} />
      <line x1="62" y1="124" x2="168" y2="85" {...edge(s.w2)} />
      <line x1="200" y1="85" x2="290" y2="85" stroke="var(--color-line)" strokeWidth="1.5" />

      <text x="115" y="58" textAnchor="middle" className="fill-ink font-mono" fontSize="10">
        ×{signed(s.w1)}
      </text>
      <text x="115" y="132" textAnchor="middle" className="fill-ink font-mono" fontSize="10">
        ×{signed(s.w2)}
      </text>

      {[
        { y: 52, v: s.x1, name: 'weather' },
        { y: 124, v: s.x2, name: 'friends' },
      ].map((n) => (
        <g key={n.name}>
          <circle cx="44" cy={n.y} r="18" fill="var(--color-bg)" stroke="var(--color-line)" strokeWidth="1.5" />
          <circle cx="44" cy={n.y} r="18" fill="var(--color-pos)" fillOpacity={n.v * 0.45} />
          <text x="44" y={n.y + 3.5} textAnchor="middle" className="fill-ink font-mono" fontSize="10">
            {n.v.toFixed(1)}
          </text>
          <text x="44" y={n.y + 34} textAnchor="middle" className="fill-muted font-mono" fontSize="9">
            {n.name}
          </text>
        </g>
      ))}

      <circle cx="184" cy="85" r="30" fill="var(--color-bg)" stroke="var(--color-hi)" strokeWidth="2" />
      <text x="184" y="82" textAnchor="middle" className="fill-muted font-mono" fontSize="9">
        z = {signed(z)}
      </text>
      <text x="184" y="95" textAnchor="middle" className="fill-ink font-mono" fontSize="10">
        a = {a.toFixed(2)}
      </text>
      <text x="184" y="132" textAnchor="middle" className="fill-hi font-mono" fontSize="9">
        THE NEURON
      </text>

      <circle cx="312" cy="85" r="22" fill="var(--color-bg)" stroke="var(--color-line)" strokeWidth="1.5" />
      <circle cx="312" cy="85" r="22" fill="var(--color-pos)" fillOpacity={a * 0.45} />
      <text x="312" y="89" textAnchor="middle" className="fill-ink font-mono" fontSize="11">
        {Math.round(a * 100)}%
      </text>
      <text x="312" y="126" textAnchor="middle" className="fill-muted font-mono" fontSize="9">
        play?
      </text>
    </svg>
  )
}

export function NeuronLesson() {
  const [s, setS] = useState<State>(START)
  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }))

  const p1 = s.x1 * s.w1
  const p2 = s.x2 * s.w2
  const z = p1 + p2 + s.b
  const a = sigmoid(z)

  return (
    <Panel code="01.0" title="START HERE — WHAT IS A NEURON?">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="max-w-prose">
            A neuron is a <span className="text-hi">tiny decision-maker</span>. It takes in some numbers, decides
            how much each one matters, adds them up, and gives back one number. A neural network is just many of
            these connected together.
          </p>
          <p className="mt-3 max-w-prose text-muted">
            Example: one neuron deciding <span className="text-ink">“Should I play cricket today?”</span> Move the
            sliders and watch the answer change.
          </p>

          <div className="mt-4 space-y-2">
            <Heading>1 · Inputs (what is happening today, 0 to 1)</Heading>
            <Row label="Weather is good" value={s.x1} min={0} max={1} step={0.1} format={(v) => v.toFixed(1)} onChange={(x1) => set({ x1 })} />
            <Row label="Friends are free" value={s.x2} min={0} max={1} step={0.1} format={(v) => v.toFixed(1)} onChange={(x2) => set({ x2 })} />

            <Heading>2 · Weights (how much each thing matters to you)</Heading>
            <Row label="Weather matters" value={s.w1} min={-2} max={2} step={0.1} onChange={(w1) => set({ w1 })} />
            <Row label="Friends matter" value={s.w2} min={-2} max={2} step={0.1} onChange={(w2) => set({ w2 })} />

            <Heading>3 · Bias (how keen you are anyway)</Heading>
            <Row label="Bias" value={s.b} min={-2} max={2} step={0.1} onChange={(b) => set({ b })} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className={btn} onClick={() => setS(p.state)}>
                {p.label}
              </button>
            ))}
            <button type="button" className={btn} onClick={() => setS(START)}>
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Neuron s={s} z={z} a={a} />

          <table className="w-full font-mono text-xs tabular-nums">
            <tbody>
              <tr>
                <td className="py-1 text-muted">weather</td>
                <td className="py-1">
                  {s.x1.toFixed(1)} × {signed(s.w1)}
                </td>
                <td className="py-1 text-right">= {signed(p1)}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted">friends</td>
                <td className="py-1">
                  {s.x2.toFixed(1)} × {signed(s.w2)}
                </td>
                <td className="py-1 text-right">= {signed(p2)}</td>
              </tr>
              <tr className="border-t border-line/60">
                <td className="py-1 text-muted">bias</td>
                <td />
                <td className="py-1 text-right">{signed(s.b)}</td>
              </tr>
              <tr className="border-t border-line/60">
                <td className="py-1 text-hi">z</td>
                <td className="py-1 text-muted">add everything up</td>
                <td className="py-1 text-right text-hi">{signed(z)}</td>
              </tr>
              <tr>
                <td className="py-1 text-hi">a</td>
                <td className="py-1 text-muted">sigmoid(z): squash into 0 to 1</td>
                <td className="py-1 text-right text-hi">{a.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>

          <div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-line/60 bg-bg" aria-hidden="true">
              <div className="h-full bg-pos" style={{ width: `${a * 100}%` }} />
            </div>
            <p className="mt-2">
              Answer: <span className="font-mono text-hi">{Math.round(a * 100)}%</span> keen to play →{' '}
              {a >= 0.5 ? 'probably yes' : 'probably not'}
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-line/60 pt-4 text-xs md:grid-cols-3">
        <div>
          <dt className="font-mono uppercase tracking-wider text-hi">Weight</dt>
          <dd className="mt-1 text-muted">
            How much one input matters. Big positive = pushes towards “yes”. Negative = pushes towards “no”. Zero
            = ignored.
          </dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-wider text-hi">Bias</dt>
          <dd className="mt-1 text-muted">
            A built-in lean. Positive = easily says yes even with weak inputs. Negative = needs strong reasons.
          </dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-wider text-hi">Activation (sigmoid)</dt>
          <dd className="mt-1 text-muted">
            Turns any number z into a smooth answer between 0 and 1, like a confidence. The lab below uses this
            same neuron many times.
          </dd>
        </div>
      </dl>
    </Panel>
  )
}
