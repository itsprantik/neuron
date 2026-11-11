import { DATASETS } from '../core/datasets'
import type { DatasetId } from '../core/datasets'
import { ACTIVATIONS } from '../core/activations'
import type { ActivationName } from '../core/activations'
import { coach } from '../lab/coach'
import type { LabStore } from '../lab/store'
import { useLab } from '../lab/useLab'
import { Chip, Field, Panel, Readout, Segmented, btn, btnPrimary } from './Panel'

const datasetOptions = (Object.keys(DATASETS) as DatasetId[]).map((id) => ({
  value: id,
  label: DATASETS[id].label,
}))
const activationOptions = (Object.keys(ACTIVATIONS) as ActivationName[]).map((id) => ({
  value: id,
  label: ACTIVATIONS[id].label,
}))
const layerOptions = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
] as const
const widthOptions = [2, 3, 4, 6].map((n) => ({ value: n, label: String(n) }))
const lrOptions = [0.03, 0.1, 0.3, 1].map((n) => ({ value: n, label: String(n) }))

export function ExperimentPanel({ lab }: { lab: LabStore }) {
  useLab(lab)
  const { config } = lab
  const noHidden = config.hiddenLayers === 0
  const c = coach(lab)

  return (
    <Panel
      code="01.A"
      title="Experiment"
      aside={
        <Chip tone={lab.running ? 'good' : 'idle'}>{lab.running ? 'training' : 'paused'}</Chip>
      }
    >
      <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
        <Field label="Problem" hint="The pattern to learn">
          <Segmented
            label="Dataset"
            value={config.dataset}
            options={datasetOptions}
            onChange={(dataset) => lab.setConfig({ dataset })}
          />
        </Field>
        <Field label="Hidden layers" hint="0 = one straight line only">
          <Segmented
            label="Hidden layers"
            value={config.hiddenLayers}
            options={[...layerOptions]}
            onChange={(hiddenLayers) => lab.setConfig({ hiddenLayers })}
          />
        </Field>
        <Field label="Neurons per layer" hint="More = more flexible">
          <Segmented
            label="Neurons per hidden layer"
            value={config.width}
            options={widthOptions}
            disabled={noHidden}
            onChange={(width) => lab.setConfig({ width })}
          />
        </Field>
        <Field label="Activation" hint="The bend in each neuron">
          <Segmented
            label="Hidden activation function"
            value={config.activation}
            options={activationOptions}
            disabled={noHidden}
            onChange={(activation) => lab.setConfig({ activation })}
          />
        </Field>
        <Field label="Learning rate" hint="Size of each step">
          <Segmented
            label="Learning rate"
            value={config.lr}
            options={lrOptions}
            onChange={(lr) => lab.setConfig({ lr })}
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-md border border-line/50 bg-bg p-2.5">
        <button type="button" className={btnPrimary} onClick={() => lab.toggleTraining()}>
          {lab.running ? 'Pause' : 'Train'}
        </button>
        <button type="button" className={btn} disabled={lab.running} onClick={() => lab.step()}>
          Step (1 epoch)
        </button>
        <button type="button" className={btn} onClick={() => lab.resetWeights()}>
          Reset weights
        </button>
        <button type="button" className={btn} onClick={() => lab.newSeed()}>
          New random start
        </button>

        <dl className="ml-auto flex flex-wrap gap-2">
          <Readout label="epoch" value={String(lab.epoch)} />
          <Readout label="loss" value={lab.loss.toFixed(4)} />
          <Readout label="accuracy" value={`${Math.round(lab.accuracy * 100)}%`} />
          <Readout label="seed" value={String(config.seed)} />
        </dl>
      </div>

      <div
        aria-live="polite"
        className={`mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border bg-bg px-4 py-3 ${
          c.tone === 'good' ? 'border-pos/40' : c.tone === 'warn' ? 'border-hi/40' : 'border-line/50'
        }`}
      >
        <Chip tone={c.tone}>{c.label}</Chip>
        <p className="min-w-0 flex-1 basis-80">{c.text}</p>
      </div>
    </Panel>
  )
}
