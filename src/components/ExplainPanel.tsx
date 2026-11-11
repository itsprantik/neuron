import { ACTIVATIONS } from '../core/activations'
import type { ActivationName } from '../core/activations'
import { Panel } from './Panel'

const summary = 'cursor-pointer py-2 font-medium marker:text-hi hover:text-hi'

export function ExplainPanel() {
  return (
    <Panel code="01.F" title="How it works">
      <div className="divide-y divide-line">
        <details>
          <summary className={summary}>1. What does one neuron do?</summary>
          <div className="space-y-2 pb-3 text-muted">
            <p>
              A neuron takes numbers in, multiplies each by a <span className="text-ink">weight</span> (how
              much that input matters), adds them up, and adds a <span className="text-ink">bias</span> (a
              built-in nudge).
            </p>
            <p className="font-mono text-ink">z = w₁·a₁ + w₂·a₂ + … + b</p>
            <p>
              Then the result goes through an <span className="text-ink">activation function</span> to make the
              neuron's output: <span className="font-mono text-ink">a = f(z)</span>. Select a neuron to see
              this with real numbers.
            </p>
          </div>
        </details>

        <details>
          <summary className={summary}>2. Why do we need activation functions?</summary>
          <div className="space-y-2 pb-3 text-muted">
            <p>
              Without them, stacking layers would be pointless: a chain of weighted sums is still just one
              weighted sum, which can only draw straight lines. The bend in the activation function lets
              layers combine into curves.
            </p>
            <ul className="space-y-1 font-mono text-xs">
              {(Object.keys(ACTIVATIONS) as ActivationName[]).map((id) => (
                <li key={id}>
                  <span className="text-ink">{ACTIVATIONS[id].label}</span> : {ACTIVATIONS[id].formula} →{' '}
                  {ACTIVATIONS[id].range}
                </li>
              ))}
            </ul>
          </div>
        </details>

        <details>
          <summary className={summary}>3. How does the network learn?</summary>
          <div className="space-y-2 pb-3 text-muted">
            <p>
              <span className="text-ink">Loss</span> is one number for how wrong the network is on all the
              points (here: cross-entropy). Learning means making it smaller.
            </p>
            <p>
              <span className="text-ink">Backpropagation</span> works backwards from the output and uses the
              chain rule to find, for every weight and bias, which direction would reduce the loss. That
              direction is the <span className="text-ink">gradient</span>.
            </p>
            <p>
              <span className="text-ink">Gradient descent</span> then nudges every weight a small step the
              other way. The <span className="text-ink">learning rate</span> is the step size: too small is
              slow, too large can overshoot. One pass over all the points is one{' '}
              <span className="text-ink">epoch</span>.
            </p>
          </div>
        </details>

        <details>
          <summary className={summary}>4. Try this: why XOR needs a hidden layer</summary>
          <div className="space-y-2 pb-3 text-muted">
            <p>
              Set hidden layers to <span className="font-mono text-ink">0</span>. Now the output neuron is the
              only neuron, so the decision boundary can only be a straight line. Pick AND and train: it works.
              Pick XOR or Circle and train: it gets stuck, because no single line separates those classes.
            </p>
            <p>
              Now set hidden layers to <span className="font-mono text-ink">1</span> and train XOR again. The
              hidden neurons each draw a line, and the output combines them.
            </p>
          </div>
        </details>

        <details>
          <summary className={summary}>5. What this demo is, and what it is not</summary>
          <div className="space-y-2 pb-3 text-muted">
            <p>
              This is a deliberately tiny, simplified network: 2 inputs, a few neurons, trained on 40–60 points
              with plain gradient descent. It is a real neural network and the maths is exact, but real systems
              are enormously bigger and use many extra techniques.
            </p>
            <p>
              The language model planned for NEURON AI is a completely separate network. It is not the network
              you see here.
            </p>
          </div>
        </details>
      </div>
    </Panel>
  )
}
