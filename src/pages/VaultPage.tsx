import { useCallback, useEffect, useState } from 'react'
import { LESSONS } from '../academy/lessons'
import { Chip, Panel, btn, btnPrimary } from '../components/Panel'
import { DATASETS } from '../core/datasets'
import { useLab } from '../lab/useLab'
import type { LabStore } from '../lab/store'
import {
  MAX_EXPERIMENTS,
  clearVault,
  deleteExperiment,
  explain,
  listExperiments,
  saveExperiment,
  storageUsed,
} from '../vault/vault'
import type { SavedExperiment } from '../vault/vault'

interface VaultPageProps {
  lab: LabStore
  done: string[]
  /** A storage problem found anywhere in the app (null when all is well). */
  error: string | null
  onError: (message: string | null) => void
  /** Called after "Delete all data" so Academy progress is cleared in memory too. */
  onCleared: () => void
  onOpenLab: () => void
}

function describe(c: LabStore['config']): string {
  const hidden = c.hiddenLayers === 0 ? 'no hidden layer' : `${c.hiddenLayers} × ${c.width} ${c.activation}`
  return `${DATASETS[c.dataset].label} · ${hidden}`
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function VaultPage({ lab, done, error, onError, onCleared, onOpenLab }: VaultPageProps) {
  useLab(lab)
  const [items, setItems] = useState<SavedExperiment[] | null>(null)
  const [name, setName] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [used, setUsed] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    try {
      setItems(await listExperiments())
      setUsed(await storageUsed())
    } catch (e) {
      setItems([])
      onError(explain(e))
    }
  }, [onError])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** Runs a storage action, then refreshes the list. Any failure is shown instead of ignored. */
  const act = async (fn: () => Promise<void>) => {
    setNote(null)
    try {
      await fn()
      onError(null)
    } catch (e) {
      onError(explain(e))
    }
    await refresh()
  }

  const save = () =>
    act(async () => {
      await saveExperiment(name || `${DATASETS[lab.config.dataset].label} · epoch ${lab.epoch}`, lab.snapshot())
      setName('')
    })

  const load = (e: SavedExperiment) => {
    if (lab.load(e.snapshot)) onOpenLab()
    else setNote(`“${e.name}” is damaged and could not be loaded. You can delete it.`)
  }

  const wipe = () =>
    act(async () => {
      await clearVault()
      onCleared()
      setConfirmAll(false)
      setNote('Everything the Vault stored was deleted.')
    })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <Panel
        code="05.A"
        title="Saved experiments"
        aside={<Chip tone="info">{items ? `${items.length} of ${MAX_EXPERIMENTS}` : '…'}</Chip>}
        className="self-start"
      >
        <div className="mb-5 rounded-md border border-line/50 bg-bg p-3">
          <p className="mb-2 text-muted">
            Current experiment: <span className="text-ink">{describe(lab.config)}</span>, epoch {lab.epoch}, accuracy{' '}
            {Math.round(lab.accuracy * 100)}%
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Name (optional)"
              aria-label="Experiment name"
              className="min-w-0 flex-1 rounded-md border border-line/60 bg-surface px-3 py-1.5 outline-none focus:border-hi"
            />
            <button type="button" className={btnPrimary} onClick={save}>
              Save current experiment
            </button>
          </div>
        </div>

        {items === null ? (
          <p className="text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted">Nothing saved yet. Train something in the Network lab, then save it here.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line/50 bg-bg px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.name}</p>
                  <p className="text-xs text-muted">
                    {describe(e.snapshot.config)} · epoch {e.snapshot.epoch} · accuracy{' '}
                    {Math.round(e.snapshot.accuracy * 100)}% · {new Date(e.savedAt).toLocaleString()}
                  </p>
                </div>
                <button type="button" className={btn} onClick={() => load(e)}>
                  Load
                </button>
                <button
                  type="button"
                  className={btn}
                  aria-label={`Delete ${e.name}`}
                  onClick={() => act(() => deleteExperiment(e.id).then(() => undefined))}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-4 self-start">
        <Panel code="05.B" title="Progress and storage">
          <dl className="space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Academy lessons done</dt>
              <dd className="font-mono">
                {done.length} / {LESSONS.length}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Browser storage used</dt>
              <dd className="font-mono">{used === null ? 'unknown' : formatSize(used)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Saved only in this browser on this computer, never sent anywhere. Learning progress and your slider
            settings are saved automatically. Clearing the browser’s site data deletes all of it.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {confirmAll ? (
              <>
                <span className="text-xs text-neg">Delete everything?</span>
                <button type="button" className={btn} onClick={wipe}>
                  Yes, delete
                </button>
                <button type="button" className={btn} onClick={() => setConfirmAll(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className={btn} onClick={() => setConfirmAll(true)}>
                Delete all Vault data
              </button>
            )}
          </div>
        </Panel>

        {(error || note) && (
          <p role="status" className={`rounded-md border px-3 py-2 text-xs ${error ? 'border-neg/50 text-neg' : 'border-line/50 text-muted'}`}>
            {error ?? note}
          </p>
        )}
      </div>
    </div>
  )
}