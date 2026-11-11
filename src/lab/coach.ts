import type { LabStore } from './store'

export type CoachTone = 'good' | 'warn' | 'info'

export interface Coach {
  tone: CoachTone
  label: string
  text: string
}

/**
 * Plain-English commentary on what the experiment is doing right now.
 * Pure function: reads the lab, changes nothing. Numbers that change on every frame
 * are left out on purpose, so a screen reader is not interrupted while training.
 */
export function coach(lab: LabStore): Coach {
  const { config, epoch, accuracy, running } = lab
  const pct = Math.round(accuracy * 100)
  const noHidden = config.hiddenLayers === 0
  const needsCurve = config.dataset === 'xor' || config.dataset === 'circle'

  if (noHidden && needsCurve && epoch >= 300 && accuracy < 0.8) {
    return {
      tone: 'warn',
      label: 'Stuck, and that is the lesson',
      text: 'With no hidden layer there is only one neuron, so the boundary can only be one straight line. No straight line separates these classes. Set hidden layers to 1 and train again.',
    }
  }
  if (epoch > 0 && accuracy >= 0.97) {
    return {
      tone: 'good',
      label: 'Learned',
      text: `The network now gets ${pct}% of the points right. Click the map or a neuron to see how it decides.`,
    }
  }
  if (running) {
    return {
      tone: 'info',
      label: 'Training',
      text: 'Each step, every weight and bias is nudged a little in the direction that makes the loss smaller.',
    }
  }
  if (epoch === 0) {
    return {
      tone: 'info',
      label: 'Ready',
      text: `Nothing is trained yet. The starting weights are random, so the ${pct}% you see is luck. Press Train.`,
    }
  }
  if (epoch >= 1500) {
    return {
      tone: 'warn',
      label: 'Not there yet',
      text: `After ${epoch} epochs it is at ${pct}%. Try a new random start, more neurons, or a different activation.`,
    }
  }
  return {
    tone: 'info',
    label: 'Paused',
    text: `Paused at epoch ${epoch} with ${pct}% correct. Press Train to continue.`,
  }
}
