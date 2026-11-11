import { useState } from 'react'
import type { LabStore } from '../lab/store'
import { layerName, neuronName, useLab } from '../lab/useLab'
import { Panel, Readout } from './Panel'

const W = 640
const GAP = 54 // vertical distance between neurons in a layer
const R = 19 // neuron radius

/** People who ask their system for less motion start with the signal flow off. */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** The drawing is only as tall as its biggest layer needs, so small networks do not float in empty space. */
function layout(sizes: number[]): { pos: { x: number; y: number }[][]; H: number } {
  const n = sizes.length
  const H = Math.max(230, (Math.max(...sizes) - 1) * GAP + 130)
  const pos = sizes.map((count, l) => {
    const x = 70 + (l * (W - 140)) / Math.max(1, n - 1)
    return Array.from({ length: count }, (_, j) => ({
      x,
      y: (H - 24) / 2 + (j - (count - 1) / 2) * GAP,
    }))
  })
  return { pos, H }
}

export function NetworkDiagram({ lab }: { lab: LabStore }) {
  useLab(lab)
  const { net, probeResult, selected } = lab
  const last = net.sizes.length - 1
  const { pos, H } = layout(net.sizes)
  const [flow, setFlow] = useState(() => !prefersReducedMotion())

  const neurons = net.sizes.reduce((a, b) => a + b, 0)
  const connections = net.weights.reduce((t, m) => t + m.length * m[0].length, 0)
  // "Firing" = a neuron after the inputs whose output is strong (above 0.5 in size) for the probe point.
  const firing = probeResult.a.slice(1).reduce((t, layer) => t + layer.filter((v) => Math.abs(v) > 0.5).length, 0)

  return (
    <Panel
      code="01.B"
      title="Network"
      aside={
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={flow}
            onChange={(e) => setFlow(e.target.checked)}
            className="accent-hi"
          />
          Signal flow
        </label>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label="Neural network diagram. Select a neuron to inspect it."
        className="blueprint-grid block w-full rounded-md border border-line/60 bg-bg"
      >
        {/* Connections: solid cyan = positive weight, dashed coral = negative weight */}
        {net.weights.map((layerW, k) =>
          layerW.map((row, j) =>
            row.map((w, i) => {
              const from = pos[k][i]
              const to = pos[k + 1][j]
              const incoming = selected !== null && selected.layer === k + 1 && selected.index === j
              const opacity = incoming ? 1 : selected ? 0.18 : 0.65
              return (
                <line
                  key={`${k}-${j}-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={w >= 0 ? 'var(--color-pos)' : 'var(--color-neg)'}
                  strokeWidth={0.6 + Math.min(Math.abs(w), 3) * 1.1}
                  strokeDasharray={w >= 0 ? undefined : '5 4'}
                  opacity={opacity}
                />
              )
            }),
          ),
        )}

        {/* Signal flow: one dot per connection, travelling input to output. Brighter when its source neuron is strong. */}
        {flow &&
          net.weights.map((layerW, k) =>
            layerW.map((row, j) =>
              row.map((w, i) => {
                const from = pos[k][i]
                const to = pos[k + 1][j]
                const strength = Math.min(1, Math.abs(probeResult.a[k][i]))
                const dimmed = selected !== null && !(selected.layer === k + 1 && selected.index === j)
                return (
                  <circle
                    key={`flow-${k}-${j}-${i}`}
                    r={1.8 + Math.min(Math.abs(w), 3) * 0.55}
                    fill={w >= 0 ? 'var(--color-pos)' : 'var(--color-neg)'}
                    opacity={dimmed ? 0.1 : 0.25 + strength * 0.75}
                    className="pointer-events-none"
                  >
                    <animateMotion
                      dur="2.2s"
                      begin={`${(((k * 7 + j * 3 + i) % 6) * 0.37).toFixed(2)}s`}
                      repeatCount="indefinite"
                      path={`M${from.x},${from.y} L${to.x},${to.y}`}
                    />
                  </circle>
                )
              }),
            ),
          )}

        {/* Neurons */}
        {pos.map((nodes, l) =>
          nodes.map((p, j) => {
            const a = probeResult.a[l][j]
            const isSel = selected !== null && selected.layer === l && selected.index === j
            const shade = Math.min(1, Math.abs(a))
            const name = neuronName(l, j, last)
            const label = `${layerName(l, last)} ${name}`
            const select = () => lab.select({ layer: l, index: j })
            return (
              <g
                key={`${l}-${j}`}
                role="button"
                tabIndex={0}
                aria-label={`${label}, value ${a.toFixed(2)}${isSel ? ', selected' : ''}`}
                aria-pressed={isSel}
                className="cursor-pointer"
                onClick={select}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    select()
                  }
                }}
              >
                <circle cx={p.x} cy={p.y} r={R} fill="var(--color-bg)" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={R}
                  fill={a >= 0 ? 'var(--color-pos)' : 'var(--color-neg)'}
                  fillOpacity={shade * 0.45}
                  stroke={isSel ? 'var(--color-hi)' : 'var(--color-line)'}
                  strokeWidth={isSel ? 2.5 : 1.5}
                />
                <text
                  x={p.x}
                  y={p.y + 3.5}
                  textAnchor="middle"
                  className="pointer-events-none fill-ink font-mono"
                  fontSize="10"
                >
                  {a.toFixed(2)}
                </text>
                <text
                  x={p.x}
                  y={p.y + R + 12}
                  textAnchor="middle"
                  className="pointer-events-none fill-muted font-mono"
                  fontSize="9"
                >
                  {l === last ? 'answer' : name}
                </text>
              </g>
            )
          }),
        )}

        {/* Layer names */}
        {pos.map((nodes, l) => (
          <text
            key={`label-${l}`}
            x={nodes[0].x}
            y={H - 8}
            textAnchor="middle"
            className="fill-muted font-mono"
            fontSize="10"
          >
            {layerName(l, last).toLowerCase()}
          </text>
        ))}

        {!selected && (
          <text x={14} y={20} className="fill-muted font-mono" fontSize="10">
            Click any neuron to open it
          </text>
        )}
      </svg>

      <dl className="mt-3 flex flex-wrap gap-2">
        <Readout label="Neurons" value={String(neurons)} />
        <Readout label="Connections" value={String(connections)} />
        <Readout label="Firing now" value={`${firing} of ${neurons - net.sizes[0]}`} />
      </dl>

      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>
          <span className="text-pos">━</span> positive weight
        </span>
        <span>
          <span className="text-neg">╍</span> negative weight (dashed)
        </span>
        <span>Thicker line = bigger weight</span>
        <span>Number in a neuron = its output for the probe point</span>
        <span>Moving dots = signals travelling forward. Brighter dot = stronger sender.</span>
      </p>
    </Panel>
  )
}
