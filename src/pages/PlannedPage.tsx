import { Panel } from '../components/Panel'
import type { ModuleInfo } from '../modules'

/** Honest placeholder: nothing here pretends to work. */
export function PlannedPage({ module }: { module: ModuleInfo }) {
  return (
    <Panel code={module.code} title={`${module.label} — NOT BUILT YET`}>
      <div className="max-w-2xl space-y-4">
        <p className="inline-block rounded-full border border-dashed border-line px-3 py-1 font-mono text-xs text-muted">
          STATUS: PLANNED · {module.when}
        </p>
        <p>{module.description}</p>
        <ul className="list-inside list-disc space-y-1 text-muted marker:text-hi">
          {module.plans.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          This page has no working controls yet. It will be replaced when the module is built.
        </p>
      </div>
    </Panel>
  )
}
