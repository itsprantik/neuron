
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
    when: 'Local integration',
    description:
      'An offline AI tutor powered by Qwen3 and llama.cpp.',
    plans: [
      'Local model connection',
      'Streaming AI conversations',
      'Thinking output panel',
      'Educational AI assistant',
      'No cloud API keys',
    ],
  },
  {
    id: 'create',
    code: '03',
    label: 'CREATE',
    built: true,
    when: 'Built',
    description:
      'Build small HTML, CSS and JavaScript projects.',
    plans: [
      'Code editor with live preview',
      'Sandboxed project execution',
      'Save projects locally',
      'AI generation integration',
    ],
  },
  {
    id: 'academy',
    code: '04',
    label: 'ACADEMY',
    built: true,
    when: 'Built',
    description: 'Lessons and challenges about AI.',
    plans: [
      'AI fundamentals',
      'Neural networks',
      'Activation functions',
      'Forward propagation',
      'LLM fundamentals',
    ],
  },
  {
    id: 'vault',
    code: '05',
    label: 'VAULT',
    built: true,
    when: 'Built',
    description:
      'Local storage for projects, experiments and progress.',
    plans: [
      'Saved projects',
      'Previous experiments',
      'Learning progress',
      'Preferences',
    ],
  },
]
