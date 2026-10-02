import { S } from '../sources';
import type { Rule, RuleContext } from '../types';

/**
 * Rules for coding agents and Projects that can already read the user's files (PLAN.md
 * §2.5d). They replace the "paste your code" checks with what these tools can't infer:
 * where to look, what's wrong, and how to tell the work is done. All three vendors say so:
 * Claude Code ("give Claude a way to verify its work"; "provide the symptom, the likely
 * location, and what 'fixed' looks like"), Codex ("ask it to … run the relevant checks"),
 * GitHub Copilot ("be specific", point it at the relevant files, test its work).
 */

/**
 * Asks the agent to change something, as opposed to asking a question about the code: some
 * sentence starts with a change verb ("Fix…", "Please add…", "Can you refactor…").
 */
const CHANGE_VERBS =
  'fix|add|implement|refactor|update|remove|delete|rename|migrate|write|build|create|change|convert|upgrade|debug|optimi[sz]e|speed up|improve|make|replace|move|extract|clean up|support|handle|investigate|find';
const CHANGE_START_RE = new RegExp(
  `^(?:(?:ok(?:ay)?|so|now|then|also|please),?\\s+)*(?:(?:can|could|would) you\\s+|i (?:want|need|'d like) you to\\s+|we need to\\s+|let'?s\\s+|go ahead and\\s+)?(?:${CHANGE_VERBS})\\b`,
);

function isChangeTask(ctx: Pick<RuleContext, 'features'>): boolean {
  const { sentences, instructionLower } = ctx.features;
  // "why is it slow" is a bug report in disguise; "how does logging work?" is a question.
  if (/^why\b/.test(instructionLower.trim()) && BUG_RE.test(instructionLower)) return true;
  return sentences.some((s) => CHANGE_START_RE.test(s.toLowerCase()));
}

/**
 * Small, clearly scoped edits: Anthropic's guidance is to just ask for these directly
 * ("fixing a typo, adding a log line, or renaming a variable"), without a plan or checks.
 */
const SMALL_TASK_RE =
  /\b(?:typos?|spelling|rename|renaming|log line|console\.log|print statement|comments?|docstrings?|bump|version number|wording|copy|label|placeholder|tooltip|colou?r|padding|margin|font[- ]size|icon|alt text|capitali[sz]e)\b/;

/** Code things a change request can act on. */
const CODE_NOUN_RE =
  /\b(?:button|component|function|method|class|endpoint|api|route|page|screen|modal|form|table|column|query|schema|database|db|test|tests|hook|module|script|variable|field|input|navbar|sidebar|header|footer|toolbar|menu|dropdown|pagination|dark mode|login|logout|auth|css|html|app|feature|bug|error|build|deploy|repo|codebase)\b/;

/**
 * "Can you add a button that exports the table as a CSV": a request to change code, whatever
 * use case is selected. Scored as coding so a Q&A setting doesn't skip the coding checks.
 */
export function isCodeChangeRequest(ctx: Pick<RuleContext, 'features'>): boolean {
  const { features } = ctx;
  const code =
    CODE_NOUN_RE.test(features.instructionLower) ||
    LOCATION_RE.test(features.instructionLower) ||
    IDENTIFIER_RE.test(features.instructionText);
  return code && isChangeTask(ctx);
}

const applies = (ctx: RuleContext) =>
  ctx.workspace && isChangeTask(ctx) && !SMALL_TASK_RE.test(ctx.features.instructionLower);

/** How to tell it's done: tests, a command, a build, a screenshot, a measurable outcome. */
const VERIFY_RE =
  /\b(?:tests?|specs?|pytest|jest|vitest|unit test|e2e|run |runs|lint|typecheck|type-check|tsc|build succeeds|builds?|compiles?|screenshot|verify|confirm|check that|make sure|should pass|passes|pass|until|reproduces?|repro|ci|assert|benchmark|measure|done when|acceptance)\b/;

/** Where to look: a path, a file, @file, `code`, an identifier, or a named part of the app. */
const LOCATION_RE =
  /[\w.-]+\/[\w./-]*|\b[\w-]+\.(?:ts|tsx|js|jsx|mjs|py|go|rb|java|kt|rs|cs|php|swift|sql|css|scss|html|vue|svelte|md|json|ya?ml|toml|sh)\b|@[\w./-]+|`[^`]+`|\bthe (?:[\w-]+ ){0,2}(?:page|screen|view|component|hook|endpoint|route|module|function|method|class|service|test|suite|table|schema|model|controller|handler|middleware|form|modal|dialog|button|api|query|job|worker|script|flow|package|library|config|workflow|pipeline|header|footer|navbar|nav bar|nav|sidebar|side bar|toolbar|menu|dashboard|list|filters?|search(?: bar)?|tab|panel|card|settings|profile|checkout|cart|login|sign-?up|homepage|home page|landing page|section|bar|banner|popup|dropdown|input|field|editor|chart|grid|feed|inbox|admin|layout|app bar)s?\b/;
/** camelCase / PascalCase identifiers (checked on the original text, not lowercased). */
const IDENTIFIER_RE = /\b[a-z]+[A-Z][\w]*\b|\b[A-Z][a-z]+[A-Z][\w]*\b/;

const BUG_RE =
  /\b(?:fix|bug|broken|failing|fails?|error|crash(?:es|ing)?|slow|hangs?|leak|wrong|not working|doesn'?t work|flaky|regression)\b/;
const REQUIREMENT_NOT_BUG_RE =
  /\b(?:without|no|never|not|doesn'?t|don'?t|won'?t|handles?|handled|handling|catch(?:es)?|graceful(?:ly)?|proper(?:ly)?)\s+(?:[\w'-]+\s+){0,4}?(?:crash(?:es|ing)?|errors?|fail(?:s|ing|ures?)?)\b|\berror[- ]handling\b/g;
/** What's actually going wrong: numbers, quoted errors, when it happens, what was expected. */
const SYMPTOM_RE =
  /\d|["“`]|\b(?:when|after|since|every time|whenever|instead of|expected|should|returns?|shows?|takes?|report(?:s|ed)?|throws?|logs?)\b/;

export const agentRules: Rule[] = [
  {
    id: 'agent.no-verification',
    dimension: 'output',
    title: 'No way to check it worked',
    sources: [S.claudeCodeBestPractices, S.openaiCodex, S.githubCopilot],
    evaluate: (ctx) =>
      applies(ctx) && !VERIFY_RE.test(ctx.features.instructionLower)
        ? {
            penalty: 0.3,
            message:
              "The prompt doesn't say how to tell the change works, so the agent stops when it merely looks done.",
            suggestion:
              'Give it a check it can run: "add a test that fails before the fix, then run pnpm test", "make sure the build passes", or "take a screenshot and compare it to the design".',
          }
        : null,
  },
  {
    id: 'agent.no-location',
    dimension: 'context',
    title: 'No pointer to where',
    sources: [S.claudeCodeBestPractices, S.githubCopilot],
    evaluate: (ctx) => {
      if (!applies(ctx)) return null;
      const { features } = ctx;
      if (
        LOCATION_RE.test(features.instructionLower) ||
        IDENTIFIER_RE.test(features.instructionText)
      )
        return null;
      return {
        penalty: 0.3,
        message:
          'The agent can read the project, but the prompt names no file, folder, component or function, so it has to search (and may change the wrong thing).',
        suggestion:
          'Point it at the place: a path like src/auth/, a file (@Settings.tsx), a function (`refreshToken`), or an existing example to follow.',
      };
    },
  },
  {
    id: 'agent.no-symptom',
    dimension: 'context',
    title: "Doesn't describe the problem",
    sources: [S.claudeCodeBestPractices, S.openaiCodex],
    evaluate: (ctx) => {
      if (!applies(ctx)) return null;
      const lower = ctx.features.instructionLower;
      // "Handle errors", "without crashing" and "error handling" are requirements, not bugs.
      const asBug = lower.replace(REQUIREMENT_NOT_BUG_RE, ' ');
      if (!BUG_RE.test(asBug) || SYMPTOM_RE.test(lower)) return null;
      return {
        penalty: 0.45,
        message:
          "It asks to fix something without saying what's going wrong, so the agent has to guess which problem you mean.",
        suggestion:
          'Describe the symptom and what "fixed" looks like, e.g. "login fails after the session times out; users should be sent to the login page instead".',
      };
    },
  },
];
