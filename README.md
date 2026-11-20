# NEURON

**Learn how neural networks work. Experiment with AI. Build small projects.**

NEURON is a small learning app I built to make AI and neural networks easier to understand. Instead of only reading about how they work, you can experiment with them yourself.

It also includes an offline AI tutor powered by Qwen3 and llama.cpp, so you can ask questions without using a cloud AI API.

## What can you do with NEURON?

| Section | What you'll find |
|---|---|
| **CORE** | Experiment with neural networks, change their settings, train them and see what happens. |
| **AI** | Chat with a locally running Qwen3 model and ask questions about AI, programming and maths. |
| **CREATE** | Write HTML, CSS and JavaScript and see your project in a live preview. |
| **ACADEMY** | Learn AI concepts through short lessons and questions. |
| **VAULT** | Keep your saved experiments, projects and learning progress. |

## What you need

Before starting, make sure you have:

- Windows 10 or Windows 11 (the instructions below are for Windows).
- [Node.js 22.12 or newer](https://nodejs.org/).
- [Git](https://git-scm.com/downloads) (optional, but useful for downloading the project).
- A modern browser such as Chrome or Edge.
- Internet access for the initial setup and downloads.

For the local AI tutor, you also need:

- llama.cpp for Windows x64.
- The Qwen3 0.6B Q8_0 GGUF model.

**A note about hardware:** NEURON itself is lightweight. Running the AI model requires additional memory. Performance depends on your computer.

---

## 1. Download NEURON

You can download the project in either of these ways.

**Option A — Download from GitHub**

1. Open the [NEURON repository](https://github.com/itsprantik/neuron).
2. Click the green **Code** button.
3. Select **Download ZIP**.
4. Extract the downloaded folder somewhere convenient.
5. Open the extracted `neuron` folder.

**Option B — Use Git**

Open a terminal and run:

```bash
git clone https://github.com/itsprantik/neuron.git
cd neuron
```

## 2. Install the project

Open the NEURON folder in VS Code.

Open the terminal using:

`Terminal → New Terminal`

Run:

```bash
npm install
```

Wait for the installation to finish.

This downloads the packages NEURON needs to run.

## 3. Start NEURON

In the same terminal, run:

```bash
npm run dev
```

You should see a local address in the terminal.

Open:

**http://localhost:3000**

NEURON should now be running in your browser.

Keep the terminal open while using the development version.

---

## 4. Set up the offline AI tutor

The AI tutor needs two things: llama.cpp (the program that runs the model) and a GGUF model file.

You only need to do this setup once.

### Step 4.1 — Download llama.cpp

1. Open the [llama.cpp GitHub releases](https://github.com/ggml-org/llama.cpp/releases).
2. Find a Windows x64 CPU build.
3. Download the appropriate archive.
4. Extract it.

Make sure you have `llama-server.exe` and its required DLL files.

### Step 4.2 — Download the Qwen3 model

1. Open the [Qwen3 0.6B GGUF model page](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF).
2. Find the file named `Qwen3-0.6B-Q8_0.gguf`.
3. Download it.

The model file is separate from the NEURON source code, so it is not included in the GitHub repository.

### Step 4.3 — Arrange the files

Your NEURON folder should look like this:

```text
neuron/
│
├── ai/
│   ├── llama-server.exe
│   ├── required llama.cpp DLL files
│   │
│   ├── models/
│   │   └── Qwen3-0.6B-Q8_0.gguf
│   │
│   └── start-ai.bat
│
├── src/
├── public/
├── package.json
├── index.html
└── ...
```

**Important:**

- Keep `llama-server.exe` and its required DLL files inside `ai/`.
- Put the `.gguf` model inside `ai/models/`.
- Do not rename `start-ai.bat`.
- Do not put the model directly inside `ai/`; it belongs in `ai/models/`.

### Step 4.4 — Start the AI server

Double-click:

`ai/start-ai.bat`

A terminal window should open and start the local model.

Wait until the server finishes loading.

Keep this window open while using the AI tutor.

The server runs locally at:

`http://127.0.0.1:8080`

You can open that address in your browser to access llama.cpp's own interface.

### Step 4.5 — Open NEURON AI

1. Make sure NEURON is running at `http://localhost:3000`.
2. Open the **AI** section from the navigation menu.
3. Wait for the server status check.
4. When it shows **LOCAL SERVER ONLINE**, you can start chatting.

Try asking:

- What is a neural network?
- Explain backpropagation.
- What are activation functions?
- How does Qwen3 work?

That's it. Your AI tutor is running on your own computer.

---

## 5. How to use the other sections

### CORE

This is where you can experiment with neural networks.

You can explore how a neuron works, choose datasets, change activation functions, adjust learning rates and train networks.

Try changing one setting at a time and see how the results change.

### CREATE

Create small web projects using HTML, CSS and JavaScript.

You can edit your code and check the result in the live preview. There are also starter templates to help you get going.

### ACADEMY

Go through the lessons to understand the basics of artificial intelligence, machine learning and neural networks.

You can also check your understanding with the lesson questions.

### VAULT

Your saved experiments, projects and learning progress are kept here.

Your saved data is stored locally in your browser using IndexedDB.

**Keep in mind:** Clearing your browser's site data can delete your saved NEURON data. It does not automatically sync between different browsers or computers.

---

## 6. Useful commands

Open the project terminal and use these commands:

| Command | Purpose |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start NEURON |
| `npm run build` | Check TypeScript and create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Check the code for lint issues |
| `npm test` | Run the tests |
| `npm run test:watch` | Run tests again when files change |

To create a production build:

```bash
npm run build
```

The finished files will be placed inside the `dist/` folder.

---

## 7. Common problems

### NEURON doesn't start

Check that Node.js is installed:

```bash
node -v
npm -v
```

If the commands aren't recognised, install Node.js and restart your terminal.

Then run:

```bash
npm install
npm run dev
```

### The AI server says it's offline

Check the following:

1. Is `start-ai.bat` running?
2. Is `llama-server.exe` inside the `ai` folder?
3. Is the model inside `ai/models/`?
4. Did the model finish loading?
5. Is another program already using port `8080`?

You can also open `http://127.0.0.1:8080/health` to check the server.

### The browser shows a connection or CORS error

Make sure you're opening NEURON through:

`http://localhost:3000`

The AI tutor is configured to work with a local frontend. Check the llama.cpp server output and browser console if the connection still fails.

### The AI model is slow

The model runs on your computer, so its speed depends on your CPU, available memory and llama.cpp settings.

Close unnecessary applications if your computer is running low on memory.

### My saved projects disappeared

NEURON stores its data in the browser. If you cleared site data, switched browsers or opened the app under a different browser address, your previous saves might not be available.

---

## 8. Privacy and offline use

NEURON is designed to work locally.

- The AI tutor communicates with your local llama.cpp server.
- No cloud AI API key is required.
- Your Vault data stays in your browser's local storage.
- The CREATE preview uses a sandboxed environment.
- The initial installation requires internet access to download dependencies and model files.

Once everything is installed, the main learning features and local AI tutor can be used without an internet connection.

---

## 9. Project structure

A quick look at the important folders:

```text
src/
│
├── core/         Neural network calculations and datasets
├── lab/          Experiment state and lab logic
├── academy/      Lesson content
├── create/       Project templates and preview sandbox
├── vault/        Local saving and data management
│
├── ai/           AI client connection
├── components/   Reusable interface components
├── pages/        Main application pages
│
├── App.tsx       Main application
└── modules.ts    Navigation and module information

ai/
├── start-ai.bat  Local AI launcher
├── models/       Local GGUF model files
└── llama-server  llama.cpp runtime files
```

The model and llama.cpp binaries are kept out of GitHub so the repository doesn't become unnecessarily large.

---

## Built with

- React
- TypeScript
- Vite
- Tailwind CSS
- llama.cpp
- Qwen3 0.6B

## Project

**GitHub:** https://github.com/itsprantik/neuron

Built by [@itsprantik](https://github.com/itsprantik).

If you find a problem, feel free to open an issue on GitHub.

---

*NEURON — Learn it. Experiment with it. Understand it.*