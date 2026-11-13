import { ACTIVATIONS } from '../core/activations'
import { DATASETS } from '../core/datasets'
import type { LabSnapshot } from './store'

/** Own-property check, so inherited names such as "constructor" or "toString" never count as valid keys. */
function hasKey<T extends object>(table: T, key: unknown): key is keyof T {
  return typeof key === 'string' && Object.hasOwn(table, key)
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

/** Copies a list of numbers if it has exactly `length` finite items. Holes in the list are rejected. */
function numbers(v: unknown, length: number): number[] | null {
  if (!Array.isArray(v) || v.length !== length) return null
  const copy = [...v] // spreading turns holes into undefined, which the check below rejects
  return copy.every(isNum) ? copy : null
}

/** Copies the weights if every layer has exactly the shape the layer sizes require (sizes[l + 1] rows of sizes[l] numbers). */
function weightLayers(v: unknown, sizes: number[]): number[][][] | null {
  if (!Array.isArray(v) || v.length !== sizes.length - 1) return null
  const out: number[][][] = []
  for (let l = 0; l < v.length; l++) {
    if (!Array.isArray(v[l]) || v[l].length !== sizes[l + 1]) return null
    const rows: number[][] = []
    for (const row of [...v[l]]) {
      const r = numbers(row, sizes[l])
      if (!r) return null
      rows.push(r)
    }
    out.push(rows)
  }
  return out
}

/** Copies the biases if every layer has exactly sizes[l + 1] numbers. */
function biasLayers(v: unknown, sizes: number[]): number[][] | null {
  if (!Array.isArray(v) || v.length !== sizes.length - 1) return null
  const out: number[][] = []
  for (let l = 0; l < v.length; l++) {
    const b = numbers(v[l], sizes[l + 1])
    if (!b) return null
    out.push(b)
  }
  return out
}

/**
 * Checks anything that claims to be a saved experiment and returns a clean, independent copy,
 * or null if it is not a valid one. It never throws and never changes its input.
 * The limits match what the app itself can produce (learning rate 0.01 to 1, width up to 12, and so on).
 */
export function validateSnapshot(x: unknown): LabSnapshot | null {
  if (!isRecord(x) || !isRecord(x.config)) return null
  const { dataset, activation, hiddenLayers, width, lr, seed } = x.config
  if (!hasKey(DATASETS, dataset) || !hasKey(ACTIVATIONS, activation)) return null
  if (hiddenLayers !== 0 && hiddenLayers !== 1 && hiddenLayers !== 2) return null
  if (!isInt(width, 1, 12) || !isInt(seed, 0, 2 ** 31 - 1)) return null
  if (typeof lr !== 'number' || !(lr >= 0.01 && lr <= 1)) return null
  if (!isInt(x.epoch, 0, 1_000_000_000)) return null

  // Layer sizes: 2 inputs, then the hidden layers, then 1 output.
  const sizes = [2, ...Array<number>(hiddenLayers).fill(width), 1]
  const weights = weightLayers(x.weights, sizes)
  const biases = biasLayers(x.biases, sizes)
  if (!weights || !biases) return null

  return {
    config: { dataset, hiddenLayers, width, activation, lr, seed },
    weights,
    biases,
    epoch: x.epoch,
    // Shown in the Vault list only (the lab recomputes both after loading), so a bad value must not make a good save "damaged".
    loss: isNum(x.loss) ? x.loss : 0,
    accuracy: isNum(x.accuracy) ? x.accuracy : 0,
  }
}