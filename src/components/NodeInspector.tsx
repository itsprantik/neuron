import { useEffect, useRef } from 'react'
import { ACTIVATIONS } from '../core/activations'
import type { LabStore } from '../lab/store'
import { layerName, neuronName, useLab } from '../lab/useLab'
import { Panel, btn } from './Panel'

const signed = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2)

interface SliderProps {
  label: string
  value: number
  onChange: (v: number) => void
}

function Slider({ label, value, onChange }: SliderProps) {
  return (
    <label className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3">
      <span className="font-mono text-xs text-muted">{label}</span>
      <input
        type="range"
        min={-3}
        max={3}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-hi"
      />
      <span className="text-right font-mono text-xs tabular-nums">{signed(value)}</span>
    </label>
  )
}

interface InspectorProps {
  lab: LabStore
  onLearn?: () => void
}

function InspectorBody({ lab, onLearn }: InspectorProps) {
  useLab(lab)
  const { net, probeResult, selected } = lab
  const last = net.sizes.length - 1

  if (!selected) {
    return (
      <Panel code="01.E" title="Neuron inspector">
        <div className="space-y-3">
          <p>
            Click a neuron in the network above. You will see exactly how it turns its inputs into one number,
            and you can change its weights by hand.
          </p>
          {onLearn && (
            <button type="button" className={btn} onClick={onLearn}>
              New to neurons? Start with the guided intro
            </button>
          )}
        </div>
      </Panel>
    )
  }

  const { layer, index } = selected
  const title = `${layerName(layer, last).toLowerCase()} · ${neuronName(layer, index, last)}`

  if (layer === 0) {
    return (
      <Panel
      code="01.E"
      title={`Neuron inspector — ${title}`}
      aside={
        <button type="button" className={btn} onClick={() => lab.select(null)}>
          Close
        </button>
      }
    >
        <p>
          This is an <span className="text-hi">input</span>. It only holds a number:{' '}
          <span className="font-mono">{probeResult.a[0][index].toFixed(2)}</span>. That number is one coordinate
          of the probe point, so click the decision map to change it.
        </p>
      </Panel>
    )
  }

  const isOutput = layer === last
  const weights = net.weights[layer - 1][index]
  const bias = net.biases[layer - 1][index]
  const prev = probeResult.a[layer - 1]
  const z = probeResult.z[layer][index]
  const a = probeResult.a[layer][index]
  const act = ACTIVATIONS[net.hidden]

  let biggest = 0
  weights.forEach((w, i) => {
    if (Math.abs(w * prev[i]) > Math.abs(weights[biggest] * prev[biggest])) biggest = i
  })
  const push = weights[biggest] * prev[biggest]

  return (
    <Panel
      code="01.E"
      title={`Neuron inspector — ${title}`}
      aside={
        <button type="button" className={btn} onClick={() => lab.select(null)}>
          Close
        </button>
      }
    >
      <p className="mb-5 border-l-2 border-l-hi bg-bg px-4 py-3">
        In words: this neuron looks at {weights.length === 1 ? 'one input' : `${weights.length} inputs`}. The
        biggest influence right now is{' '}
        <span className="font-mono text-ink">{neuronName(layer - 1, biggest, last)}</span>, which pushes the
        total {push >= 0 ? 'up' : 'down'} by <span className="font-mono">{Math.abs(push).toFixed(2)}</span>. The
        bias then shifts the total by <span className="font-mono">{signed(bias)}</span>.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="mb-2 text-xs text-muted">Edit by hand (drag the sliders)</h3>
          {weights.map((w, i) => (
            <Slider
              key={i}
              label={`weight from ${neuronName(layer - 1, i, last)}`}
              value={w}
              onChange={(v) => lab.setWeight(layer, index, i, v)}
            />
          ))}
          <Slider label="bias" value={bias} onChange={(v) => lab.setBias(layer, index, v)} />
        </div>

        <div>
          <h3 className="mb-2 text-xs text-muted">The calculation, with real numbers</h3>
          <table className="w-full font-mono text-xs tabular-nums">
            <tbody>
              {weights.map((w, i) => (
                <tr key={i}>
                  <td className="py-0.5 text-muted">{neuronName(layer - 1, i, last)}</td>
                  <td className="py-0.5">
                    {signed(w)} × {prev[i].toFixed(2)}
                  </td>
                  <td className="py-0.5 text-right">= {signed(w * prev[i])}</td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="py-0.5 text-muted">bias</td>
                <td />
                <td className="py-0.5 text-right">{signed(bias)}</td>
              </tr>
              <tr className="border-t border-line">
                <td className="py-1 text-hi">z</td>
                <td className="py-1 text-muted">add everything up</td>
                <td className="py-1 text-right text-hi">{signed(z)}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-hi">a</td>
                <td className="py-0.5 text-muted">{isOutput ? 'sigmoid(z)' : `${act.label}(z)`}</td>
                <td className="py-0.5 text-right text-hi">{a.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">
            {isOutput
              ? 'The output neuron always uses sigmoid, so its answer is a probability between 0 and 1.'
              : `${act.label}: a = ${act.formula}, which gives values from ${act.range}.`}
          </p>
        </div>
      </div>
    </Panel>
  )
}

/**
 * Wraps the inspector so that picking a neuron brings its details into view,
 * even when the inspector is below the visible part of the page.
 */
export function NodeInspector(props: InspectorProps) {
  useLab(props.lab)
  const wrap = useRef<HTMLDivElement>(null)
  const sel = props.lab.selected
  const key = sel ? `${sel.layer}.${sel.index}` : ''

  useEffect(() => {
    const el = wrap.current
    if (!key || !el) return
    const r = el.getBoundingClientRect()
    if (r.bottom > window.innerHeight || r.top < 70) {
      let reduce = false
      try {
        reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      } catch {
        reduce = false
      }
      el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
    }
  }, [key])

  return (
    <div ref={wrap} className="scroll-mb-4 scroll-mt-20">
      <InspectorBody {...props} />
    </div>
  )
}
