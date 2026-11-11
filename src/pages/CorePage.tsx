import { useEffect } from 'react'
import { DecisionMap } from '../components/DecisionMap'
import { ExperimentPanel } from '../components/ExperimentPanel'
import { ExplainPanel } from '../components/ExplainPanel'
import { LossChart } from '../components/LossChart'
import { MeetNeuron } from '../components/MeetNeuron'
import { NetworkDiagram } from '../components/NetworkDiagram'
import { NodeInspector } from '../components/NodeInspector'
import { Tabs } from '../components/Tabs'
import type { LabStore } from '../lab/store'

export type CoreTab = 'learn' | 'lab'

interface CorePageProps {
  lab: LabStore
  tab: CoreTab
  onTab: (tab: CoreTab) => void
}

export function CorePage({ lab, tab, onTab }: CorePageProps) {
  // Stop the training loop when leaving this page, so nothing keeps running in the background.
  useEffect(() => () => lab.stop(), [lab])

  const openTab = (t: CoreTab) => {
    if (t === 'learn') lab.stop()
    onTab(t)
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onChange={openTab}
        tabs={[
          { value: 'learn', label: 'Meet a neuron', note: 'Start here if neurons are new' },
          { value: 'lab', label: 'Network lab', note: 'Train a network and watch it learn' },
        ]}
      />

      {tab === 'learn' ? (
        <MeetNeuron onGoLab={() => openTab('lab')} />
      ) : (
        <>
          <ol className="grid gap-px overflow-hidden rounded-md border border-line/60 bg-line/60 text-sm sm:grid-cols-3">
            {[
              'Pick a problem, then press Train.',
              'Watch the decision map fill with colour.',
              'Click a neuron to see its maths.',
            ].map((t, i) => (
              <li key={t} className="flex gap-3 bg-surface px-4 py-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-hi font-mono text-[11px] font-semibold text-bg">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>

          <ExperimentPanel lab={lab} />
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div className="space-y-4">
              <NetworkDiagram lab={lab} />
              <NodeInspector lab={lab} onLearn={() => openTab('learn')} />
            </div>
            <div className="space-y-4">
              <DecisionMap lab={lab} />
              <LossChart lab={lab} />
            </div>
          </div>
          <ExplainPanel />
        </>
      )}
    </div>
  )
}
