export type ModuleId = 'core' | 'ai' | 'create' | 'academy' | 'vault'

export interface ModuleInfo {
  id: ModuleId
  code: string
  label: string
  built: boolean
  when: string
  description: string
  plans: string[]
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'core',
    code: '01',
    label: 'CORE',
    built: true,
    when: 'Days 3–6',
    description: 'Interactive neural-network laboratory.',
    plans: [],
  },
  {
    id: 'ai',
    code: '02',
    label: 'AI',
    built: false,
    when: 'Planned for days 11–12 (built last)',
    description:
      'An offline AI tutor that runs a small language model on this computer using llama.cpp. Nothing is sent to the internet.',
    plans: [
      'Explain AI, machine learning and neural networks',
      'Explain simulator results and generated code',
      'Model states: not installed, downloading, loading, ready, error',
      'Model install only after you approve it. No automatic downloads.',
    ],
  },
  {
    id: 'create',
    code: '03',
    label: 'CREATE',
    built: false,
    when: 'Planned for day 9 (editor and sandbox), then day 12 (AI generation)',
    description:
      'Build small HTML, CSS and JavaScript projects, edit them, and preview them safely.',
    plans: [
      'Code editor with live preview in a sandboxed iframe',
      'Generated code treated as untrusted and never run in the main app',
      'Save projects locally and download the files',
      'AI generation added once the local model is working',
    ],
  },
  {
    id: 'academy',
    code: '04',
    label: 'ACADEMY',
    built: false,
    when: 'Planned for day 7',
    description: 'Short lessons, knowledge checks and challenges about how AI works.',
    plans: [
      'AI fundamentals, machine learning, neural networks',
      'Activation functions, forward propagation, training',
      'LLM basics, quantization, local inference, AI limitations',
    ],
  },
  {
    id: 'vault',
    code: '05',
    label: 'VAULT',
    built: false,
    when: 'Planned for day 8',
    description: 'Local storage for your projects, experiments and progress, stored only in this browser.',
    plans: [
      'Saved projects and previous experiments',
      'Learning progress and preferences',
      'Storage limits and clear error messages',
    ],
  },
]
