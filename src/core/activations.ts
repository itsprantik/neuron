export type ActivationName = 'relu' | 'sigmoid' | 'tanh'

export interface Activation {
  label: string
  /** The function itself: a = f(z) */
  fn: (z: number) => number
  /** Slope of the function, needed for learning. Gets both z and a = f(z). */
  deriv: (z: number, a: number) => number
  formula: string
  range: string
}

export function sigmoid(z: number): number {
  // Written this way so very large |z| never overflows.
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z))
}

export const ACTIVATIONS: Record<ActivationName, Activation> = {
  relu: {
    label: 'ReLU',
    fn: (z) => (z > 0 ? z : 0),
    deriv: (z) => (z > 0 ? 1 : 0),
    formula: 'max(0, z)',
    range: '0 to +∞',
  },
  sigmoid: {
    label: 'Sigmoid',
    fn: sigmoid,
    deriv: (_z, a) => a * (1 - a),
    formula: '1 / (1 + e^−z)',
    range: '0 to 1',
  },
  tanh: {
    label: 'Tanh',
    fn: (z) => Math.tanh(z),
    deriv: (_z, a) => 1 - a * a,
    formula: '(e^z − e^−z) / (e^z + e^−z)',
    range: '−1 to 1',
  },
}
