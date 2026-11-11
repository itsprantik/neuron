import { useEffect, useRef } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { predict } from '../core/network'
import type { LabStore } from '../lab/store'
import { useLab } from '../lab/useLab'
import { Panel, Readout } from './Panel'

const N = 48 // heat-map resolution: N x N network evaluations per redraw
const SURFACE = [14, 42, 79]
const POS = [95, 212, 244]
const NEG = [255, 122, 107]

export function DecisionMap({ lab }: { lab: LabStore }) {
  useLab(lab)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Re-draw whenever the lab changes (weights, dataset, ...).
  const version = lab.getVersion()

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(N, N)
    for (let py = 0; py < N; py++) {
      const y = 1 - ((py + 0.5) / N) * 2
      for (let px = 0; px < N; px++) {
        const x = ((px + 0.5) / N) * 2 - 1
        const p = predict(lab.net, x, y)
        const target = p >= 0.5 ? POS : NEG
        const t = Math.abs(p - 0.5) * 2 * 0.8
        const o = (py * N + px) * 4
        img.data[o] = SURFACE[0] + (target[0] - SURFACE[0]) * t
        img.data[o + 1] = SURFACE[1] + (target[1] - SURFACE[1]) * t
        img.data[o + 2] = SURFACE[2] + (target[2] - SURFACE[2]) * t
        img.data[o + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [lab, version])

  const setFromPointer = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    lab.setProbe(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2)
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.1
    const { x, y } = lab.probe
    if (e.key === 'ArrowLeft') lab.setProbe(x - step, y)
    else if (e.key === 'ArrowRight') lab.setProbe(x + step, y)
    else if (e.key === 'ArrowUp') lab.setProbe(x, y + step)
    else if (e.key === 'ArrowDown') lab.setProbe(x, y - step)
    else return
    e.preventDefault()
  }

  const out = lab.probeResult.a[lab.probeResult.a.length - 1][0]

  return (
    <Panel code="01.C" title="Decision map">
      <div
        tabIndex={0}
        role="group"
        aria-label={`Decision map. Probe point at x ${lab.probe.x.toFixed(2)}, y ${lab.probe.y.toFixed(2)}. Use arrow keys or click to move the probe.`}
        className="relative mx-auto aspect-square w-full max-w-[520px] cursor-crosshair overflow-hidden rounded-md border border-line/60"
        onClick={setFromPointer}
        onKeyDown={onKey}
      >
        <canvas ref={canvasRef} width={N} height={N} className="absolute inset-0 h-full w-full" />
        <svg viewBox="-1 -1 2 2" className="pointer-events-none absolute inset-0 h-full w-full">
          <g transform="scale(1 -1)">
            <line x1="-1" y1="0" x2="1" y2="0" stroke="white" strokeOpacity="0.2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="-1" x2="0" y2="1" stroke="white" strokeOpacity="0.2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {lab.data.map((p, i) =>
              p.label === 1 ? (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="0.035"
                  fill="var(--color-pos)"
                  stroke="var(--color-bg)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <rect
                  key={i}
                  x={p.x - 0.03}
                  y={p.y - 0.03}
                  width="0.06"
                  height="0.06"
                  fill="var(--color-neg)"
                  stroke="var(--color-bg)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ),
            )}
            {/* Probe: amber ring */}
            <circle
              cx={lab.probe.x}
              cy={lab.probe.y}
              r="0.07"
              fill="none"
              stroke="var(--color-hi)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={lab.probe.x} cy={lab.probe.y} r="0.012" fill="var(--color-hi)" />
          </g>
          {/* Axis names */}
          <text x="0.96" y="0.93" textAnchor="end" fontSize="0.055" className="fill-muted font-mono" stroke="var(--color-bg)" strokeWidth="0.012" paintOrder="stroke">
            x₁ →
          </text>
          <text x="-0.96" y="-0.88" fontSize="0.055" className="fill-muted font-mono" stroke="var(--color-bg)" strokeWidth="0.012" paintOrder="stroke">
            x₂ ↑
          </text>
        </svg>
      </div>

      <dl className="mx-auto mt-3 flex max-w-[520px] flex-wrap gap-2">
        <Readout label="Probe x₁" value={lab.probe.x.toFixed(2)} />
        <Readout label="Probe x₂" value={lab.probe.y.toFixed(2)} />
        <Readout label="P(class 1)" value={out.toFixed(3)} />
      </dl>

      <p className="mx-auto mt-3 max-w-[520px] text-xs text-muted">
        <span className="text-pos">●</span> class 1 &nbsp; <span className="text-neg">■</span> class 0 &nbsp; The
        background colour is the network’s answer at every point. Click the map (or use the arrow keys) to move the
        amber probe and watch the numbers change in the network.
      </p>
    </Panel>
  )
}
