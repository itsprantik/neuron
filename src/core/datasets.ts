import { mulberry32 } from './rng'

export interface Point {
  x: number
  y: number
  label: 0 | 1
}

export type DatasetId = 'xor' | 'circle' | 'blobs' | 'and'

export const DATASETS: Record<DatasetId, { label: string; hint: string }> = {
  xor: {
    label: 'XOR',
    hint: 'Opposite corners share a class. No single straight line can separate them.',
  },
  circle: {
    label: 'Circle',
    hint: 'A cluster in the middle surrounded by a ring. Needs a curved boundary.',
  },
  blobs: {
    label: 'Clusters',
    hint: 'Two separate groups. One straight line is enough.',
  },
  and: {
    label: 'AND',
    hint: 'Class 1 only when both inputs are positive. One straight line is enough.',
  },
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

/** Deterministic: the same dataset id always gives exactly the same points. */
export function makeDataset(id: DatasetId): Point[] {
  const rand = mulberry32(2026)
  const jitter = (spread: number) => (rand() + rand() + rand() - 1.5) * (2 / 3) * spread
  const pts: Point[] = []

  if (id === 'xor') {
    for (const [cx, cy] of [
      [-0.6, -0.6],
      [0.6, 0.6],
      [-0.6, 0.6],
      [0.6, -0.6],
    ] as const) {
      for (let k = 0; k < 10; k++) {
        const x = clamp(cx + jitter(0.4))
        const y = clamp(cy + jitter(0.4))
        pts.push({ x, y, label: x * y > 0 ? 1 : 0 })
      }
    }
  } else if (id === 'circle') {
    for (let k = 0; k < 30; k++) {
      const angle = rand() * Math.PI * 2
      const r = 0.1 + rand() * 0.35
      pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), label: 1 })
    }
    for (let k = 0; k < 30; k++) {
      const angle = rand() * Math.PI * 2
      const r = 0.7 + rand() * 0.25
      pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), label: 0 })
    }
  } else if (id === 'blobs') {
    for (let k = 0; k < 25; k++) {
      pts.push({ x: clamp(-0.5 + jitter(0.5)), y: clamp(-0.4 + jitter(0.5)), label: 0 })
      pts.push({ x: clamp(0.5 + jitter(0.5)), y: clamp(0.4 + jitter(0.5)), label: 1 })
    }
  } else {
    for (const [cx, cy] of [
      [-0.6, -0.6],
      [0.6, 0.6],
      [-0.6, 0.6],
      [0.6, -0.6],
    ] as const) {
      for (let k = 0; k < 10; k++) {
        const x = clamp(cx + jitter(0.4))
        const y = clamp(cy + jitter(0.4))
        pts.push({ x, y, label: x > 0 && y > 0 ? 1 : 0 })
      }
    }
  }
  return pts
}
