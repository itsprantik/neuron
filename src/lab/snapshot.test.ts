import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ACTIVATIONS } from '../core/activations'
import { DATASETS } from '../core/datasets'
import type { ActivationName } from '../core/activations'
import type { DatasetId } from '../core/datasets'
import { validateSnapshot } from './snapshot'
import { LabStore } from './store'
import type { LabSnapshot } from './store'

// The store stops its animation loop with these; Node does not have them.
beforeEach(() => {
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('requestAnimationFrame', () => 1)
})

const fresh = (): LabSnapshot => new LabStore().snapshot()
/** A valid snapshot with one change applied to a copy, typed loosely so bad values can be tried. */
const changed = (edit: (s: Record<string, any>) => void): unknown => {
  const s = structuredClone(fresh()) as unknown as Record<string, any>
  edit(s)
  return s
}

describe('validateSnapshot: valid input', () => {
  it('accepts what the lab itself produces, and returns an equal copy', () => {
    const s = fresh()
    expect(validateSnapshot(s)).toEqual(s)
  })

  it('accepts every dataset, activation and depth the lab can build', () => {
    const store = new LabStore()
    for (const dataset of Object.keys(DATASETS) as DatasetId[]) {
      for (const activation of Object.keys(ACTIVATIONS) as ActivationName[]) {
        for (const hiddenLayers of [0, 1, 2] as const) {
          store.setConfig({ dataset, activation, hiddenLayers })
          const s = store.snapshot()
          expect(validateSnapshot(s)).toEqual(s)
        }
      }
    }
  })

  it('returns an independent copy and does not change its input', () => {
    const s = fresh()
    const backup = structuredClone(s)
    const out = validateSnapshot(s)!
    out.weights[0][0][0] = 999
    out.config.seed = 123
    expect(s).toEqual(backup)
  })

  it('drops unknown extra fields', () => {
    const out = validateSnapshot(changed((s) => { s.evil = 1; s.config.evil = 2 })) as Record<string, any>
    expect(out.evil).toBeUndefined()
    expect(out.config.evil).toBeUndefined()
  })

  it('uses 0 for loss and accuracy that are not finite numbers (display values only)', () => {
    const out = validateSnapshot(changed((s) => { s.loss = NaN; s.accuracy = 'high' }))!
    expect(out.loss).toBe(0)
    expect(out.accuracy).toBe(0)
  })
})

describe('validateSnapshot: invalid input is refused, never thrown', () => {
  const bad: [string, (s: Record<string, any>) => void][] = [
    ['dataset "constructor" (an inherited name)', (s) => (s.config.dataset = 'constructor')],
    ['dataset "toString"', (s) => (s.config.dataset = 'toString')],
    ['dataset "__proto__"', (s) => (s.config.dataset = '__proto__')],
    ['unknown dataset', (s) => (s.config.dataset = 'spiral')],
    ['activation "constructor"', (s) => (s.config.activation = 'constructor')],
    ['activation is a number', (s) => (s.config.activation = 1)],
    ['3 hidden layers', (s) => (s.config.hiddenLayers = 3)],
    ['hiddenLayers as text', (s) => (s.config.hiddenLayers = '1')],
    ['width 0', (s) => (s.config.width = 0)],
    ['width 13', (s) => (s.config.width = 13)],
    ['width 2.5', (s) => (s.config.width = 2.5)],
    ['width NaN', (s) => (s.config.width = NaN)],
    ['seed negative', (s) => (s.config.seed = -1)],
    ['seed 1.5', (s) => (s.config.seed = 1.5)],
    ['seed too large', (s) => (s.config.seed = 2 ** 31)],
    ['lr 0', (s) => (s.config.lr = 0)],
    ['lr 2', (s) => (s.config.lr = 2)],
    ['lr NaN', (s) => (s.config.lr = NaN)],
    ['lr as text', (s) => (s.config.lr = '0.3')],
    ['epoch negative', (s) => (s.epoch = -1)],
    ['epoch 1.5', (s) => (s.epoch = 1.5)],
    ['epoch huge', (s) => (s.epoch = 2e9)],
    ['config missing', (s) => delete s.config],
    ['config is a list', (s) => (s.config = [])],
    ['weights missing', (s) => delete s.weights],
    ['biases missing', (s) => delete s.biases],
    ['one weight layer too few', (s) => s.weights.pop()],
    ['one weight row too few', (s) => s.weights[0].pop()],
    ['one weight too many in a row', (s) => s.weights[0][0].push(0)],
    ['a weight is NaN', (s) => (s.weights[0][0][0] = NaN)],
    ['a weight is Infinity', (s) => (s.weights[1][0][0] = Infinity)],
    ['a weight is text', (s) => (s.weights[0][0][0] = '1')],
    ['a weight is a hole in the list', (s) => delete s.weights[0][0][0]],
    ['a bias is NaN', (s) => (s.biases[0][0] = NaN)],
    ['one bias too few', (s) => s.biases[0].pop()],
    ['biases layer is not a list', (s) => (s.biases[0] = 5)],
  ]

  it.each(bad)('refuses: %s', (_label, edit) => {
    expect(validateSnapshot(changed(edit))).toBeNull()
  })

  it.each([[null], [undefined], [5], ['text'], [true], [[]], [[fresh()]], [() => 1]])('refuses a value that is not an experiment (%#)', (v) => {
    expect(validateSnapshot(v)).toBeNull()
  })

  it('refuses an object with no prototype and an empty object', () => {
    expect(validateSnapshot(Object.create(null))).toBeNull()
    expect(validateSnapshot({})).toBeNull()
  })

  it.each([0, 13, 100])('refuses width %i even when the weights are shaped to match it', (width) => {
    const store = new LabStore()
    store.setConfig({ width }) // the lab itself allows any width; a saved file must not
    expect(validateSnapshot(store.snapshot())).toBeNull()
  })

  it('refuses 3 hidden layers even when the weights are shaped to match', () => {
    const grid = (rows: number, cols: number) => Array.from({ length: rows }, () => Array<number>(cols).fill(0))
    const s = structuredClone(fresh()) as unknown as Record<string, any>
    s.config.hiddenLayers = 3
    s.weights = [grid(4, 2), grid(4, 4), grid(4, 4), grid(1, 4)]
    s.biases = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0]]
    expect(validateSnapshot(s)).toBeNull()
  })

  it('refuses weights whose shape belongs to a different network size', () => {
    const wide = new LabStore()
    wide.setConfig({ width: 6 })
    const s = structuredClone(fresh())
    s.weights = wide.snapshot().weights // shaped for width 6, config says width 4
    expect(validateSnapshot(s)).toBeNull()
  })
})

describe('LabStore.load', () => {
  it('restores a saved experiment exactly', () => {
    const a = new LabStore()
    a.setConfig({ dataset: 'circle', activation: 'relu', hiddenLayers: 2, width: 5 })
    for (let i = 0; i < 30; i++) a.step()
    const saved = a.snapshot()

    const b = new LabStore()
    expect(b.load(saved)).toBe(true)
    expect(b.config).toEqual(saved.config)
    expect(b.net.weights).toEqual(saved.weights)
    expect(b.net.biases).toEqual(saved.biases)
    expect(b.epoch).toBe(30)
    expect(b.loss).toBeCloseTo(saved.loss, 10)
    expect(b.accuracy).toBeCloseTo(saved.accuracy, 10)
    expect(b.history).toEqual([{ epoch: 30, loss: b.loss }])
    expect(b.selected).toBeNull()
  })

  it('keeps training from where the saved experiment stopped', () => {
    const a = new LabStore()
    for (let i = 0; i < 20; i++) a.step()
    const b = new LabStore()
    b.load(a.snapshot())
    a.step()
    b.step()
    expect(b.net.weights).toEqual(a.net.weights)
  })

  it('does not share memory with the object it was given', () => {
    const s = fresh()
    const store = new LabStore()
    store.load(s)
    s.weights[0][0][0] = 999
    expect(store.net.weights[0][0][0]).not.toBe(999)
  })

  it('stops training when it loads', () => {
    const store = new LabStore()
    store.toggleTraining()
    expect(store.running).toBe(true)
    expect(store.load(fresh())).toBe(true)
    expect(store.running).toBe(false)
  })

  it.each(refusedLoadEdits())('a refused load changes nothing: %s', (_label, edit) => {
    const store = new LabStore()
    store.setConfig({ dataset: 'blobs', activation: 'sigmoid' })
    for (let i = 0; i < 5; i++) store.step()
    store.select({ layer: 1, index: 0 })
    const before = structuredClone({ snap: store.snapshot(), history: store.history, selected: store.selected })
    store.toggleTraining()

    expect(store.load(changed(edit))).toBe(false)

    expect(store.snapshot()).toEqual(before.snap)
    expect(store.history).toEqual(before.history)
    expect(store.selected).toEqual(before.selected)
    expect(store.running).toBe(true) // still training: a refused load must not stop it
    store.toggleTraining()
    store.step() // and the lab still works afterwards
    expect(store.epoch).toBe(before.snap.epoch + 1)
  })
})

/** A few representative bad edits for the "nothing changes" test above. */
function refusedLoadEdits(): [string, (s: Record<string, any>) => void][] {
  return [
    ['activation "constructor"', (s) => (s.config.activation = 'constructor')],
    ['dataset "toString"', (s) => (s.config.dataset = 'toString')],
    ['a weight is NaN', (s) => (s.weights[0][0][0] = NaN)],
    ['wrong shape', (s) => s.weights[0].pop()],
    ['lr out of range', (s) => (s.config.lr = 5)],
  ]
}