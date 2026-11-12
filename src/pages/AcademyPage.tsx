import { useState } from 'react'
import { LESSONS } from '../academy/lessons'
import { BookWindow } from '../components/BookWindow'
import { Chip, Panel, btn, btnPrimary } from '../components/Panel'

interface AcademyPageProps {
  done: string[]
  onDone: (lessonId: string) => void
  /** Jump to the matching part of the Core module. */
  onTry: (tab: 'learn' | 'lab') => void
}

export function AcademyPage({ done, onDone, onTry }: AcademyPageProps) {
  const [index, setIndex] = useState(0)
  // Picked answers, keyed "lessonId:questionNumber". Kept while you stay in Academy.
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [book, setBook] = useState(false)
  const lesson = LESSONS[index]
  const isDone = done.includes(lesson.id)

  const pick = (qi: number, option: number) => {
    const next = { ...picked, [`${lesson.id}:${qi}`]: option }
    setPicked(next)
    if (lesson.check.every((q, i) => next[`${lesson.id}:${i}`] === q.answer)) onDone(lesson.id)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      {book && <BookWindow done={done} onClose={() => setBook(false)} />}
      <Panel
        code="04.A"
        title="Lessons"
        aside={<Chip tone={done.length === LESSONS.length ? 'good' : 'info'}>{done.length} of {LESSONS.length} done</Chip>}
        className="self-start"
      >
        <ol className="-m-2 space-y-0.5">
          {LESSONS.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                aria-current={i === index ? 'step' : undefined}
                onClick={() => setIndex(i)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 ${
                  i === index ? 'bg-bg ring-1 ring-line/70' : 'hover:bg-bg/60'
                }`}
              >
                <span className={`w-5 font-mono text-xs ${i === index ? 'text-hi' : 'text-muted'}`}>{i + 1}</span>
                <span className="flex-1">{l.title}</span>
                {done.includes(l.id) && <span className="font-mono text-xs text-pos">done</span>}
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="space-y-4">
        <Panel code={`04.${index + 1}`} title={lesson.title}   aside={
    <span className="flex items-center gap-2">
      <Chip tone={done.length === LESSONS.length ? 'good' : 'info'}>{done.length}/{LESSONS.length}</Chip>
      <button type="button" className={btn} onClick={() => setBook(!book)} aria-expanded={book}>
        Book
      </button>
    </span>
  }>
          <p className="mb-4 text-[15px] text-hi">{lesson.summary}</p>
          <div className="max-w-2xl space-y-3 text-muted">
            {lesson.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {lesson.formula && (
            <p className="mt-4 overflow-x-auto rounded-md border border-line/50 bg-bg px-4 py-3 font-mono text-xs">
              {lesson.formula}
            </p>
          )}
          {lesson.tryIt && (
            <button type="button" className={`${btn} mt-4`} onClick={() => onTry(lesson.tryIt!.tab)}>
              {lesson.tryIt.label}
            </button>
          )}
        </Panel>

        <Panel code="04.✓" title="Knowledge check">
          <div className="space-y-5">
            {lesson.check.map((q, qi) => {
              const sel = picked[`${lesson.id}:${qi}`]
              // Rotate the options so the right answer is not always first.
              const shift = (index + qi) % q.options.length
              const order = q.options.map((_, i) => (i + shift) % q.options.length)
              return (
                <fieldset key={q.q} className="space-y-2">
                  <legend className="mb-1 font-medium">
                    {qi + 1}. {q.q}
                  </legend>
                  {order.map((oi) => (
                    <label
                      key={oi}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-line/50 bg-bg px-3 py-2 transition-colors duration-150 hover:border-ink"
                    >
                      <input
                        type="radio"
                        name={`${lesson.id}-${qi}`}
                        checked={sel === oi}
                        onChange={() => pick(qi, oi)}
                        className="accent-hi"
                      />
                      {q.options[oi]}
                    </label>
                  ))}
                  <p aria-live="polite" className="min-h-5 text-xs">
                    {sel === undefined ? null : sel === q.answer ? (
                      <span className="text-pos">Correct. {q.why}</span>
                    ) : (
                      <span className="text-neg">Not quite. Read the lesson again and try another answer.</span>
                    )}
                  </p>
                </fieldset>
              )
            })}
          </div>

          {isDone && index < LESSONS.length - 1 && (
            <button type="button" className={`${btnPrimary} mt-5`} onClick={() => setIndex(index + 1)}>
              Next lesson
            </button>
          )}
        </Panel>
      </div>
    </div>
  )
}