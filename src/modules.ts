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
    built: true,
    when: 'Local runtime required',
    description:
      'An offline AI tutor powered by a local language model through llama.cpp. Nothing is sent to a cloud AI service.',
    plans: [
      'Explain AI, machine learning and neural networks',
      'Stream local answers and show the model thinking output',
      'Detect when the local server is offline, loading or ready',
      'Use your own GGUF model without automatic downloads',
    ],
  },
  {
    id: 'create',
    code: '03',
    label: 'CREATE',
    built: true,
    when: 'Built',
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
    built: true,
    when: 'Built',
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
    built: true,
    when: 'Built',
    description: 'Local storage for your projects, experiments and progress, stored only in this browser.',
    plans: [
      'Saved projects and previous experiments',
      'Learning progress and preferences',
      'Storage limits and clear error messages',
    ],
  },
]
