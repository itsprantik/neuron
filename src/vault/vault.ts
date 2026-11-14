import { LESSONS } from '../academy/lessons'
import { validateSnapshot } from '../lab/snapshot'
import type { LabSnapshot } from '../lab/store'

/**
 * The Vault: everything is stored in this browser's IndexedDB, on this computer only.
 * One object store ("kv") holds these kinds of keys:
 *   progress        -> ids of finished lessons
 *   prefs           -> learning rate and animation settings
 *   exp:<id>        -> a saved experiment
 *   proj:<id>       -> a saved Create project
 */
const DB_NAME = 'neuron-vault'
const STORE = 'kv'
export const MAX_EXPERIMENTS = 20
const MAX_NAME = 60

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

/** A stored experiment that failed validation. It can only be deleted. */
export interface DamagedExperiment {
  id: string
  name: string
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
      req.onsuccess = () => {
        const db = req.result
        // If the browser closes the database (for example "clear site data"), forget it so the next call reopens it.
        db.onclose = () => {
          opened = null
        }
        // Another tab wants to delete or upgrade the database: step aside instead of blocking it.
        db.onversionchange = () => {
          db.close()
          opened = null
        }
        resolve(db)
      }
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
  const name = e instanceof Error ? e.name : ''
  if (name === 'QuotaExceededError') {
    return 'Browser storage is full. Delete some saved experiments or free up disk space, then try again.'
  }
  if (name === 'SecurityError') {
    return 'The browser is blocking storage for this page (private mode or blocked site data), so nothing can be saved.'
  }
  if (name === 'InvalidStateError') {
    return 'The browser closed the Vault’s storage. Reload the page and try again.'
  }
  if (name === 'DataCloneError') return 'This data cannot be saved.'
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

/** A random 96-bit id. Two saves can never share one, even in the same millisecond or in two tabs. */
function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')
}

const range = (prefix: string) => IDBKeyRange.bound(prefix, prefix + '\uffff')

/** Every stored item whose key starts with `prefix`, with its key. */
function readAll(prefix: string): Promise<{ id: string; value: unknown }[]> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const store = tx.objectStore(STORE)
        const keys = store.getAllKeys(range(prefix))
        const values = store.getAll(range(prefix))
        tx.oncomplete = () => resolve(keys.result.map((k, i) => ({ id: String(k).slice(prefix.length), value: values.result[i] })))
        tx.onabort = () => reject(tx.error ?? new Error('Reading the Vault failed.'))
      }),
  )
}

/**
 * Adds one item under a fresh id. The limit is checked and the item written inside a single
 * transaction, so two quick saves (a double click, two tabs) can never go past the limit.
 */
function insertLimited(prefix: string, max: number, limitMessage: string, entry: (id: string) => object): Promise<void> {
  return open().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        let refused: Error | null = null
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(refused ?? tx.error ?? new Error('The save was cancelled by the browser.'))
        const count = store.count(range(prefix))
        count.onsuccess = () => {
          if (count.result >= max) {
            refused = new Error(limitMessage)
            tx.abort()
            return
          }
          const id = newId()
          store.add(entry(id), prefix + id) // add (not put): an id clash fails instead of overwriting
        }
      }),
  )
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const nameOf = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.slice(0, MAX_NAME) : fallback)
const timeOf = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

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
/** Valid saved experiments, newest first. Damaged ones are left out; see listDamagedExperiments. */
export async function listExperiments(): Promise<SavedExperiment[]> {
  const out: SavedExperiment[] = []
  for (const { id, value } of await readAll('exp:')) {
    const snapshot = isRecord(value) ? validateSnapshot(value.snapshot) : null
    if (isRecord(value) && snapshot) {
      out.push({ id, name: nameOf(value.name, 'Untitled experiment'), savedAt: timeOf(value.savedAt), snapshot })
    }
  }
  return out.sort((a, b) => b.savedAt - a.savedAt)
}

/** Stored experiments that are not valid. They still count toward the limit, so they must be deletable. */
export async function listDamagedExperiments(): Promise<DamagedExperiment[]> {
  const out: DamagedExperiment[] = []
  for (const { id, value } of await readAll('exp:')) {
    if (!isRecord(value) || !validateSnapshot(value.snapshot)) {
      out.push({ id, name: isRecord(value) ? nameOf(value.name, 'Unnamed entry') : 'Unnamed entry' })
    }
  }
  return out
}

export async function saveExperiment(name: string, snapshot: LabSnapshot): Promise<void> {
  const clean = validateSnapshot(snapshot)
  if (!clean) {
    throw new Error('This experiment’s numbers are not valid (they may have overflowed), so it cannot be saved. Press Reset weights and train again.')
  }
  const title = nameOf(name, 'Untitled experiment')
  await insertLimited('exp:', MAX_EXPERIMENTS, `The Vault holds at most ${MAX_EXPERIMENTS} experiments. Delete one first.`, (id) => ({
    id,
    name: title,
    savedAt: Date.now(),
    snapshot: clean,
  }))
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

// ---- Saved Create projects ----
export const MAX_PROJECTS = 20
const MAX_PROJECT_CHARS = 200_000

export interface SavedProject {
  id: string
  name: string
  savedAt: number
  html: string
  css: string
  js: string
}

export async function listProjects(): Promise<SavedProject[]> {
  const out: SavedProject[] = []
  for (const { id, value } of await readAll('proj:')) {
    if (isRecord(value) && [value.html, value.css, value.js].every((t) => typeof t === 'string')) {
      out.push({
        id,
        name: nameOf(value.name, 'Untitled project'),
        savedAt: timeOf(value.savedAt),
        html: value.html as string,
        css: value.css as string,
        js: value.js as string,
      })
    }
  }
  return out.sort((a, b) => b.savedAt - a.savedAt)
}

export async function saveProject(name: string, files: { html: string; css: string; js: string }): Promise<void> {
  if (files.html.length + files.css.length + files.js.length > MAX_PROJECT_CHARS) {
    throw new Error('This project is too large to save (limit about 200 000 characters).')
  }
  const title = nameOf(name, 'Untitled project')
  const { html, css, js } = files
  await insertLimited('proj:', MAX_PROJECTS, `The Vault holds at most ${MAX_PROJECTS} projects. Delete one first.`, (id) => ({
    id,
    name: title,
    savedAt: Date.now(),
    html,
    css,
    js,
  }))
}

export const deleteProject = (id: string) => run('readwrite', (s) => s.delete(`proj:${id}`))