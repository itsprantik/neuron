import type { LabStore } from '../lab/store'
import { useLab } from '../lab/useLab'
import { Panel } from './Panel'

const W = 320
const H = 120
const PAD = { l: 34, r: 8, t: 8, b: 20 }

export function LossChart({ lab }: { lab: LabStore }) {
  useLab(lab)
  const { history, epoch, loss } = lab
  const maxLoss = Math.max(0.1, ...history.map((s) => s.loss))
  const maxEpoch = Math.max(1, history[history.length - 1].epoch)
  const x = (e: number) => PAD.l + (e / maxEpoch) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - v / maxLoss) * (H - PAD.t - PAD.b)
  const points = history.map((s) => `${x(s.epoch).toFixed(1)},${y(s.loss).toFixed(1)}`).join(' ')
  const baseline = y(0)
  const area = `${x(history[0].epoch).toFixed(1)},${baseline} ${points} ${x(history[history.length - 1].epoch).toFixed(1)},${baseline}`

  return (
    <Panel code="01.D" title="Training progress">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Loss over training. After ${epoch} epochs the loss is ${loss.toFixed(4)}.`}
        className="block w-full rounded-md border border-line/60 bg-bg"
      >
        <defs>
          <linearGradient id="loss-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-pos)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-pos)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(maxLoss * f)}
            y2={y(maxLoss * f)}
            stroke="white"
            strokeOpacity="0.1"
          />
        ))}
        <polygon points={area} fill="url(#loss-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-pos)"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end" className="fill-muted font-mono" fontSize="9">
          {maxLoss.toFixed(2)}
        </text>
        <text x={PAD.l - 4} y={H - PAD.b + 3} textAnchor="end" className="fill-muted font-mono" fontSize="9">
          0
        </text>
        <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-muted font-mono" fontSize="9">
          epoch {maxEpoch}
        </text>
        <text x={PAD.l} y={H - 6} className="fill-muted font-mono" fontSize="9">
          0
        </text>
      </svg>
      <p className="mt-3 text-xs text-muted">
        Loss measures how wrong the network is (lower is better). When training works, the line falls.
      </p>
    </Panel>
  )
}
