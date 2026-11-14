import { describe, expect, it } from 'vitest'
import { ACTIVATIONS, sigmoid } from './activations'
import type { ActivationName } from './activations'
import { DATASETS, makeDataset } from './datasets'
import type { DatasetId } from './datasets'
import { computeGradients, createNetwork, evaluate, forward, predict, trainEpoch } from './network'
import { mulberry32 } from './rng'

const NAMES = ['relu', 'sigmoid', 'tanh'] as const
const IDS = Object.keys(DATASETS) as DatasetId[]

describe('mulberry32 (seeded random numbers)', () => {
  it('gives the same sequence for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 20; i++) expect(a()).toBe(b())
  })

  it('gives different sequences for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('stays inside 0 (included) and 1 (excluded)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('activations', () => {
  it('sigmoid is 0.5 at zero, symmetric, and never overflows', () => {
    expect(sigmoid(0)).toBe(0.5)
    expect(sigmoid(2) + sigmoid(-2)).toBeCloseTo(1, 12)
    expect(sigmoid(1000)).toBe(1)
    expect(sigmoid(-1000)).toBe(0)
  })

  it('relu: passes positives, blocks the rest, slope 1 or 0', () => {
    const { fn, deriv } = ACTIVATIONS.relu
    expect([fn(-2), fn(0), fn(3)]).toEqual([0, 0, 3])
    expect([deriv(-2, 0), deriv(0, 0), deriv(3, 3)]).toEqual([0, 0, 1])
  })

  it('tanh and sigmoid slopes match the known values at zero', () => {
    expect(ACTIVATIONS.tanh.deriv(0, ACTIVATIONS.tanh.fn(0))).toBe(1)
    expect(ACTIVATIONS.sigmoid.deriv(0, ACTIVATIONS.sigmoid.fn(0))).toBe(0.25)
  })

  it.each(NAMES)('%s slope agrees with a numeric slope (away from the relu corner)', (name) => {
    const { fn, deriv } = ACTIVATIONS[name]
    const h = 1e-6
    for (const z of [-1.7, -0.4, 0.3, 1.2, 2.5]) {
      const numeric = (fn(z + h) - fn(z - h)) / (2 * h)
      expect(deriv(z, fn(z))).toBeCloseTo(numeric, 5)
    }
  })
})

describe('datasets', () => {
  const sizes: Record<DatasetId, number> = { xor: 40, circle: 60, blobs: 50, and: 40 }

  it.each(IDS)('%s is the same every time (deterministic)', (id) => {
    expect(makeDataset(id)).toEqual(makeDataset(id))
  })

  it('uses a fixed seed, so the very first points never change between runs or versions', () => {
    const x = makeDataset('xor')[0]
    expect(x.x).toBeCloseTo(-0.61998365, 7)
    expect(x.y).toBeCloseTo(-0.73530703, 7)
    expect(x.label).toBe(1)
    const c = makeDataset('circle')[0]
    expect(c.x).toBeCloseTo(-0.19986376, 7)
    expect(c.y).toBeCloseTo(0.05751101, 7)
  })

  it.each(IDS)('%s has the right size, both classes, labels 0/1 and points inside the box', (id) => {
    const d = makeDataset(id)
    expect(d).toHaveLength(sizes[id])
    expect(d.some((p) => p.label === 1)).toBe(true)
    expect(d.some((p) => p.label === 0)).toBe(true)
    for (const p of d) {
      expect([0, 1]).toContain(p.label)
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1)
    }
  })

  it('xor labels follow the sign rule, and labels follow the AND rule', () => {
    for (const p of makeDataset('xor')) expect(p.label).toBe(p.x * p.y > 0 ? 1 : 0)
    for (const p of makeDataset('and')) expect(p.label).toBe(p.x > 0 && p.y > 0 ? 1 : 0)
  })
})

describe('createNetwork', () => {
  it('builds the right shapes with zero biases', () => {
    const n = createNetwork([2, 4, 3, 1], 'tanh', 5)
    expect(n.sizes).toEqual([2, 4, 3, 1])
    expect(n.weights.map((m) => [m.length, m[0].length])).toEqual([
      [4, 2],
      [3, 4],
      [1, 3],
    ])
    expect(n.biases).toEqual([[0, 0, 0, 0], [0, 0, 0], [0]])
  })

  it('is repeatable for one seed and different for another', () => {
    const a = createNetwork([2, 4, 1], 'tanh', 3)
    expect(createNetwork([2, 4, 1], 'tanh', 3)).toEqual(a)
    expect(createNetwork([2, 4, 1], 'tanh', 4).weights).not.toEqual(a.weights)
  })

  it('keeps the starting weights inside the Xavier range', () => {
    const limit = Math.sqrt(6 / (2 + 4))
    for (const row of createNetwork([2, 4, 1], 'relu', 9).weights[0]) {
      for (const w of row) expect(Math.abs(w)).toBeLessThanOrEqual(limit)
    }
  })
})

describe('forward, predict, evaluate', () => {
  it('matches a hand calculation for one neuron', () => {
    const net = createNetwork([2, 1], 'tanh', 1)
    net.weights = [[[1, -1]]]
    net.biases = [[0.5]]
    const out = forward(net, [2, 1])
    expect(out.z[1][0]).toBeCloseTo(1.5, 12) // 1*2 + (-1)*1 + 0.5
    expect(out.a[1][0]).toBeCloseTo(sigmoid(1.5), 12)
    expect(predict(net, 2, 1)).toBeCloseTo(sigmoid(1.5), 12)
  })

  it('has one z and one a per layer, and the input is not changed', () => {
    const net = createNetwork([2, 3, 1], 'relu', 2)
    const input = [0.2, -0.4]
    const { z, a } = forward(net, input)
    expect(z.map((l) => l.length)).toEqual([0, 3, 1])
    expect(a.map((l) => l.length)).toEqual([2, 3, 1])
    expect(input).toEqual([0.2, -0.4])
  })

  it.each(NAMES)('%s: output is always a probability between 0 and 1', (name: ActivationName) => {
    const net = createNetwork([2, 5, 1], name, 11)
    for (const p of makeDataset('circle')) {
      const q = predict(net, p.x, p.y)
      expect(q).toBeGreaterThan(0)
      expect(q).toBeLessThan(1)
    }
  })

  it('an all-zero network is a coin flip: loss is ln 2', () => {
    const net = createNetwork([2, 4, 1], 'tanh', 1)
    for (const m of net.weights) for (const r of m) r.fill(0)
    for (const id of IDS) expect(evaluate(net, makeDataset(id)).loss).toBeCloseTo(Math.LN2, 10)
  })
})

describe('gradients (backpropagation)', () => {
  const cases: [string, number[], ActivationName][] = [
    ['one hidden layer', [2, 3, 1], 'tanh'],
    ['two hidden layers', [2, 3, 3, 1], 'tanh'],
    ['sigmoid', [2, 3, 1], 'sigmoid'],
    ['relu', [2, 3, 1], 'relu'],
    ['no hidden layer', [2, 1], 'tanh'],
  ]

  it.each(cases)('%s: matches a numeric slope of the loss', (_label, sizes, act) => {
    const net = createNetwork(sizes, act, 3)
    // Make biases non-zero so the bias gradients are tested at a general point.
    net.biases.forEach((b, l) => b.forEach((_, j) => (b[j] = 0.05 * (l + j + 1))))
    const data = makeDataset('xor')
    const { gW, gB } = computeGradients(net, data)
    const h = 1e-5
    const slope = (arr: number[], i: number) => {
      const old = arr[i]
      arr[i] = old + h
      const up = evaluate(net, data).loss
      arr[i] = old - h
      const down = evaluate(net, data).loss
      arr[i] = old
      return (up - down) / (2 * h)
    }
    for (let l = 0; l < net.weights.length; l++) {
      for (let j = 0; j < net.weights[l].length; j++) {
        expect(Math.abs(gB[l][j] - slope(net.biases[l], j))).toBeLessThan(1e-4)
        for (let i = 0; i < net.weights[l][j].length; i++) {
          expect(Math.abs(gW[l][j][i] - slope(net.weights[l][j], i))).toBeLessThan(1e-4)
        }
      }
    }
  })
})

describe('training', () => {
  it('learning rate 0 changes nothing', () => {
    const net = createNetwork([2, 4, 1], 'tanh', 7)
    const before = structuredClone(net)
    trainEpoch(net, makeDataset('xor'), 0)
    expect(net).toEqual(before)
  })

  it('a hidden layer learns XOR (loss falls, every point right)', () => {
    const net = createNetwork([2, 4, 1], 'tanh', 7)
    const data = makeDataset('xor')
    const start = evaluate(net, data).loss
    for (let i = 0; i < 1500; i++) trainEpoch(net, data, 0.3)
    const end = evaluate(net, data)
    expect(end.loss).toBeLessThan(start / 10)
    expect(end.accuracy).toBe(1)
  })

  it('with no hidden layer XOR cannot be learned (a straight line is not enough)', () => {
    const net = createNetwork([2, 1], 'tanh', 7)
    const data = makeDataset('xor')
    for (let i = 0; i < 3000; i++) trainEpoch(net, data, 0.3)
    expect(evaluate(net, data).accuracy).toBeLessThan(0.8)
  })

  it('two runs with the same seed end in exactly the same place', () => {
    const run = () => {
      const net = createNetwork([2, 4, 1], 'relu', 5)
      const data = makeDataset('circle')
      for (let i = 0; i < 50; i++) trainEpoch(net, data, 0.2)
      return net
    }
    expect(run()).toEqual(run())
  })
})