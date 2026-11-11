import { ACTIVATIONS, sigmoid } from './activations'
import type { ActivationName } from './activations'
import type { Point } from './datasets'
import { mulberry32 } from './rng'

/**
 * A tiny fully-connected network for 2D yes/no problems.
 *
 * Layer numbering: layer 0 = inputs, layer L = output (always 1 neuron, sigmoid).
 * weights[l - 1][j][i] = weight from neuron i in layer l-1 to neuron j in layer l.
 * biases[l - 1][j]     = bias of neuron j in layer l.
 */
export interface Network {
  sizes: number[]
  weights: number[][][]
  biases: number[][]
  hidden: ActivationName
}

export interface ForwardResult {
  /** z[l][j] = weighted sum before the activation (z[0] is empty: inputs have none) */
  z: number[][]
  /** a[l][j] = neuron output (a[0] is the input itself) */
  a: number[][]
}

export interface Gradients {
  gW: number[][][]
  gB: number[][]
}

export function createNetwork(
  sizes: number[],
  hidden: ActivationName,
  seed: number,
): Network {
  const rand = mulberry32(seed)
  const weights: number[][][] = []
  const biases: number[][] = []
  for (let l = 1; l < sizes.length; l++) {
    const nIn = sizes[l - 1]
    const nOut = sizes[l]
    const limit = Math.sqrt(6 / (nIn + nOut)) // Xavier/Glorot range
    weights.push(
      Array.from({ length: nOut }, () =>
        Array.from({ length: nIn }, () => (rand() * 2 - 1) * limit),
      ),
    )
    biases.push(new Array<number>(nOut).fill(0))
  }
  return { sizes: sizes.slice(), weights, biases, hidden }
}

export function forward(net: Network, input: number[]): ForwardResult {
  const last = net.sizes.length - 1
  const act = ACTIVATIONS[net.hidden].fn
  const a: number[][] = [input.slice()]
  const z: number[][] = [[]]
  for (let l = 1; l <= last; l++) {
    const W = net.weights[l - 1]
    const b = net.biases[l - 1]
    const prev = a[l - 1]
    const zs: number[] = []
    const as: number[] = []
    for (let j = 0; j < W.length; j++) {
      let s = b[j]
      const row = W[j]
      for (let i = 0; i < row.length; i++) s += row[i] * prev[i]
      zs.push(s)
      as.push(l === last ? sigmoid(s) : act(s))
    }
    z.push(zs)
    a.push(as)
  }
  return { z, a }
}

/** Probability (0..1) that the point belongs to class 1. */
export function predict(net: Network, x: number, y: number): number {
  const out = forward(net, [x, y])
  return out.a[out.a.length - 1][0]
}

const EPS = 1e-7

export function evaluate(
  net: Network,
  data: Point[],
): { loss: number; accuracy: number } {
  let loss = 0
  let correct = 0
  for (const p of data) {
    const q = Math.min(1 - EPS, Math.max(EPS, predict(net, p.x, p.y)))
    loss += -(p.label * Math.log(q) + (1 - p.label) * Math.log(1 - q))
    if (q >= 0.5 === (p.label === 1)) correct++
  }
  return { loss: loss / data.length, accuracy: correct / data.length }
}

/**
 * Backpropagation: average gradient of the cross-entropy loss over the data.
 * For a sigmoid output with cross-entropy loss, the error at the output is simply (a - label).
 */
export function computeGradients(net: Network, data: Point[]): Gradients {
  const last = net.sizes.length - 1
  const deriv = ACTIVATIONS[net.hidden].deriv
  const gW = net.weights.map((m) => m.map((r) => r.map(() => 0)))
  const gB = net.biases.map((r) => r.map(() => 0))

  for (const p of data) {
    const { z, a } = forward(net, [p.x, p.y])
    let delta: number[] = [a[last][0] - p.label]
    for (let l = last; l >= 1; l--) {
      const W = net.weights[l - 1]
      const prev = a[l - 1]
      for (let j = 0; j < W.length; j++) {
        gB[l - 1][j] += delta[j]
        for (let i = 0; i < prev.length; i++) gW[l - 1][j][i] += delta[j] * prev[i]
      }
      if (l > 1) {
        const next: number[] = []
        for (let i = 0; i < prev.length; i++) {
          let s = 0
          for (let j = 0; j < W.length; j++) s += W[j][i] * delta[j]
          next.push(s * deriv(z[l - 1][i], a[l - 1][i]))
        }
        delta = next
      }
    }
  }

  const n = data.length
  for (const m of gW) for (const r of m) for (let i = 0; i < r.length; i++) r[i] /= n
  for (const r of gB) for (let i = 0; i < r.length; i++) r[i] /= n
  return { gW, gB }
}

/** One full pass over the data (one "epoch") followed by one gradient-descent step. */
export function trainEpoch(net: Network, data: Point[], lr: number): void {
  const { gW, gB } = computeGradients(net, data)
  for (let l = 0; l < net.weights.length; l++) {
    for (let j = 0; j < net.weights[l].length; j++) {
      net.biases[l][j] -= lr * gB[l][j]
      for (let i = 0; i < net.weights[l][j].length; i++) {
        net.weights[l][j][i] -= lr * gW[l][j][i]
      }
    }
  }
}
