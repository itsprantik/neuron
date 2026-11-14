# NEURON

An offline-first AI learning lab that runs in your browser. You can train a small neural network and watch it learn, read short lessons, write small web projects, and save your work. It was built for a school science exhibition, and it is meant to run on an ordinary laptop with no internet connection.

## What is in it

| Module | Status | What it does |
| --- | --- | --- |
| **CORE** | Built | A neural-network lab. "Meet a neuron" explains one neuron step by step. "Network lab" lets you pick a dataset, an activation function, 0 to 2 hidden layers and the learning rate, then train, step, edit weights by hand and probe the network. |
| **ACADEMY** | Built | Nine short lessons with check questions, from "What is AI?" to local inference. A **Book** button opens a floating window that summarizes every lesson. |
| **CREATE** | Built | A small HTML, CSS and JavaScript editor with a live preview, four starter templates, and saved projects. |
| **VAULT** | Built | Saves your experiments, lesson progress and settings in this browser. |
| **AI** | Not built yet | Planned last: an offline tutor using a small local language model (llama.cpp). The app shows a placeholder and does not download or run any model. |

## Offline and privacy

- Nothing in `src/` makes a network request: no `fetch`, no `XMLHttpRequest`, no WebSocket, no web links to load. Fonts are bundled with the app.
- You need internet **once**, to run `npm install`. After that, everything works offline.
- Your data stays in this browser's IndexedDB on this computer. Nothing is uploaded.
- The CREATE preview runs your code in a sandboxed frame that is blocked from the network (`default-src 'none'`) and cannot reach the NEURON page.

## Requirements

- Node.js 22.12 or newer (developed on Node 26)
- A modern browser. Developed and checked in Chrome.
- Any computer. The app is light, and it was designed for a Windows 11 laptop with 8 GB of RAM.

## Run it

```
npm install
npm run dev
```

Then open http://localhost:3000. The port is fixed: if 3000 is busy, the dev server stops with an error instead of picking another port.

To build and serve the production version:

```
npm run build
npm run preview
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server (port 3000) |
| `npm run build` | Type-check with `tsc -b`, then build into `dist/` |
| `npm run preview` | Serve the built app |
| `npm run lint` | Run oxlint |
| `npm test` | Run all tests once |
| `npm run test:watch` | Re-run tests when files change |

## Tests

Tests use Vitest and run in Node. They need no browser and no internet. `fake-indexeddb` stands in for the browser's IndexedDB.

- `src/core/core.test.ts`: the neural-network maths: seeded random numbers, activation functions, datasets, forward pass, and backpropagation checked against a numeric slope. It also checks that a small network learns XOR.
- `src/lab/snapshot.test.ts`: checking of saved experiments (many kinds of bad data are refused) and `LabStore.load` (a refused load changes nothing).
- `src/vault/vault.test.ts`: saving, the 20-item limit under simultaneous saves, unique ids, damaged entries, recovery when storage is cleared or missing, and error messages.

## How it is built

- React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, IBM Plex fonts.
- **The maths** lives in `src/core` as plain functions with no React. Random numbers come from a seeded generator, so the same seed always gives the same experiment.
- **The lab state** lives in `LabStore` (`src/lab/store.ts`), a class outside React. Components subscribe to it with `useSyncExternalStore`.
- **Saved data** is checked by `validateSnapshot` (`src/lab/snapshot.ts`) before it is used. A bad or damaged save is refused and never changes the running lab.
- **The Vault** (`src/vault/vault.ts`) uses one IndexedDB database named `neuron-vault`. Experiments and projects get random 96-bit ids, and the 20-item limit is enforced inside the database transaction.

```
src/
  core/      neural-network maths, activations, datasets, random numbers
  lab/       LabStore, snapshot checking, coach messages, React hook
  academy/   lesson content
  create/    project templates and the preview sandbox
  vault/     IndexedDB storage
  components/ pages/   the interface
  modules.ts the list of modules and their status
```

## Known limits

- The AI module is not built. There is no language model in this version.
- Saved data lives only in one browser on one computer. "Clear site data" in the browser deletes it, and it does not move between browsers or computers.
- The Vault holds at most 20 experiments and 20 projects. A saved experiment must stay within the lab's own limits (up to 2 hidden layers, width up to 12).
- Two browser tabs on the same Vault can overwrite each other's lesson progress and settings (the last one saved wins).
- Only Chrome has been used to check the interface.