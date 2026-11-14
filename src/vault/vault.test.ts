import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LESSONS } from '../academy/lessons'
import { LabStore } from '../lab/store'
import type { LabSnapshot } from '../lab/store'
import {
  MAX_EXPERIMENTS,
  MAX_PROJECTS,
  clearVault,
  deleteExperiment,
  deleteProject,
  explain,
  listDamagedExperiments,
  listExperiments,
  listProjects,
  loadPrefs,
  loadProgress,
  saveExperiment,
  saveProgress,
  savePrefs,
  saveProject,
  storageUsed,
} from './vault'

// The store stops its animation loop with this; Node does not have it.
vi.stubGlobal('cancelAnimationFrame', () => {})

const snap = (): LabSnapshot => new LabStore().snapshot()
const files = { html: '<p>hi</p>', css: 'p{}', js: '1' }
const errorNamed = (name: string) => Object.assign(new Error('x'), { name })

/** Writes any value straight into the Vault's storage, the way a damaged or old save could look. */
async function rawPut(key: string, value: unknown): Promise<void> {
  await listExperiments() // make sure the database exists
  const db = await new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open('neuron-vault')
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  await new Promise<void>((res, rej) => {
    const tx = db.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(value, key)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
  db.close()
}

beforeEach(async () => {
  vi.unstubAllGlobals()
  vi.stubGlobal('cancelAnimationFrame', () => {})
  await clearVault()
})

describe('experiments', () => {
  it('saves, lists newest first, and deletes', async () => {
    await saveExperiment('first', snap())
    await new Promise((r) => setTimeout(r, 5))
    await saveExperiment('second', snap())
    const list = await listExperiments()
    expect(list.map((e) => e.name)).toEqual(['second', 'first'])
    await deleteExperiment(list[0].id)
    expect((await listExperiments()).map((e) => e.name)).toEqual(['first'])
  })

  it('stores a snapshot that comes back equal', async () => {
    const s = snap()
    await saveExperiment('same', s)
    expect((await listExperiments())[0].snapshot).toEqual(s)
  })

  it('cleans the name: trims to 60 characters and replaces an empty one', async () => {
    await saveExperiment('x'.repeat(100), snap())
    await saveExperiment('   ', snap())
    const names = (await listExperiments()).map((e) => e.name).sort()
    expect(names).toEqual(['Untitled experiment', 'x'.repeat(60)])
  })

  it('gives every save its own id, even when many happen in the same millisecond', async () => {
    await Promise.all(Array.from({ length: MAX_EXPERIMENTS }, (_, i) => saveExperiment(`e${i}`, snap())))
    const ids = (await listExperiments()).map((e) => e.id)
    expect(ids).toHaveLength(MAX_EXPERIMENTS)
    expect(new Set(ids).size).toBe(MAX_EXPERIMENTS)
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{24}$/)
  })

  it('never overwrites an existing experiment, even if two saves were given the same id', async () => {
    vi.stubGlobal('crypto', { getRandomValues: (a: Uint8Array) => a.fill(7) }) // every id comes out identical
    await saveExperiment('first', snap())
    await expect(saveExperiment('second', snap())).rejects.toThrow()
    expect((await listExperiments()).map((e) => e.name)).toEqual(['first'])
  })

  it('never holds more than 20, even when 30 saves start at once', async () => {
    const results = await Promise.allSettled(Array.from({ length: 30 }, (_, i) => saveExperiment(`e${i}`, snap())))
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(MAX_EXPERIMENTS)
    const refused = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(refused).toHaveLength(10)
    for (const r of refused) expect(String(r.reason.message)).toMatch(/at most 20 experiments/)
    expect(await listExperiments()).toHaveLength(MAX_EXPERIMENTS)
  })

  it('allows a new save again after one is deleted', async () => {
    for (let i = 0; i < MAX_EXPERIMENTS; i++) await saveExperiment(`e${i}`, snap())
    await expect(saveExperiment('extra', snap())).rejects.toThrow(/at most 20/)
    await deleteExperiment((await listExperiments())[0].id)
    await saveExperiment('extra', snap())
    expect(await listExperiments()).toHaveLength(MAX_EXPERIMENTS)
  })

  it('refuses to save numbers that are not valid, and stores nothing', async () => {
    const s = snap()
    s.weights[0][0][0] = NaN
    await expect(saveExperiment('bad', s)).rejects.toThrow(/not valid/)
    expect(await listExperiments()).toHaveLength(0)
  })
})

describe('damaged entries', () => {
  it('are left out of the list, shown as damaged, and can be deleted', async () => {
    await saveExperiment('good', snap())
    const wrong = structuredClone(snap()) as unknown as Record<string, any>
    wrong.config.activation = 'constructor'
    await rawPut('exp:bad1', { id: 'bad1', name: 'broken one', savedAt: 1, snapshot: wrong })
    await rawPut('exp:bad2', 42)
    await rawPut('exp:bad3', { name: 'no snapshot' })

    expect((await listExperiments()).map((e) => e.name)).toEqual(['good'])
    const damaged = await listDamagedExperiments()
    expect(damaged.map((d) => d.id).sort()).toEqual(['bad1', 'bad2', 'bad3'])
    expect(damaged.find((d) => d.id === 'bad1')!.name).toBe('broken one')

    for (const d of damaged) await deleteExperiment(d.id)
    expect(await listDamagedExperiments()).toEqual([])
    expect(await listExperiments()).toHaveLength(1)
  })

  it('still count toward the limit of 20', async () => {
    for (let i = 0; i < MAX_EXPERIMENTS; i++) await rawPut(`exp:bad${i}`, 'junk')
    await expect(saveExperiment('new', snap())).rejects.toThrow(/at most 20/)
    await deleteExperiment('bad0')
    await saveExperiment('new', snap())
  })

  it('an entry with a good snapshot but a broken name or time is still shown', async () => {
    await rawPut('exp:odd', { name: 5, savedAt: 'yesterday', snapshot: snap() })
    const [e] = await listExperiments()
    expect(e.name).toBe('Untitled experiment')
    expect(e.savedAt).toBe(0)
  })
})

describe('progress and preferences', () => {
  it('progress round-trips', async () => {
    expect(await loadProgress()).toEqual([])
    await saveProgress([LESSONS[0].id])
    expect(await loadProgress()).toEqual([LESSONS[0].id])
  })

  it('progress drops unknown lessons and non-text items', async () => {
    await rawPut('progress', [LESSONS[0].id, 'no-such-lesson', 7, null])
    expect(await loadProgress()).toEqual([LESSONS[0].id])
    await rawPut('progress', 'not a list')
    expect(await loadProgress()).toEqual([])
  })

  it('preferences round-trip', async () => {
    expect(await loadPrefs()).toBeNull()
    await savePrefs({ lr: 0.5, flow: false, flowSpeed: 30 })
    expect(await loadPrefs()).toEqual({ lr: 0.5, flow: false, flowSpeed: 30 })
  })

  it('preferences are clamped into the allowed range, and wrong shapes are ignored', async () => {
    await rawPut('prefs', { lr: 50, flow: true, flowSpeed: -3 })
    expect(await loadPrefs()).toEqual({ lr: 1, flow: true, flowSpeed: 0 })
    await rawPut('prefs', { lr: NaN, flow: true, flowSpeed: 999 })
    expect(await loadPrefs()).toEqual({ lr: 0.01, flow: true, flowSpeed: 100 })
    await rawPut('prefs', { lr: 'x', flow: true, flowSpeed: 1 })
    expect(await loadPrefs()).toBeNull()
  })
})

describe('Create projects', () => {
  it('save, list and delete', async () => {
    await saveProject('page', files)
    const [p] = await listProjects()
    expect(p).toMatchObject({ name: 'page', ...files })
    await deleteProject(p.id)
    expect(await listProjects()).toEqual([])
  })

  it('refuses a project that is too large', async () => {
    await expect(saveProject('big', { ...files, js: 'x'.repeat(200_001) })).rejects.toThrow(/too large/)
  })

  it('holds at most 20, even under concurrent saves', async () => {
    const results = await Promise.allSettled(Array.from({ length: 25 }, (_, i) => saveProject(`p${i}`, files)))
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(MAX_PROJECTS)
    expect(await listProjects()).toHaveLength(MAX_PROJECTS)
  })

  it('skips stored projects that are missing a file', async () => {
    await rawPut('proj:broken', { name: 'x', html: '<p>', css: 5 })
    expect(await listProjects()).toEqual([])
  })
})

describe('storage failures', () => {
  it('reopens the database after the browser closed it (for example "clear site data")', async () => {
    await saveExperiment('before', snap())
    await new Promise<void>((res) => {
      const r = indexedDB.deleteDatabase('neuron-vault')
      r.onsuccess = () => res()
    })
    expect(await listExperiments()).toEqual([]) // works again, with an empty Vault
    await saveExperiment('after', snap())
    expect((await listExperiments()).map((e) => e.name)).toEqual(['after'])
  })

  it('says so, in plain words, when the browser has no IndexedDB, then recovers', async () => {
    await new Promise<void>((res) => {
      const r = indexedDB.deleteDatabase('neuron-vault') // makes the Vault forget its open connection
      r.onsuccess = () => res()
    })
    vi.stubGlobal('indexedDB', undefined)
    await expect(saveExperiment('x', snap())).rejects.toThrow(/cannot store data/)
    await expect(listExperiments()).rejects.toThrow(/cannot store data/)
    vi.unstubAllGlobals()
    vi.stubGlobal('cancelAnimationFrame', () => {})
    await saveExperiment('works again', snap())
    expect(await listExperiments()).toHaveLength(1)
  })

  it('explain() turns browser errors into sentences a student can act on', () => {
    expect(explain(errorNamed('QuotaExceededError'))).toMatch(/storage is full/)
    expect(explain(errorNamed('SecurityError'))).toMatch(/blocking storage/)
    expect(explain(errorNamed('InvalidStateError'))).toMatch(/Reload the page/)
    expect(explain(errorNamed('DataCloneError'))).toMatch(/cannot be saved/)
    expect(explain(new Error('my own message'))).toBe('my own message')
    expect(explain('a string')).toBe('Storage failed for an unknown reason.')
    expect(explain(undefined)).toBe('Storage failed for an unknown reason.')
  })

  it('storageUsed() gives a number when the browser can tell, otherwise null', async () => {
    vi.stubGlobal('navigator', { storage: { estimate: async () => ({ usage: 123 }) } })
    expect(await storageUsed()).toBe(123)
    vi.stubGlobal('navigator', {})
    expect(await storageUsed()).toBeNull()
  })
})