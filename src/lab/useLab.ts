import { useSyncExternalStore } from 'react'
import type { LabStore } from './store'

/** Subscribes the calling component to the lab: it re-renders whenever the lab changes. */
export function useLab(lab: LabStore): LabStore {
  useSyncExternalStore(lab.subscribe, lab.getVersion)
  return lab
}

/** Display names for layers and neurons. */
export function layerName(layer: number, lastLayer: number): string {
  if (layer === 0) return 'INPUT'
  if (layer === lastLayer) return 'OUTPUT'
  return `HIDDEN ${layer}`
}

export function neuronName(layer: number, index: number, lastLayer: number): string {
  if (layer === 0) return index === 0 ? 'x₁' : 'x₂'
  if (layer === lastLayer) return 'output'
  return `h${layer}.${index + 1}`
}
