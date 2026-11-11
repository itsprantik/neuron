import { useState } from 'react'
import { ACTIVATIONS } from '../core/activations'
import type { ActivationName } from '../core/activations'
import { Chip, Panel, Segmented, btnPrimary } from './Panel'

const signed = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2)

interface State {
  x1: number
  x2: number
  w1: number
  w2: number
  b: number
  act: ActivationName
}

const START: State = { x1: 0.8, x2: 0.3, w1: 1.5, w2: 2, b: -1, act: 'sigmoid' }

interface SliderProps {
  label: string
  hint: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function Slider({ label, hint, value, min, max, onChange }: SliderProps) {
  return (
    <label className="block">
      <span className="grid grid-cols-[1fr_3.5rem] items-baseline gap-3">
        <span>{label}</span>
        <span className="text-right font-mono text-xs tabular-nums">{signed(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-hi"
      />
      <span className="text-[11px] text-muted">{hint}</span>
    </label>
  )
}

const CURVE_RANGE: Record<ActivationName, [number, number]> = {
  sigmoid: [0, 1],
  tanh: [-1, 1],
  relu: [0, 6],
}

function ActivationCurve({ act, z }: { act: ActivationName; z: number }) {
  const W = 300
  const H = 150
  const pad = 22
  const f = ACTIVATIONS[act].fn
  const [lo, hi] = CURVE_RANGE[act]
  const X = (v: number) => pad + ((v + 6) / 12) * (W - 2 * pad)
  const Y = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad)
  const pts = Array.from({ length: 61 }, (_, i) => {
    const v = -6 + i * 0.2
    return `${X(v).toFixed(1)},${Y(f(v)).toFixed(1)}`
  }).join(' ')
  const zc = Math.max(-6, Math.min(6, z))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${ACTIVATIONS[act].label} curve. Your total score z is ${z.toFixed(2)}, which gives ${f(z).toFixed(2)}.`}
      className="block w-full rounded-md border border-line/60 bg-bg"
    >
      <line x1={pad} x2={W - pad} y1={Y(Math.max(lo, 0))} y2={Y(Math.max(lo, 0))} stroke="white" strokeOpacity="0.25" />
      <line x1={X(0)} x2={X(0)} y1={pad} y2={H - pad} stroke="white" strokeOpacity="0.25" />
      <polyline points={pts} fill="none" stroke="var(--color-pos)" strokeWidth="2" />
      <line x1={X(zc)} x2={X(zc)} y1={Y(f(zc))} y2={H - pad} stroke="var(--color-hi)" strokeDasharray="3 3" />
      <circle cx={X(zc)} cy={Y(f(zc))} r="5" fill="var(--color-hi)" />
      <text x={pad} y={H - 6} className="fill-muted font-mono" fontSize="9">
        z = −6
      </text>
      <text x={W - pad} y={H - 6} textAnchor="end" className="fill-muted font-mono" fontSize="9">
        z = +6
      </text>
      <text x={pad} y={12} className="fill-muted font-mono" fontSize="9">
        output a
      </text>
    </svg>
  )
}

const ACT_MEANING: Record<ActivationName, (a: number) => string> = {
  sigmoid: (a) =>
    a >= 0.5
      ? 'Sigmoid answers between 0 and 1. This is closer to 1, so the neuron leans towards yes: take the umbrella.'
      : 'Sigmoid answers between 0 and 1. This is closer to 0, so the neuron leans towards no: leave the umbrella.',
  tanh: () => 'Tanh answers between −1 (strong no) and +1 (strong yes). Zero means undecided.',
  relu: () => 'ReLU answers 0 for any negative score, and the score itself when it is positive. A bigger number means a stronger yes.',
}

export function MeetNeuron({ onGoLab }: { onGoLab: () => void }) {
  const [s, setS] = useState<State>(START)
  const set = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }))

  const act = ACTIVATIONS[s.act]
  const p1 = s.w1 * s.x1
  const p2 = s.w2 * s.x2
  const z = p1 + p2 + s.b
  const a = act.fn(z)

  const sig = s.act === 'sigmoid'
  const c1 = sig && s.x1 >= 0.99 && s.x2 >= 0.99 && a > 0.9
  const c2 = sig && s.x1 <= 0.01 && s.x2 <= 0.01 && a < 0.1

  const lineStyle = (w: number) => ({
    stroke: w >= 0 ? 'var(--color-pos)' : 'var(--color-neg)',
    strokeWidth: 1 + Math.min(Math.abs(w), 3) * 1.2,
    strokeDasharray: w >= 0 ? undefined : '6 4',
  })

  return (
    <div className="space-y-4">
      <Panel code="00.A" title="What is a neuron?">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-prose space-y-3">
            <p className="text-base">
              A neuron is a tiny decision-maker. It looks at a few numbers (clues), decides how much each clue
              matters, and gives back one number as its answer.
            </p>
            <p className="text-muted">
              Think of deciding whether to take an umbrella. You check two clues: how cloudy the sky is, and
              what the forecast says. You care more about one clue than the other, and you also have a habit
              (some people always carry one). A neuron does exactly that with plain arithmetic.
            </p>
            <p className="text-muted">
              A whole neural network is just many of these neurons wired together. Training is the search for
              the weights and biases that make the answers come out right.
            </p>
            <button type="button" className={btnPrimary} onClick={onGoLab}>
              Go to the lab
            </button>
          </div>
          <dl className="grid content-start gap-y-2 text-sm">
            {[
              ['Input', 'A clue, as a number.'],
              ['Weight', 'How much you care about that clue. Negative means it pushes the other way.'],
              ['Bias', 'Your habit before you see any clue.'],
              ['z', 'The total score: all clues times their weights, plus the bias.'],
              ['Activation', 'A bend that turns z into a useful answer.'],
              ['Output', 'The neuron’s answer.'],
            ].map(([term, def]) => (
              <div key={term} className="grid grid-cols-[6rem_1fr] gap-3 border-b border-line pb-2">
                <dt className="font-mono text-xs text-hi">{term}</dt>
                <dd className="text-muted">{def}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Panel>

      <Panel
        code="00.B"
        title="Try one neuron"
        aside={
          <button type="button" className="font-mono text-xs hover:text-ink" onClick={() => setS(START)}>
            Reset sliders
          </button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Slider label="Clouds in the sky" hint="Clue 1: 0 = clear, 1 = overcast" value={s.x1} min={0} max={1} onChange={(v) => set({ x1: v })} />
            <Slider label="Rain in the forecast" hint="Clue 2: 0 = none, 1 = certain" value={s.x2} min={0} max={1} onChange={(v) => set({ x2: v })} />
            <Slider label="How much you care about clouds" hint="Weight 1" value={s.w1} min={-3} max={3} onChange={(v) => set({ w1: v })} />
            <Slider label="How much you care about the forecast" hint="Weight 2" value={s.w2} min={-3} max={3} onChange={(v) => set({ w2: v })} />
            <Slider label="Your habit" hint="Bias: positive = tends to say yes, negative = tends to say no" value={s.b} min={-3} max={3} onChange={(v) => set({ b: v })} />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Activation</span>
              <Segmented
                label="Activation function"
                value={s.act}
                options={(Object.keys(ACTIVATIONS) as ActivationName[]).map((id) => ({
                  value: id,
                  label: ACTIVATIONS[id].label,
                }))}
                onChange={(act) => set({ act })}
              />
            </div>
          </div>

          <div className="space-y-5">
            <svg
              viewBox="0 0 460 230"
              role="img"
              aria-label={`One neuron. Clouds ${s.x1.toFixed(2)} and forecast ${s.x2.toFixed(2)} go in, total score ${z.toFixed(2)}, output ${a.toFixed(2)}.`}
              className="blueprint-grid block w-full rounded-md border border-line/60 bg-bg"
            >
              <line x1="86" y1="70" x2="250" y2="115" {...lineStyle(s.w1)} />
              <line x1="86" y1="170" x2="250" y2="125" {...lineStyle(s.w2)} />
              <line x1="294" y1="120" x2="364" y2="120" stroke="var(--color-line)" strokeWidth="2" />
              <text x="168" y="82" textAnchor="middle" className="fill-ink font-mono" fontSize="11">
                × {signed(s.w1)}
              </text>
              <text x="168" y="168" textAnchor="middle" className="fill-ink font-mono" fontSize="11">
                × {signed(s.w2)}
              </text>

              <circle cx="60" cy="70" r="26" fill="var(--color-bg)" stroke="var(--color-line)" strokeWidth="1.5" />
              <text x="60" y="74" textAnchor="middle" className="fill-ink font-mono" fontSize="12">
                {s.x1.toFixed(2)}
              </text>
              <text x="60" y="112" textAnchor="middle" className="fill-muted" fontSize="10">
                clouds
              </text>
              <circle cx="60" cy="170" r="26" fill="var(--color-bg)" stroke="var(--color-line)" strokeWidth="1.5" />
              <text x="60" y="174" textAnchor="middle" className="fill-ink font-mono" fontSize="12">
                {s.x2.toFixed(2)}
              </text>
              <text x="60" y="212" textAnchor="middle" className="fill-muted" fontSize="10">
                forecast
              </text>

              <circle cx="272" cy="120" r="34" fill="var(--color-bg)" stroke="var(--color-hi)" strokeWidth="2" />
              <text x="272" y="116" textAnchor="middle" className="fill-muted font-mono" fontSize="10">
                z
              </text>
              <text x="272" y="132" textAnchor="middle" className="fill-ink font-mono" fontSize="13">
                {signed(z)}
              </text>
              <text x="272" y="172" textAnchor="middle" className="fill-muted font-mono" fontSize="10">
                bias {signed(s.b)}
              </text>

              <circle
                cx="394"
                cy="120"
                r="30"
                fill={a >= 0 ? 'var(--color-pos)' : 'var(--color-neg)'}
                fillOpacity={Math.min(1, Math.abs(a)) * 0.45}
                stroke="var(--color-line)"
                strokeWidth="1.5"
              />
              <text x="394" y="125" textAnchor="middle" className="fill-ink font-mono" fontSize="13">
                {a.toFixed(2)}
              </text>
              <text x="394" y="166" textAnchor="middle" className="fill-muted" fontSize="10">
                answer
              </text>
            </svg>

            <ol className="space-y-3">
              <li>
                <p className="font-medium">1. Multiply each clue by how much you care</p>
                <p className="font-mono text-xs tabular-nums text-muted">
                  {signed(s.w1)} × {s.x1.toFixed(2)} = {signed(p1)}
                  <br />
                  {signed(s.w2)} × {s.x2.toFixed(2)} = {signed(p2)}
                </p>
              </li>
              <li>
                <p className="font-medium">2. Add them up, then add your habit</p>
                <p className="font-mono text-xs tabular-nums text-muted">
                  {signed(p1)} {signed(p2)} {signed(s.b)} = <span className="text-hi">z = {signed(z)}</span>
                </p>
              </li>
              <li>
                <p className="font-medium">3. Pass z through the activation</p>
                <p className="font-mono text-xs tabular-nums text-muted">
                  {act.label}({signed(z)}) = <span className="text-hi">{a.toFixed(3)}</span>
                </p>
              </li>
            </ol>
            <p className="text-muted">{ACT_MEANING[s.act](a)}</p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel code="00.C" title={`The ${act.label} curve`}>
          <ActivationCurve act={s.act} z={z} />
          <p className="mt-3 text-xs text-muted">
            The amber dot is your neuron right now: its score z along the bottom, its answer up the side.{' '}
            {act.label} is {act.formula}, with answers from {act.range}. The bend is what lets many neurons
            together make curved patterns instead of only straight lines.
          </p>
        </Panel>

        <Panel code="00.D" title="Two challenges">
          {sig ? (
            <ul className="space-y-4">
              <li className="space-y-1">
                <Chip tone={c1 ? 'good' : 'idle'}>{c1 ? 'done' : 'to do'}</Chip>
                <p>Set both clues to 1.00 and make the answer higher than 0.9.</p>
                <p className="text-xs text-muted">Hint: raise a weight or the bias.</p>
              </li>
              <li className="space-y-1">
                <Chip tone={c2 ? 'good' : 'idle'}>{c2 ? 'done' : 'to do'}</Chip>
                <p>Set both clues to 0.00 and make the answer lower than 0.1.</p>
                <p className="text-xs text-muted">Hint: with no clues, the weights do nothing. Only the bias is left.</p>
              </li>
              <li className="text-xs text-muted">
                Searching for the right weights and bias is exactly what training does, automatically, for
                every neuron in the lab.
              </li>
            </ul>
          ) : (
            <p className="text-muted">The challenges use Sigmoid. Switch the activation back to Sigmoid to try them.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
