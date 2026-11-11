interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  tabs: { value: T; label: string; note: string }[]
}

/** Sheet tabs for switching between two views of the same module. */
export function Tabs<T extends string>({ value, onChange, tabs }: TabsProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line/60">
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`-mb-px flex flex-col items-start gap-0.5 rounded-t-md border-b-2 px-5 py-2.5 text-left transition-colors duration-150 ${
              active ? 'border-hi bg-surface' : 'border-transparent hover:bg-surface/60'
            }`}
          >
            <span className={`text-sm font-medium ${active ? 'text-ink' : 'text-muted'}`}>{t.label}</span>
            <span className="text-[11px] text-muted">{t.note}</span>
          </button>
        )
      })}
    </div>
  )
}
