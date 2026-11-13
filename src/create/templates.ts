import type { Files } from './sandbox'

/** The project being edited. Kept in App so it survives switching modules. */
export interface Draft extends Files {
  name: string
}

export interface Template {
  id: string
  label: string
  note: string
  name: string
  files: Files
}

export const TEMPLATES: Template[] = [
  {
    id: 'hello',
    label: 'Hello page',
    note: 'A heading and a button',
    name: 'Hello page',
    files: {
      html: `<h1 id="title">Hello, NEURON!</h1>\n<button id="go">Click me</button>`,
      css: `body {\n  font-family: system-ui, sans-serif;\n  text-align: center;\n  padding: 3rem 1rem;\n  background: #0a1f3c;\n  color: #e6f0ff;\n}\nbutton {\n  font-size: 1rem;\n  padding: 0.6rem 1.2rem;\n  border: 0;\n  border-radius: 6px;\n  background: #ffc857;\n  cursor: pointer;\n}`,
      js: `const title = document.getElementById('title')\ndocument.getElementById('go').addEventListener('click', () => {\n  title.textContent = 'You clicked the button!'\n  console.log('button clicked')\n})`,
    },
  },
  {
    id: 'counter',
    label: 'Counter',
    note: 'Plus and minus buttons',
    name: 'Counter',
    files: {
      html: `<p>Count: <strong id="n">0</strong></p>\n<button id="minus">−1</button>\n<button id="plus">+1</button>`,
      css: `body {\n  font-family: system-ui, sans-serif;\n  text-align: center;\n  padding: 3rem 1rem;\n  background: #0e2a4f;\n  color: #e6f0ff;\n  font-size: 1.5rem;\n}\nbutton {\n  font-size: 1.2rem;\n  width: 4rem;\n  padding: 0.5rem;\n  border: 1px solid #4f7db5;\n  border-radius: 6px;\n  background: #0a1f3c;\n  color: inherit;\n  cursor: pointer;\n}`,
      js: `let count = 0\nconst show = document.getElementById('n')\nfunction change(by) {\n  count += by\n  show.textContent = count\n}\ndocument.getElementById('plus').addEventListener('click', () => change(1))\ndocument.getElementById('minus').addEventListener('click', () => change(-1))`,
    },
  },
  {
    id: 'ball',
    label: 'Bouncing ball',
    note: 'A small animation',
    name: 'Bouncing ball',
    files: {
      html: `<canvas id="c" width="360" height="220"></canvas>`,
      css: `body {\n  margin: 0;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n  background: #0a1f3c;\n}\ncanvas {\n  background: #0e2a4f;\n  border: 1px solid #4f7db5;\n  border-radius: 6px;\n}`,
      js: `const canvas = document.getElementById('c')\nconst ctx = canvas.getContext('2d')\nlet x = 60, y = 50, vx = 2.4, vy = 1.8\nconst r = 14\n\nfunction frame() {\n  x += vx\n  y += vy\n  if (x < r || x > canvas.width - r) vx = -vx\n  if (y < r || y > canvas.height - r) vy = -vy\n  ctx.clearRect(0, 0, canvas.width, canvas.height)\n  ctx.fillStyle = '#ffc857'\n  ctx.beginPath()\n  ctx.arc(x, y, r, 0, Math.PI * 2)\n  ctx.fill()\n  requestAnimationFrame(frame)\n}\nframe()`,
    },
  },
  {
    id: 'neuron',
    label: 'Tiny neuron',
    note: 'One neuron with sliders',
    name: 'Tiny neuron',
    files: {
      html: `<h2>One neuron</h2>\n<label>clue 1 × weight <input id="w1" type="range" min="-3" max="3" step="0.1" value="1.5"></label>\n<label>clue 2 × weight <input id="w2" type="range" min="-3" max="3" step="0.1" value="2"></label>\n<label>bias <input id="b" type="range" min="-3" max="3" step="0.1" value="-1"></label>\n<p>clues: 0.8 and 0.3</p>\n<p>z = <span id="z"></span></p>\n<p>answer = sigmoid(z) = <strong id="out"></strong></p>`,
      css: `body {\n  font-family: system-ui, sans-serif;\n  padding: 1.5rem;\n  background: #0a1f3c;\n  color: #e6f0ff;\n}\nlabel {\n  display: block;\n  margin: 0.6rem 0;\n}\ninput {\n  width: 55%;\n  vertical-align: middle;\n}\nstrong {\n  color: #ffc857;\n}`,
      js: `const ids = ['w1', 'w2', 'b']\nconst [w1, w2, b] = ids.map((id) => document.getElementById(id))\n\nfunction update() {\n  const z = 0.8 * Number(w1.value) + 0.3 * Number(w2.value) + Number(b.value)\n  const answer = 1 / (1 + Math.exp(-z))\n  document.getElementById('z').textContent = z.toFixed(2)\n  document.getElementById('out').textContent = answer.toFixed(3)\n}\nids.forEach((id) => document.getElementById(id).addEventListener('input', update))\nupdate()`,
    },
  },
]