import { useEffect, useRef, useState } from 'react'
import { MODULES } from '../modules'
import type { ModuleId } from '../modules'
import { glass } from './glass'

interface NavMenuProps {
  current: ModuleId
  onSelect: (id: ModuleId) => void
}

/** Small NEURON mark: two inputs feeding one neuron. */
function Mark() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" aria-hidden="true">
      <g stroke="var(--color-line)" strokeWidth="1.3">
        <line x1="5" y1="7" x2="14" y2="14" />
        <line x1="5" y1="21" x2="14" y2="14" />
        <line x1="14" y1="14" x2="23" y2="14" />
      </g>
      <circle cx="5" cy="7" r="3" fill="var(--color-bg)" stroke="var(--color-pos)" strokeWidth="1.3" />
      <circle cx="5" cy="21" r="3" fill="var(--color-bg)" stroke="var(--color-neg)" strokeWidth="1.3" />
      <circle cx="14" cy="14" r="3.5" fill="var(--color-bg)" stroke="var(--color-hi)" strokeWidth="1.5" />
      <circle cx="23" cy="14" r="2.5" fill="var(--color-bg)" stroke="var(--color-line)" strokeWidth="1.3" />
    </svg>
  )
}

/**
 * The floating menu. It shows where you are; click it and the five modules drop down.
 * Closes on Escape, on a click outside, or after you pick a module.
 */
export function NavMenu({ current, onSelect }: NavMenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const active = MODULES.find((m) => m.id === current) ?? MODULES[0]

  useEffect(() => {
    if (!open) return
    const onKey = (e: { key: string }) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: { target: unknown }) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="module-menu"
        onClick={() => setOpen((o) => !o)}
        className={`${glass} flex items-center gap-3 rounded-2xl py-2 pl-3 pr-3.5 transition-colors duration-150 hover:bg-white/10`}
      >
        <Mark />
        <span className="text-left leading-tight">
          <span className="block font-mono text-[10px] tracking-[0.2em] text-muted">NEURON</span>
          <span className="block text-sm font-medium">
            <span className="mr-1.5 font-mono text-hi">{active.code}</span>
            {active.label}
          </span>
        </span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`ml-1 h-3 w-3 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul id="module-menu" className={`${glass} absolute left-0 top-full z-30 mt-2 w-60 rounded-2xl p-1.5`}>
          {MODULES.map((m) => {
            const isCurrent = m.id === current
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => {
                    onSelect(m.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 ${
                    isCurrent ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`font-mono text-sm ${isCurrent ? 'text-hi' : 'text-muted'}`}>{m.code}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-[11px] text-muted">{m.built ? 'Ready to use' : 'Planned, not built yet'}</span>
                  </span>
                  {isCurrent && (
                    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 text-hi">
                      <path d="M2.5 6.5 5 9l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
          <li className="mt-1 border-t border-white/10 px-3 pb-1.5 pt-2.5 text-[11px] leading-snug text-muted" aria-hidden="true">
            Understand Intelligence.
            <br />
            Experiment With It. Create With It.
            <span className="ml-1 font-mono">v0.6</span>
          </li>
        </ul>
      )}
    </div>
  )
}
