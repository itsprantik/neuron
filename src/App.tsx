import { useCallback, useState } from 'react'
import { glass } from './components/glass'
import { NavMenu } from './components/NavMenu'
import { NeuronHelp } from './components/NeuronHelp'
import { LabStore } from './lab/store'
import { MODULES } from './modules'
import type { ModuleId } from './modules'
import { CorePage } from './pages/CorePage'
import type { CoreTab } from './pages/CorePage'
import { PlannedPage } from './pages/PlannedPage'

function App() {
  const [current, setCurrent] = useState<ModuleId>('core')
  // Created once and kept here, so your experiment survives switching modules.
  const [lab] = useState(() => new LabStore())
  const [coreTab, setCoreTab] = useState<CoreTab>('learn')
  const [helpOpen, setHelpOpen] = useState(false)
  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const openLesson = () => {
    setCurrent('core')
    setCoreTab('learn')
    setHelpOpen(false)
  }
  const module = MODULES.find((m) => m.id === current) ?? MODULES[0]

  return (
    <div className="relative min-h-screen">
      {/* Soft colour behind the glass, so the blur has something to catch. Static, costs nothing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(48rem 30rem at 12% -8%, rgba(95,212,244,0.13), transparent 70%), radial-gradient(44rem 32rem at 100% 8%, rgba(120,150,255,0.14), transparent 70%)',
        }}
      />

      <h1 className="sr-only">
        NEURON — {module.label}
      </h1>

      {/* Floating controls. Content scrolls underneath them. */}
      <div className="sticky top-3 z-20 mx-3 mt-3 flex items-start gap-2 md:mx-6">
        <NavMenu current={current} onSelect={setCurrent} />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            onClick={() => setHelpOpen((o) => !o)}
            className={`${glass} rounded-full px-4 py-2 text-xs font-semibold text-hi transition-colors duration-150 hover:bg-hi hover:text-bg`}
          >
            Neuron?
          </button>
          <p
            className={`${glass} hidden items-center gap-2 rounded-full px-3.5 py-2 font-mono text-xs text-muted sm:flex`}
            title="The local language model is built last and is not installed yet."
          >
            <span className="inline-block h-2 w-2 rounded-full border border-muted" aria-hidden="true" />
            AI MODEL: NOT INSTALLED
          </p>
        </div>
      </div>

      <main className="blueprint-grid relative -mt-16 min-h-screen px-3 pb-8 pt-20 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          {module.id === 'core' ? (
            <CorePage lab={lab} tab={coreTab} onTab={setCoreTab} />
          ) : (
            <PlannedPage module={module} />
          )}
        </div>
      </main>

      {helpOpen && <NeuronHelp onClose={closeHelp} onOpenLesson={openLesson} />}
    </div>
  )
}

export default App
