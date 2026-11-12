import { LESSONS } from '../academy/lessons'
import type { LabSnapshot } from '../lab/store'

/**
 * The Vault: everything is stored in this browser's IndexedDB, on this computer only.
 * One object store ("kv") holds three kinds of keys:
 *   progress        -> ids of finished lessons
 *   prefs           -> learning rate and animation settings
 *   exp:<id>        -> a saved experiment
 */
const DB_NAME = 'neuron-vault'
const STORE = 'kv'
export const MAX_EXPERIMENTS = 20

export interface Prefs {
  lr: number
  flow: boolean
  flowSpeed: number
}

export interface SavedExperiment {
  id: string
  name: string
  savedAt: number
  snapshot: LabSnapshot
}

let opened: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (!opened) {
    opened = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('This browser cannot store data here, so nothing can be saved.'))
        return
      }
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error('Could not open the Vault.'))
    })
    opened.catch(() => {
      opened = null // let the next call try again
    })
  }
  return opened
}

/** Turns a storage error into a sentence a student can act on. */
export function explain(e: unknown): string {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    return 'Browser storage is full. Delete some saved experiments or free up disk space, then try again.'
  }
  return e instanceof Error && e.message ? e.message : 'Storage failed for an unknown reason.'
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(req.result)
        tx.onerror = () => reject(tx.error ?? req.error)
        tx.onabort = () => reject(tx.error ?? new Error('The save was cancelled by the browser.'))
      }),
  )
}

const get = <T>(key: string) => run<T | undefined>('readonly', (s) => s.get(key))
const put = (key: string, value: unknown) => run('readwrite', (s) => s.put(value, key))

// ---- Academy progress ----
export async function loadProgress(): Promise<string[]> {
  const v = await get<unknown>('progress')
  const known = new Set(LESSONS.map((l) => l.id))
  return Array.isArray(v) ? v.filter((id): id is string => typeof id === 'string' && known.has(id)) : []
}

export const saveProgress = (done: string[]) => put('progress', done)

// ---- Preferences ----
export async function loadPrefs(): Promise<Prefs | null> {
  const v = await get<Partial<Prefs>>('prefs')
  if (!v || typeof v.lr !== 'number' || typeof v.flowSpeed !== 'number' || typeof v.flow !== 'boolean') return null
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo))
  return { lr: clamp(v.lr, 0.01, 1), flow: v.flow, flowSpeed: clamp(v.flowSpeed, 0, 100) }
}

export const savePrefs = (p: Prefs) => put('prefs', p)

// ---- Saved experiments ----
export async function listExperiments(): Promise<SavedExperiment[]> {
  const all = await run<SavedExperiment[]>('readonly', (s) => s.getAll(IDBKeyRange.bound('exp:', 'exp:\uffff')))
  return all.filter((e) => e && typeof e.id === 'string' && e.snapshot).sort((a, b) => b.savedAt - a.savedAt)
}

export async function saveExperiment(name: string, snapshot: LabSnapshot): Promise<void> {
  const keys = await run<IDBValidKey[]>('readonly', (s) => s.getAllKeys(IDBKeyRange.bound('exp:', 'exp:\uffff')))
  if (keys.length >= MAX_EXPERIMENTS) {
    throw new Error(`The Vault holds at most ${MAX_EXPERIMENTS} experiments. Delete one first.`)
  }
  const id = Date.now().toString(36)
  const entry: SavedExperiment = { id, name: name.trim() || 'Untitled experiment', savedAt: Date.now(), snapshot }
  await put(`exp:${id}`, entry)
}

export const deleteExperiment = (id: string) => run('readwrite', (s) => s.delete(`exp:${id}`))

/** Removes everything the Vault has stored. */
export const clearVault = () => run('readwrite', (s) => s.clear())

/** Rough size of this site's browser storage, if the browser can tell. */
export async function storageUsed(): Promise<number | null> {
  try {
    return (await navigator.storage.estimate()).usage ?? null
  } catch {
    return null
  }
}