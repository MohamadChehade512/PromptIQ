import type { LabeledPrompt } from './prompts';

/**
 * Extended calibration set (2026-09-30): 20 coding, 20 writing and 20 Q&A prompts, labeled
 * with the rubric in prompts.ts **before** they were scored, and never relabeled after.
 *
 *  - weak:   no clear task, or a task missing the topic/material it needs, or so vague any
 *            answer fits; filler or shouting instead of specifics
 *  - ok:     clear task and topic, but missing at least one of purpose/context, output
 *            shape, or length/scope
 *  - strong: clear task, the context that matters, constraints or criteria, and a bounded
 *            output where one applies
 *
 * About a third are `holdout`: excluded from tuning, and only scored to measure whether rule
 * changes generalize (two per use case and label).
 */
export const EXTENDED_SET: LabeledPrompt[] = [
  // ================= Coding =================
  {
    id: 'xc-weak-1',
    label: 'weak',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'make me an app',
  },
  {
    id: 'xc-weak-2',
    label: 'weak',
    platform: 'openai',
    useCase: 'coding',
    prompt: 'my code doesnt work',
    split: 'holdout',
  },
  { id: 'xc-weak-3', label: 'weak', platform: 'gemini', useCase: 'coding', prompt: 'fix this' },
  {
    id: 'xc-weak-4',
    label: 'weak',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      'Can you please please help me write some Python? I really need it done ASAP!!! Thanks so much, you are the best!',
  },
  {
    id: 'xc-weak-5',
    label: 'weak',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'write a function',
    split: 'holdout',
  },
  {
    id: 'xc-weak-6',
    label: 'weak',
    platform: 'gemini',
    useCase: 'coding',
    prompt: 'why is my react app slow',
  },
  {
    id: 'xc-weak-7',
    label: 'weak',
    platform: 'claude',
    useCase: 'coding',
    prompt:
      'I need a website for my business with everything, like a really good one, make it look nice and modern and stuff',
  },
  {
    id: 'xc-ok-1',
    label: 'ok',
    platform: 'openai',
    useCase: 'coding',
    prompt: 'Write a Python function that checks if a string is a palindrome.',
  },
  {
    id: 'xc-ok-2',
    label: 'ok',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'How do I center a div in CSS?',
    split: 'holdout',
  },
  {
    id: 'xc-ok-3',
    label: 'ok',
    platform: 'gemini',
    useCase: 'coding',
    prompt:
      'Convert this JavaScript to TypeScript:\n```js\nfunction add(a, b) { return a + b }\nconst total = [1, 2, 3].reduce(add, 0)\n```',
  },
  {
    id: 'xc-ok-4',
    label: 'ok',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      'Write a SQL query that returns the top 5 customers by total order amount from the orders table.',
  },
  {
    id: 'xc-ok-5',
    label: 'ok',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'Explain the difference between let, const and var in JavaScript with examples.',
    split: 'holdout',
  },
  {
    id: 'xc-ok-6',
    label: 'ok',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      'My Flask app throws "TypeError: Object of type datetime is not JSON serializable" when I return a dict with a created_at field. How do I fix it?',
  },
  {
    id: 'xc-ok-7',
    label: 'ok',
    platform: 'gemini',
    useCase: 'coding',
    prompt:
      'Refactor this code to be cleaner:\n```python\ndef f(l):\n  r=[]\n  for i in range(len(l)):\n    if l[i]%2==0:\n      r.append(l[i]*2)\n  return r\n```',
  },
  {
    id: 'xc-strong-1',
    label: 'strong',
    platform: 'claude',
    useCase: 'coding',
    prompt:
      'Write a TypeScript function `slugify(title: string): string` for our Next.js 15 blog. Lowercase, replace spaces and punctuation with single hyphens, strip accents (é → e), trim leading/trailing hyphens, and cap at 60 characters without cutting a word. Return only the function plus 5 Vitest test cases, no explanation.',
  },
  {
    id: 'xc-strong-2',
    label: 'strong',
    platform: 'claude',
    useCase: 'coding',
    prompt: `<context>
Python 3.12, pandas 2.2. I load a 2 GB CSV of sensor readings (timestamp, sensor_id, value) and the job runs out of memory on a 4 GB container.
</context>

<code>
df = pd.read_csv("readings.csv")
daily = df.groupby([df.timestamp.str[:10], "sensor_id"]).value.mean()
</code>

Rewrite this to stay under 1 GB of memory. Keep the output identical (daily mean per sensor). Explain the change in 3 bullet points.`,
    split: 'holdout',
  },
  {
    id: 'xc-strong-3',
    label: 'strong',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      "In PostgreSQL 16, write a query for our e-commerce dashboard that returns each customer's total spend in the last 90 days from orders(id, customer_id, total_cents, created_at) and customers(id, email). Include customers with zero orders, sort by spend descending, and return email and spend in dollars with 2 decimals. Only the SQL, no commentary.",
  },
  {
    id: 'xc-strong-4',
    label: 'strong',
    platform: 'gemini',
    useCase: 'coding',
    prompt:
      'Our Go 1.23 HTTP service leaks goroutines under load: pprof shows thousands stuck in `net/http.(*persistConn).readLoop`. We create a new http.Client per request without timeouts. Explain the likely cause in 2–3 sentences, then give a corrected client setup with sensible timeouts and connection reuse. It must work with our existing retry wrapper, which takes a *http.Client.',
  },
  {
    id: 'xc-strong-5',
    label: 'strong',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      'You are reviewing a pull request for a React 19 + TypeScript app used by nurses on tablets. Review the component below for accessibility issues only (keyboard, screen readers, touch targets). List each issue with the line, why it matters, and the fix, as a Markdown table. If you find none, say so.\n\n```tsx\nexport function DoseButton({ onClick }: { onClick: () => void }) {\n  return <div className="btn" onClick={onClick}><img src="/plus.svg" /></div>;\n}\n```',
    split: 'holdout',
  },
  {
    id: 'xc-strong-6',
    label: 'strong',
    platform: 'claude',
    useCase: 'coding',
    prompt:
      'Write a Bash script for our Ubuntu 24.04 backup server that deletes files older than 30 days in /var/backups/db, but never the 7 newest files regardless of age. It must log each deletion to /var/log/prune.log, support a --dry-run flag, and exit non-zero on errors. Comment each section briefly.',
  },

  // ================= Writing =================
  {
    id: 'xw-weak-1',
    label: 'weak',
    platform: 'openai',
    useCase: 'writing',
    prompt: 'write a blog post',
  },
  {
    id: 'xw-weak-2',
    label: 'weak',
    platform: 'gemini',
    useCase: 'writing',
    prompt: 'Write something about my company.',
    split: 'holdout',
  },
  {
    id: 'xw-weak-3',
    label: 'weak',
    platform: 'claude',
    useCase: 'writing',
    prompt: 'can u write me a speech for the wedding',
  },
  {
    id: 'xw-weak-4',
    label: 'weak',
    platform: 'claude',
    useCase: 'writing',
    prompt: 'Write a story.',
  },
  {
    id: 'xw-weak-5',
    label: 'weak',
    platform: 'openai',
    useCase: 'writing',
    prompt: 'I NEED A COVER LETTER NOW!!! MAKE IT PERFECT AND PROFESSIONAL!!!',
    split: 'holdout',
  },
  {
    id: 'xw-weak-6',
    label: 'weak',
    platform: 'gemini',
    useCase: 'writing',
    prompt: 'Please write an email.',
  },
  {
    id: 'xw-weak-7',
    label: 'weak',
    platform: 'openai',
    useCase: 'writing',
    prompt:
      'Write me a really really good and amazing social media post that will go viral and get tons of likes',
  },
  {
    id: 'xw-ok-1',
    label: 'ok',
    platform: 'claude',
    useCase: 'writing',
    prompt: 'Write a blog post about the benefits of remote work.',
  },
  {
    id: 'xw-ok-2',
    label: 'ok',
    platform: 'openai',
    useCase: 'writing',
    prompt: 'Write a thank-you email to my team for finishing the project on time.',
    split: 'holdout',
  },
  {
    id: 'xw-ok-3',
    label: 'ok',
    platform: 'gemini',
    useCase: 'writing',
    prompt: 'Write a short poem about autumn in Montreal.',
  },
  {
    id: 'xw-ok-4',
    label: 'ok',
    platform: 'claude',
    useCase: 'writing',
    prompt: 'Write a product description for a stainless steel water bottle.',
  },
  {
    id: 'xw-ok-5',
    label: 'ok',
    platform: 'openai',
    useCase: 'writing',
    prompt: 'Draft a LinkedIn post announcing that I got a new job as a data analyst at Shopify.',
    split: 'holdout',
  },
  {
    id: 'xw-ok-6',
    label: 'ok',
    platform: 'gemini',
    useCase: 'writing',
    prompt: 'Write a bedtime story for kids about a dragon who is afraid of the dark.',
  },
  {
    id: 'xw-ok-7',
    label: 'ok',
    platform: 'claude',
    useCase: 'writing',
    prompt:
      'Rewrite this paragraph to sound more professional: "hey guys so basically the launch got pushed cuz the vendor messed up, we\'ll figure it out next week probably."',
  },
  {
    id: 'xw-strong-1',
    label: 'strong',
    platform: 'claude',
    useCase: 'writing',
    prompt:
      'Write a 150-word product description for our insulated 750 ml stainless steel bottle, sold on our Shopify store to hikers aged 25–40. Tone: practical and a little playful. Mention it keeps drinks cold 24 hours, fits car cup holders, and is dishwasher safe. End with a one-line call to action. No emojis.',
  },
  {
    id: 'xw-strong-2',
    label: 'strong',
    platform: 'openai',
    useCase: 'writing',
    prompt:
      "I'm the best man at my brother Sam's wedding on Saturday. Write a 3-minute toast (about 400 words) for a mixed crowd of family and college friends. Include: the time Sam got us lost hiking in Algonquin, how he met Priya at a board-game café, and a warm closing toast to them both. Funny but not roasting, nothing about exes.",
    split: 'holdout',
  },
  {
    id: 'xw-strong-3',
    label: 'strong',
    platform: 'gemini',
    useCase: 'writing',
    prompt: `<context>
We run a small bakery in Halifax. Our oven broke, so we're closed Tuesday and Wednesday this week. Pre-orders will be ready Thursday at 10am.
</context>

<instructions>
Write a short email to customers (under 120 words) explaining the closure, apologizing once, and telling pre-order customers when to pick up. Warm, plain language. Include a subject line.
</instructions>`,
  },
  {
    id: 'xw-strong-4',
    label: 'strong',
    platform: 'claude',
    useCase: 'writing',
    prompt:
      "Write a LinkedIn post (under 180 words) announcing I'm joining Shopify as a data analyst after 3 years in retail banking. Audience: former colleagues and recruiters. Thank my Maple Bank team, mention I'm excited to work on merchant analytics, and keep it humble, with at most 3 hashtags.",
  },
  {
    id: 'xw-strong-5',
    label: 'strong',
    platform: 'openai',
    useCase: 'writing',
    prompt:
      'Rewrite the paragraph below for our quarterly investor update. Audience: non-technical angel investors. Keep it under 80 words, keep every number, and make the delay sound accountable, not defensive.\n\n"Launch slipped 3 wks bc vendor API broke on our side, we patched it, 92% of beta users migrated, churn flat at 2.1%, new date is Nov 14."',
    split: 'holdout',
  },
  {
    id: 'xw-strong-6',
    label: 'strong',
    platform: 'gemini',
    useCase: 'writing',
    prompt:
      'Write a 500-word short story for my grade 5 class (ages 10–11) about a dragon who is afraid of the dark and learns to use her fire as a night-light. Simple vocabulary, one clear lesson about asking for help, a hopeful ending, and 3 discussion questions at the end.',
  },

  // ================= Q&A =================
  { id: 'xq-weak-1', label: 'weak', platform: 'claude', useCase: 'qa', prompt: 'help' },
  {
    id: 'xq-weak-2',
    label: 'weak',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'what do you think',
    split: 'holdout',
  },
  { id: 'xq-weak-3', label: 'weak', platform: 'gemini', useCase: 'qa', prompt: 'Is it good?' },
  {
    id: 'xq-weak-4',
    label: 'weak',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'hi can you please answer a question for me thank you so much i really appreciate it',
  },
  {
    id: 'xq-weak-5',
    label: 'weak',
    platform: 'claude',
    useCase: 'qa',
    prompt: 'explain everything about the stock market in as much detail as possible',
    split: 'holdout',
  },
  { id: 'xq-weak-6', label: 'weak', platform: 'gemini', useCase: 'qa', prompt: 'why' },
  {
    id: 'xq-weak-7',
    label: 'weak',
    platform: 'claude',
    useCase: 'qa',
    prompt: 'Which one should I pick?',
  },
  {
    id: 'xq-ok-1',
    label: 'ok',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'What causes inflation?',
  },
  {
    id: 'xq-ok-2',
    label: 'ok',
    platform: 'claude',
    useCase: 'qa',
    prompt: 'How do vaccines work?',
    split: 'holdout',
  },
  {
    id: 'xq-ok-3',
    label: 'ok',
    platform: 'gemini',
    useCase: 'qa',
    prompt: 'What is the difference between a Roth IRA and a traditional IRA?',
  },
  {
    id: 'xq-ok-4',
    label: 'ok',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'Is it better to rent or buy a house?',
  },
  {
    id: 'xq-ok-5',
    label: 'ok',
    platform: 'claude',
    useCase: 'qa',
    prompt: 'What are some good exercises for lower back pain?',
    split: 'holdout',
  },
  {
    id: 'xq-ok-6',
    label: 'ok',
    platform: 'gemini',
    useCase: 'qa',
    prompt: 'How long should I boil an egg for a runny yolk?',
  },
  {
    id: 'xq-ok-7',
    label: 'ok',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'Can you explain what a neural network is? Thanks!',
  },
  {
    id: 'xq-strong-1',
    label: 'strong',
    platform: 'claude',
    useCase: 'qa',
    prompt:
      "I'm 34, rent in Toronto for $2,400/month, and have $90k saved. I plan to stay at least 7 years. In under 200 words, compare renting vs buying a $750k condo for me, list the 3 numbers that matter most, and say what would flip the recommendation.",
  },
  {
    id: 'xq-strong-2',
    label: 'strong',
    platform: 'openai',
    useCase: 'qa',
    prompt:
      'Explain how mRNA vaccines work to a curious 12-year-old in 4–5 sentences, using one everyday analogy and no jargon.',
    split: 'holdout',
  },
  {
    id: 'xq-strong-3',
    label: 'strong',
    platform: 'gemini',
    useCase: 'qa',
    prompt:
      'I have mild lower back pain after long days at my desk (no injury, and my doctor cleared me for exercise). Suggest 5 exercises I can do at home in under 15 minutes total, with reps for each, as a numbered list. Flag any I should skip if the pain gets sharper.',
  },
  {
    id: 'xq-strong-4',
    label: 'strong',
    platform: 'claude',
    useCase: 'qa',
    prompt:
      'For a junior data analyst interview tomorrow, explain the difference between INNER JOIN and LEFT JOIN in 3 sentences, then give one example query for each using tables customers(id, name) and orders(id, customer_id). Keep it under 120 words.',
  },
  {
    id: 'xq-strong-5',
    label: 'strong',
    platform: 'openai',
    useCase: 'qa',
    prompt:
      'What is the boiling point of water at 2,000 m altitude in °C? Answer with the number (rounded to one decimal) and one sentence on why it is lower than at sea level.',
    split: 'holdout',
  },
  {
    id: 'xq-strong-6',
    label: 'strong',
    platform: 'gemini',
    useCase: 'qa',
    prompt:
      'Our 12-person nonprofit is choosing between Google Workspace and Microsoft 365. We mostly use email, shared docs and video calls, and nobody is technical. Compare them on price per user, ease of use and nonprofit discounts in a 3-row table, then give a one-sentence recommendation.',
  },

  // ================= Blind holdout v2 (written before round-2 fixes; labels frozen) =================
  {
    id: 'hc-weak-1',
    label: 'weak',
    platform: 'gemini',
    useCase: 'coding',
    prompt: 'my python script keeps crashing, help',
    split: 'holdout2',
  },
  {
    id: 'hc-weak-2',
    label: 'weak',
    platform: 'openai',
    useCase: 'coding',
    prompt: 'CODE ME A GAME!!!! MAKE IT REALLY FUN AND COOL!!!',
    split: 'holdout2',
  },
  {
    id: 'hc-ok-1',
    label: 'ok',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'Write a JavaScript function that removes duplicate values from an array.',
    split: 'holdout2',
  },
  {
    id: 'hc-ok-2',
    label: 'ok',
    platform: 'gemini',
    useCase: 'coding',
    prompt: 'What is the difference between a process and a thread?',
    split: 'holdout2',
  },
  {
    id: 'hc-strong-1',
    label: 'strong',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      'Write a Python 3.12 function `parse_duration(s: str) -> int` that converts strings like "1h30m", "45s" or "2h" into seconds for our CLI tool. Raise ValueError with a clear message on bad input, allow optional spaces, no external libraries. Return the function and 6 pytest cases covering edge cases.',
    split: 'holdout2',
  },
  {
    id: 'hw-weak-1',
    label: 'weak',
    platform: 'claude',
    useCase: 'writing',
    prompt: 'write a letter',
    split: 'holdout2',
  },
  {
    id: 'hw-weak-2',
    label: 'weak',
    platform: 'gemini',
    useCase: 'writing',
    prompt: 'Make me a really catchy and amazing slogan!!!',
    split: 'holdout2',
  },
  {
    id: 'hw-ok-1',
    label: 'ok',
    platform: 'openai',
    useCase: 'writing',
    prompt: 'Write an Instagram caption for a photo of our new vegan burger.',
    split: 'holdout2',
  },
  {
    id: 'hw-ok-2',
    label: 'ok',
    platform: 'claude',
    useCase: 'writing',
    prompt: 'Write a eulogy for my grandmother.',
    split: 'holdout2',
  },
  {
    id: 'hw-strong-1',
    label: 'strong',
    platform: 'gemini',
    useCase: 'writing',
    prompt:
      "I'm the organizer of a neighbourhood cleanup in Kitchener on May 10 (9am–noon, meet at Victoria Park pavilion, gloves and bags provided). Write a flyer headline plus 3 short sentences for families and seniors. Friendly, no jargon, under 60 words total, and end with how to RSVP: text 519-555-0182.",
    split: 'holdout2',
  },
  {
    id: 'hq-weak-1',
    label: 'weak',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'is this normal',
    split: 'holdout2',
  },
  {
    id: 'hq-weak-2',
    label: 'weak',
    platform: 'gemini',
    useCase: 'qa',
    prompt: 'Tell me absolutely everything you know about history, leave nothing out.',
    split: 'holdout2',
  },
  {
    id: 'hq-ok-1',
    label: 'ok',
    platform: 'claude',
    useCase: 'qa',
    prompt: 'How do solar panels generate electricity?',
    split: 'holdout2',
  },
  {
    id: 'hq-ok-2',
    label: 'ok',
    platform: 'openai',
    useCase: 'qa',
    prompt: 'What should I look for when buying a used car?',
    split: 'holdout2',
  },
  {
    id: 'hq-strong-1',
    label: 'strong',
    platform: 'claude',
    useCase: 'qa',
    prompt:
      "I'm buying my first used car in Ontario with a $15k budget, mostly for a 40 km daily highway commute. Give me a checklist of the 8 most important things to inspect or ask the seller, ordered by how costly they are to fix, one line each.",
    split: 'holdout2',
  },

  // ============ Coding agents with project access (workspace: true; labels frozen 2026-09-30) ============
  // Includes the before/after pairs from Anthropic's Claude Code best practices.
  {
    id: 'ag-weak-1',
    label: 'weak',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'fix it',
    workspace: true,
  },
  {
    id: 'ag-weak-2',
    label: 'weak',
    platform: 'openai',
    useCase: 'coding',
    prompt: 'make the app better',
    workspace: true,
  },
  {
    id: 'ag-weak-3',
    label: 'weak',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'why is it slow',
    workspace: true,
  },
  {
    id: 'ag-weak-4',
    label: 'weak',
    platform: 'gemini',
    useCase: 'coding',
    prompt: 'add tests',
    workspace: true,
  },
  {
    id: 'ag-ok-1',
    label: 'ok',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'Fix the login bug.',
    workspace: true,
  },
  {
    id: 'ag-ok-2',
    label: 'ok',
    platform: 'openai',
    useCase: 'coding',
    prompt: 'Add a dark mode toggle to the settings page.',
    workspace: true,
  },
  {
    id: 'ag-ok-3',
    label: 'ok',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'Refactor src/utils/date.ts to use date-fns instead of moment.',
    workspace: true,
  },
  {
    id: 'ag-ok-4',
    label: 'ok',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'add tests for foo.py',
    workspace: true,
  },
  {
    id: 'ag-strong-1',
    label: 'strong',
    platform: 'claude',
    useCase: 'coding',
    prompt:
      'Users report that login fails after session timeout. Check the auth flow in src/auth/, especially token refresh. Write a failing test that reproduces the issue, then fix it.',
    workspace: true,
  },
  {
    id: 'ag-strong-2',
    label: 'strong',
    platform: 'claude',
    useCase: 'coding',
    prompt:
      'Write a test for foo.py covering the edge case where the user is logged out. Avoid mocks.',
    workspace: true,
  },
  {
    id: 'ag-strong-3',
    label: 'strong',
    platform: 'openai',
    useCase: 'coding',
    prompt:
      "The checkout test in tests/checkout.spec.ts started failing after yesterday's refactor of useCart. Find the root cause, explain it in 2–3 sentences, then fix it without changing the public API of useCart. Run pnpm test checkout to confirm.",
    workspace: true,
  },
  {
    id: 'ag-strong-4',
    label: 'strong',
    platform: 'gemini',
    useCase: 'coding',
    prompt:
      'Add a dark mode toggle to src/pages/Settings.tsx using our existing ThemeContext. Persist the choice in localStorage, default to the system setting, and do not touch other pages. Done when pnpm lint and the Settings tests pass.',
    workspace: true,
  },
  // Control: the same vague request in a plain chat, where the model can't see the code.
  {
    id: 'ag-ctrl-weak',
    label: 'weak',
    platform: 'claude',
    useCase: 'coding',
    prompt: 'Fix the login bug.',
  },
];
