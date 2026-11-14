import { createNetwork, evaluate, forward, trainEpoch } from '../core/network'
import type { ForwardResult, Network } from '../core/network'
import type { ActivationName } from '../core/activations'
import { makeDataset } from '../core/datasets'
import type { DatasetId, Point } from '../core/datasets'
import { validateSnapshot } from './snapshot'

export interface NodeRef {
  layer: number
  index: number
}

export interface LabConfig {
  dataset: DatasetId
  hiddenLayers: 0 | 1 | 2
  width: number
  activation: ActivationName
  lr: number
  seed: number
}

export interface LossSample {
  epoch: number
  loss: number
}

/** People who ask their system for less motion start with the signal flow off. */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Everything needed to restore an experiment: settings, learned numbers and the headline results. */
export interface LabSnapshot {
  config: LabConfig
  weights: number[][][]
  biases: number[][]
  epoch: number
  loss: number
  accuracy: number
}

const EPOCHS_PER_FRAME = 5
const MAX_SAMPLES = 300

function buildNetwork(c: LabConfig): Network {
  const sizes = [2, ...Array.from({ length: c.hiddenLayers }, () => c.width), 1]
  return createNetwork(sizes, c.activation, c.seed)
}

/**
 * All experiment state lives here, outside React.
 * React components subscribe to `version` and re-render when it changes.
 * The maths itself lives in src/core and knows nothing about React.
 */
export class LabStore {
  config: LabConfig = {
    dataset: 'xor',
    hiddenLayers: 1,
    width: 4,
    activation: 'tanh',
    lr: 0.3,
    seed: 7,
  }
  net: Network
  data: Point[]
  probe = { x: 0.5, y: 0.5 }
  probeResult: ForwardResult
  selected: NodeRef | null = null
  history: LossSample[] = []
  epoch = 0
  loss = 0
  accuracy = 0
  running = false
  /** Signal-flow animation in the network diagram: on/off and speed (0 to 100). */
  flow = !prefersReducedMotion()
  flowSpeed = 60

  private version = 0
  private listeners = new Set<() => void>()
  private raf = 0

  constructor() {
    this.net = buildNetwork(this.config)
    this.data = makeDataset(this.config.dataset)
    this.probeResult = forward(this.net, [this.probe.x, this.probe.y])
    this.recompute()
    this.history = [{ epoch: 0, loss: this.loss }]
  }

  // ---- subscription (used by useSyncExternalStore) ----
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getVersion = (): number => this.version

  private emit(): void {
    this.version++
    this.listeners.forEach((l) => l())
  }

  private recompute(): void {
    const e = evaluate(this.net, this.data)
    this.loss = e.loss
    this.accuracy = e.accuracy
    this.probeResult = forward(this.net, [this.probe.x, this.probe.y])
  }

  // ---- experiment setup ----
  /** Rebuild the network and dataset from the current config. */
  private rebuild(): void {
    this.stop()
    this.net = buildNetwork(this.config)
    this.data = makeDataset(this.config.dataset)
    this.selected = null
    this.epoch = 0
    this.recompute()
    this.history = [{ epoch: 0, loss: this.loss }]
    this.emit()
  }

  setConfig(patch: Partial<LabConfig>): void {
    this.config = { ...this.config, ...patch }
    this.rebuild()
  }

  /** Same settings, fresh random starting weights. */
  newSeed(): void {
    this.setConfig({ seed: this.config.seed + 1 })
  }

  resetWeights(): void {
    this.rebuild()
  }

  // ---- training ----
  private trainEpochs(n: number): void {
    for (let k = 0; k < n; k++) trainEpoch(this.net, this.data, this.config.lr)
    this.epoch += n
    this.recompute()
    this.history.push({ epoch: this.epoch, loss: this.loss })
    if (this.history.length > MAX_SAMPLES) {
      // Keep the whole curve but halve its resolution.
      this.history = this.history.filter((_, i) => i % 2 === 0 || i === this.history.length - 1)
    }
    this.emit()
  }

  private frame = (): void => {
    if (!this.running) return
    this.trainEpochs(EPOCHS_PER_FRAME)
    this.raf = requestAnimationFrame(this.frame)
  }

  toggleTraining(): void {
    if (this.running) {
      this.stop()
      this.emit()
    } else {
      this.running = true
      this.emit()
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  /** Stops the animation loop. Safe to call any time (also used on cleanup). */
  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  step(): void {
    if (this.running) return
    this.trainEpochs(1)
  }

  // ---- manual editing and probing ----
  /** layer = the neuron's layer (1 or higher), j = the neuron, i = the incoming connection. */
  setWeight(layer: number, j: number, i: number, value: number): void {
    this.net.weights[layer - 1][j][i] = value
    this.recompute()
    this.emit()
  }

  setBias(layer: number, j: number, value: number): void {
    this.net.biases[layer - 1][j] = value
    this.recompute()
    this.emit()
  }

  /** Changes the learning rate without resetting the network. */
  setLr(lr: number): void {
    this.config = { ...this.config, lr }
    this.emit()
  }

  setFlow(patch: { on?: boolean; speed?: number }): void {
    if (patch.on !== undefined) this.flow = patch.on
    if (patch.speed !== undefined) this.flowSpeed = patch.speed
    this.emit()
  }

  // ---- saving and restoring (used by the Vault) ----
  snapshot(): LabSnapshot {
    return {
      config: { ...this.config },
      weights: structuredClone(this.net.weights),
      biases: structuredClone(this.net.biases),
      epoch: this.epoch,
      loss: this.loss,
      accuracy: this.accuracy,
    }
  }

  /**
   * Restores a saved experiment. Accepts anything: the data is checked first, and a snapshot that is not
   * a valid experiment returns false without changing the current one. Everything is built before any
   * state is replaced, so a failure part-way can never leave the lab half-loaded.
   */
  load(input: unknown): boolean {
    const s = validateSnapshot(input)
    if (!s) return false

    let net: Network, data: Point[], result: { loss: number; accuracy: number }, probeResult: ForwardResult
    try {
      net = { ...buildNetwork(s.config), weights: s.weights, biases: s.biases }
      data = makeDataset(s.config.dataset)
      result = evaluate(net, data)
      probeResult = forward(net, [this.probe.x, this.probe.y])
    } catch {
      return false
    }

    this.stop()
    this.config = s.config
    this.net = net
    this.data = data
    this.selected = null
    this.epoch = s.epoch
    this.loss = result.loss
    this.accuracy = result.accuracy
    this.probeResult = probeResult
    this.history = [{ epoch: this.epoch, loss: this.loss }]
    this.emit()
    return true
  }

  setProbe(x: number, y: number): void {
    this.probe = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    }
    this.recompute()
    this.emit()
  }

  select(node: NodeRef | null): void {
    this.selected = node
    this.emit()
  }
}