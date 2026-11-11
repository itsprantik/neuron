import type { ReactNode } from 'react'

interface PanelProps {
  code: string
  title: string
  children: ReactNode
  className?: string
  /** Optional content on the right side of the title strip (a status chip, a button). */
  aside?: ReactNode
}

/** The basic container: soft 6 px corners, thin outline, faint depth, sheet-code chip in the header. */
export function Panel({ code, title, children, className = '', aside }: PanelProps) {
  return (
    <section
      className={`relative rounded-xl border border-white/10 bg-surface/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_40px_-22px_rgba(0,0,0,0.8)] ${className}`}
    >
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5 sm:px-5">
        <h2 className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <span className="font-mono text-[11px] font-normal text-muted">{code}</span>
          {title}
        </h2>
        {aside}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  )
}

interface SegmentedProps<T extends string | number> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  disabled?: boolean
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex gap-0.5 rounded-md border bg-bg p-0.5 ${
        disabled ? 'border-dashed border-line opacity-40' : 'border-line/60'
      }`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`rounded px-3 py-1.5 font-mono text-xs transition-colors duration-150 ${
              active ? 'bg-ink font-medium text-bg' : 'text-muted hover:bg-surface hover:text-ink'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

type ChipTone = 'good' | 'warn' | 'info' | 'idle'

const chipTone: Record<ChipTone, string> = {
  good: 'border-pos/50 bg-pos/10 text-pos',
  warn: 'border-hi/50 bg-hi/10 text-hi',
  info: 'border-line bg-bg text-ink',
  idle: 'border-line/60 bg-bg text-muted',
}

/** Small status pill. Colour is never the only signal: the text says the same thing. */
export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${chipTone[tone]}`}
    >
      {children}
    </span>
  )
}

/** A labelled number, used inside a <dl>. */
export function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line/50 bg-bg px-3 py-1.5">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-mono text-sm tabular-nums">{value}</dd>
    </div>
  )
}

export const btn =
  'rounded-md border border-line/70 bg-bg px-3.5 py-2 text-xs font-medium transition-colors duration-150 hover:border-ink hover:bg-surface disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-40 disabled:hover:border-line/70 disabled:hover:bg-bg'

export const btnPrimary =
  'rounded-md bg-hi px-5 py-2 text-xs font-semibold text-bg transition duration-150 hover:brightness-110 active:translate-y-px'
