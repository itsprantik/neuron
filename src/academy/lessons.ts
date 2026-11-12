export interface Question {
  q: string
  options: string[]
  /** Index of the correct option. */
  answer: number
  why: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  body: string[]
  formula?: string
  /** Button that jumps into the matching part of the Core module. */
  tryIt?: { label: string; tab: 'learn' | 'lab' }
  check: Question[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'ai-basics',
    title: 'What is AI?',
    summary: 'Computers doing tasks that normally need human intelligence.',
    body: [
      'Artificial intelligence (AI) is the field of making computers do tasks that normally need human intelligence: recognising pictures, understanding speech, translating languages, playing games and answering questions.',
      'Most AI today is narrow. It is built for one kind of job and does not become good at other jobs by itself. A system that recognises faces cannot write a poem.',
      'AI is a broad field. Machine learning is one way of building AI, and neural networks are one kind of machine learning. NEURON focuses on neural networks.',
    ],
    check: [
      {
        q: 'Which statement is true?',
        options: [
          'Machine learning is one way of building AI',
          'AI and machine learning mean exactly the same thing',
          'Neural networks are bigger than the whole field of AI',
        ],
        answer: 0,
        why: 'AI is the broad field. Machine learning is one approach inside it, and neural networks are one kind of machine learning.',
      },
      {
        q: 'A system that only recognises faces is an example of…',
        options: ['Narrow AI', 'A system that can do any task', 'A human-level mind'],
        answer: 0,
        why: 'It is built for one job. Today’s AI is almost always narrow in this sense.',
      },
    ],
  },
  {
    id: 'machine-learning',
    title: 'What is machine learning?',
    summary: 'Learning rules from examples instead of writing them by hand.',
    body: [
      'Normally a programmer writes the rules: if this, then that. For some problems the rules are too hard to write. Nobody can list every rule for what a cat looks like.',
      'Machine learning flips this around. You give the computer many examples, and it finds the rules itself. In supervised learning, each example comes with the right answer, called a label.',
      'After training, you check the model on examples it has never seen. This shows whether it really learned the pattern, or only memorised the training examples.',
    ],
    tryIt: { label: 'Open the Network lab', tab: 'lab' },
    check: [
      {
        q: 'In supervised learning, what is a label?',
        options: ['The correct answer for an example', 'The name of the programmer', 'The speed of the computer'],
        answer: 0,
        why: 'A label is the right answer attached to a training example, so the model can compare its guess with it.',
      },
      {
        q: 'Why test a model on examples it has never seen?',
        options: [
          'To check it learned the pattern and did not just memorise',
          'To make training faster',
          'To make the model bigger',
        ],
        answer: 0,
        why: 'A model that only memorised its training examples fails on new ones. Unseen examples reveal that.',
      },
    ],
  },
  {
    id: 'neural-networks',
    title: 'What is a neural network?',
    summary: 'Many simple neurons wired together in layers.',
    body: [
      'A neuron takes numbers in, weighs each one, adds them up, and gives one number out. A neural network wires many neurons together in layers.',
      'The input layer holds the raw data. Hidden layers sit in the middle and combine information. The output layer gives the answer. Each neuron’s output becomes an input for neurons in the next layer.',
      'The weights and biases are the network’s knowledge. Training means finding good values for them.',
    ],
    tryIt: { label: 'Meet a neuron', tab: 'learn' },
    check: [
      {
        q: 'Where does a neural network store what it has learned?',
        options: ['In its weights and biases', 'In the names of its layers', 'In the input data'],
        answer: 0,
        why: 'The weights and biases are the numbers training adjusts. Together they are what the network has learned.',
      },
      {
        q: 'Which layer gives the final answer?',
        options: ['The output layer', 'The input layer', 'Any hidden layer'],
        answer: 0,
        why: 'The input layer holds the data, hidden layers process it, and the output layer gives the answer.',
      },
    ],
  },
  {
    id: 'activation-functions',
    title: 'Activation functions',
    summary: 'The bend that makes layers useful.',
    formula: 'ReLU: max(0, z)    Sigmoid: 1 / (1 + e^−z)    Tanh: (e^z − e^−z) / (e^z + e^−z)',
    body: [
      'After a neuron adds up its weighted inputs (the number z), an activation function turns z into the neuron’s output.',
      'ReLU gives 0 for negative z and z itself for positive z. Sigmoid squashes any number into the range 0 to 1, which suits probabilities. Tanh squashes any number into the range −1 to 1.',
      'Without activation functions, a stack of layers would still be just one weighted sum, and could only draw straight lines. The bend lets a network learn curved patterns such as XOR.',
    ],
    tryIt: { label: 'Try different activations', tab: 'lab' },
    check: [
      {
        q: 'What does ReLU give for z = −2?',
        options: ['0', '−2', '1'],
        answer: 0,
        why: 'ReLU is max(0, z), and the larger of 0 and −2 is 0.',
      },
      {
        q: 'What output range does sigmoid have?',
        options: ['0 to 1', '−1 to 1', '0 to infinity'],
        answer: 0,
        why: 'Sigmoid squashes every input into the range 0 to 1.',
      },
      {
        q: 'Why do networks need activation functions?',
        options: [
          'Without them, layers could only make straight-line patterns',
          'To make the network smaller',
          'To store the training data',
        ],
        answer: 0,
        why: 'Without a bend between layers, many layers collapse into one weighted sum, which can only separate things with a straight line.',
      },
    ],
  },
  {
    id: 'forward-propagation',
    title: 'Forward propagation',
    summary: 'Calculating the answer, layer by layer.',
    formula: 'z = w₁·a₁ + w₂·a₂ + … + b        a = f(z)',
    body: [
      'Forward propagation is how a network produces an answer. Start with the inputs. For each neuron in the first hidden layer, compute z, then apply the activation function to get a.',
      'Those outputs become the inputs of the next layer, and so on until the output layer. Data only moves forward, from input to output.',
      'In the Network lab, the number inside each circle is that neuron’s a for the probe point. Click a neuron to see its z calculation with real numbers.',
    ],
    tryIt: { label: 'Open the Network lab', tab: 'lab' },
    check: [
      {
        q: 'In z = w₁·a₁ + w₂·a₂ + b, what is b?',
        options: ['The bias', 'The output', 'The first weight'],
        answer: 0,
        why: 'b is the bias, a built-in nudge added after the weighted sum.',
      },
      {
        q: 'A neuron has weights 2 and −1, inputs 3 and 4, and bias 1. What is z?',
        options: ['2', '3', '11'],
        answer: 1,
        why: '2×3 + (−1)×4 + 1 = 6 − 4 + 1 = 3.',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training',
    summary: 'Making the loss smaller, one small step at a time.',
    body: [
      'Loss is one number that says how wrong the network is on the training examples. Lower is better.',
      'Backpropagation works backwards from the output and finds, for every weight and bias, which direction would lower the loss. That direction is the gradient. Gradient descent then moves every weight a small step the opposite way.',
      'The learning rate is the size of each step. Too small and training is slow. Too large and it can overshoot and bounce around. One pass over all the examples is called an epoch.',
    ],
    tryIt: { label: 'Train a network', tab: 'lab' },
    check: [
      {
        q: 'What does a lower loss mean?',
        options: ['The network is less wrong', 'The network is bigger', 'The learning rate is lower'],
        answer: 0,
        why: 'Loss measures how wrong the network is, so a lower loss means better answers on the training examples.',
      },
      {
        q: 'What can happen if the learning rate is too large?',
        options: [
          'Training can overshoot and become unstable',
          'Training always becomes perfect',
          'The data disappears',
        ],
        answer: 0,
        why: 'Big steps can jump past a good solution, so the loss may bounce around or grow instead of falling.',
      },
      {
        q: 'What is an epoch?',
        options: ['One pass over all the training examples', 'One neuron', 'One layer'],
        answer: 0,
        why: 'An epoch is one full pass over the training data. NEURON does one gradient step per epoch.',
      },
    ],
  },
  {
    id: 'llm',
    title: 'Language models (LLMs)',
    summary: 'A very large network that predicts the next piece of text.',
    body: [
      'A large language model (LLM) is a neural network trained on huge amounts of text. Its core job is simple: given the text so far, predict what comes next.',
      'Text is split into small pieces called tokens (whole words, parts of words or symbols). The model predicts one token, adds it to the text, then predicts again. This is how it writes whole answers. The context window is how much text it can look at at one time, and more context needs more memory.',
      'A model’s size is counted in parameters, which are its weights. A “0.5B” model has about 500 million parameters. That is far smaller than the largest models, so it can run on a laptop, but it is also less capable.',
      'The tutor planned for NEURON AI is a language model. It is a completely separate network from the small one in the Network lab.',
    ],
    check: [
      {
        q: 'What is the basic job of an LLM?',
        options: ['Predict the next token', 'Search the internet', 'Store a list of facts'],
        answer: 0,
        why: 'An LLM predicts the next token from the text so far, over and over, to build an answer.',
      },
      {
        q: 'What does “0.5B” in a model name mean?',
        options: ['About 500 million parameters', 'A version number', 'It answers in 0.5 seconds'],
        answer: 0,
        why: 'B stands for billion. 0.5B is about half a billion parameters (weights).',
      },
    ],
  },
  {
    id: 'quantization',
    title: 'Quantization',
    summary: 'Shrinking a model by storing its numbers with fewer bits.',
    formula: 'file size ≈ parameters × bits per weight ÷ 8',
    body: [
      'A model’s weights are numbers. Quantization stores each number with fewer bits, for example 4 bits instead of 16. This makes the model file and its memory use much smaller.',
      'The price is a small loss of precision, so answers can get slightly worse. Moderate quantization usually costs little quality, and very aggressive quantization costs more.',
      'A model with 1 billion weights at 8 bits per weight takes about 1 billion bytes, roughly 1 GB. At 4 bits it takes about half that. Real files are a bit larger because of extra data. Models for llama.cpp are stored in the GGUF file format, which often holds quantized weights.',
    ],
    check: [
      {
        q: 'What does quantization do?',
        options: [
          'Stores weights with fewer bits to shrink the model',
          'Adds more layers to the model',
          'Gives the model more training data',
        ],
        answer: 0,
        why: 'Quantization keeps the same weights but stores each one more compactly, trading a little precision for a smaller model.',
      },
      {
        q: 'About how big are 2 billion weights stored at 4 bits each?',
        options: ['About 1 GB', 'About 8 GB', 'About 250 MB'],
        answer: 0,
        why: '2 billion × 4 ÷ 8 = 1 billion bytes, about 1 GB, before extra overhead.',
      },
    ],
  },
  {
    id: 'local-inference',
    title: 'Local inference',
    summary: 'Using a trained model on your own computer.',
    body: [
      'Training builds a model. Inference means using a trained model to produce answers. “Local” means it runs on your own computer, with no internet connection and no data sent away.',
      'llama.cpp is a program that runs models stored as GGUF files on an ordinary CPU. Speed depends on the model size, how much it is quantized, the CPU and the memory.',
      'RAM is the limit that matters most. The whole model must fit in memory, with extra room for the context. A model whose file fits on the disk may still be too big to run smoothly. That is why NEURON starts with a small model and measures before trying a bigger one.',
    ],
    check: [
      {
        q: 'What is inference?',
        options: ['Using a trained model to produce answers', 'Teaching a model new data', 'Compressing a model'],
        answer: 0,
        why: 'Training builds the model. Inference is using it afterwards.',
      },
      {
        q: 'Why might a model fit on your disk but still run badly?',
        options: [
          'It also needs enough free RAM to run',
          'Disk files are always too small',
          'Models only run in the cloud',
        ],
        answer: 0,
        why: 'The model must be loaded into RAM, with room left for the context. Too little RAM makes it slow or unstable.',
      },
    ],
  },
  {
    id: 'ai-limits',
    title: 'What AI cannot do',
    summary: 'Be a careful user of AI answers.',
    body: [
      'A language model produces text that sounds likely, not text that has been checked. It can state wrong things in a confident voice. This is often called hallucination.',
      'Models learn from their training data, so they can repeat its mistakes and biases. They also know nothing about events after their training, unless a tool gives them that information.',
      'Smaller models are usually less accurate than larger ones. For anything important, such as health, money or facts for schoolwork, check the answer against a trustworthy source.',
    ],
    check: [
      {
        q: 'Why can a language model say wrong things confidently?',
        options: [
          'It produces likely-sounding text and does not automatically check facts',
          'It always copies from the internet',
          'It is designed to lie',
        ],
        answer: 0,
        why: 'It predicts plausible text. Nothing in that process checks whether the text is true.',
      },
      {
        q: 'What should you do with an important AI answer?',
        options: ['Check it against a trustworthy source', 'Trust it because it sounds sure', 'Never use AI at all'],
        answer: 0,
        why: 'AI can be a useful helper, but important facts should be verified.',
      },
    ],
  },
]