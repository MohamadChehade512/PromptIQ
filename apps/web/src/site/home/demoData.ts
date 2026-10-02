/**
 * The homepage example. These numbers were produced by running the real Prompt IQ engine
 * (packages/core analyzePrompt: Claude Sonnet 5, writing, API prices as of the models config)
 * on the two prompts below, then fixed here, so the public pages never ship the engine itself.
 * Re-run and update them if the engine or prices change materially.
 *
 * Scoring areas are shown as percentages only; the points behind them stay private.
 */
export const VAGUE = {
  text: 'Hi! Could you please help me out and write something about our new app for social media? It would be really great if you could make it good and engaging and interesting so people like it. Thanks so much in advance, I really appreciate it!',
  /** Words the engine flags (its evidence), highlighted wherever they appear. */
  marks: [
    { phrase: 'Hi', kind: 'filler' },
    { phrase: 'Could you please', kind: 'filler' },
    { phrase: 'really', kind: 'filler' },
    { phrase: 'Thanks', kind: 'filler' },
    { phrase: 'something', kind: 'vague' },
    { phrase: 'good', kind: 'vague' },
  ],
  score: 28,
  band: 'Weak',
  promptTokens: 57,
  answerTokens: 800,
  thinkingTokens: 960,
  costPerCall: 0.0177,
  areas: { clarity: 70, context: 0, output: 15, structure: 45, examples: 32, economy: 9, fit: 45 },
  fixes: [
    { title: 'Cut filler and politeness', points: 10, saves: true },
    { title: 'Say what it’s for', points: 8, saves: false },
    { title: 'Name the format', points: 8, saves: false },
    { title: 'Set a length limit', points: 7, saves: true },
  ],
} as const;

export const TIGHT = {
  text: 'Write a LinkedIn post announcing Tally, our expense-tracking app for freelancers, launching June 3. It’s for our launch-week campaign to get early sign-ups. Audience: freelance designers and developers. Highlight automatic receipt scanning and the free tier. Tone: friendly and plain, no hype. Keep it under 120 words and end with [LINK].',
  score: 95,
  band: 'Excellent',
  promptTokens: 85,
  answerTokens: 162,
  thinkingTokens: 194,
  costPerCall: 0.0037,
  areas: {
    clarity: 100,
    context: 100,
    output: 100,
    structure: 100,
    examples: 40,
    economy: 100,
    fit: 100,
  },
  /** The same prompt as each platform counts it (ChatGPT exact; Claude and Gemini estimates). */
  platformTokens: { claude: 85, chatgpt: 71, gemini: 77 },
} as const;

export const AREA_LABELS = {
  clarity: 'Task clarity',
  context: 'Context & intent',
  output: 'Output spec',
  structure: 'Structure',
  examples: 'Examples',
  economy: 'Token economy',
  fit: 'Platform fit',
} as const;
export type Area = keyof typeof AREA_LABELS;

/**
 * Getting it right the first time: the vague prompt needs two follow-ups (illustrative), and
 * every follow-up resends the whole conversation so far. Tokens per attempt = input + answer +
 * thinking.
 */
export const RETRY = {
  vagueAttempts: [1817, 2640, 3463],
  vagueTotal: 7920,
  vagueCost: 0.058,
  tightTotal: 441,
  tightCost: 0.0037,
} as const;

/** The first words of the tight prompt as ChatGPT's tokenizer (o200k_base) splits them. */
export const TOKEN_PIECES = [
  'Write',
  ' a',
  ' Linked',
  'In',
  ' post',
  ' announcing',
  ' T',
  'ally',
  ',',
  ' our',
  ' expense',
  '-tr',
  'acking',
  ' app',
  ' for',
  ' freelancers',
  ',',
  ' launching',
  ' June',
  ' ',
  '3',
  '.',
];

export const usd = (digits: number) => (n: number) => `$${n.toFixed(digits)}`;
