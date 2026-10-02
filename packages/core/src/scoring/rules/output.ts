import { BRIEF_WORD, detectExplicitLength } from '../../estimation/output';
import { S } from '../sources';
import type { Rule } from '../types';
import { fileUse, hasMaterial, isReviewTask } from './helpers';

const FORMAT_RE =
  /\b(?:json|table|list|bullets?|bullet points|markdown|csv|yaml|xml|paragraphs?|headings?|headers?|code block|numbered|outline|format(?:ted)?|schema|template|essay|email|tweet|thread|post|report|script|function|class|component|module|step[- ]by[- ]step|steps|sentences?|columns?|fields?|diff|snippet|slides?|memo|letter|summary|haiku|poem|descriptions?|captions?|bio|speech|toast|announcement|newsletter|press release|story|stories|ad|advertisement|slogan|tagline|headline|abstract|proposal|cover letter|query|queries)\b/;
/** "brief" as a noun ("the assignment brief") and "page numbers" are not length limits. */
const LENGTH_WORDS_RE = new RegExp(
  `\\b(?:${BRIEF_WORD}|short|concise(?:ly)?|succinct(?:ly)?|tl;?dr|detailed|comprehensive|in[- ]depth|long|one[- ]pager|(?:one|a|single|half a)[- ]page)\\b`,
);
const CRITERIA_RE =
  /\b(?:should|must|needs? to|requirements?|criteria|constraints?|expected|ensure|make sure|tests?|edge cases?|handle|accuracy|accurate|return|only|without|avoid|limit|keep)\b/;
/** What a review is measured against: a target, criteria, or aspects to focus on. */
const REVIEW_FOCUS_RE =
  /\b(?:for (?:a|an|the|my|our) |against|focus(?:ing)? on|in terms of|criteria|rubric|standards?|looking for|compared (?:to|with)|ats|applicant tracking|tone|clarity|grammar|spelling|punctuation|structure|impact|readability|concise(?:ness)?|accuracy|bugs?|performance|security|style|formatting|keywords?|consistency|flow|persuasive(?:ness)?|role|job|position|priorit|most important|biggest|highest[- ]impact|weakness(?:es)?|strengths?)\b/;
const FALLBACK_RE =
  /\b(?:not found|n\/a|null|none|unknown|say so|if (?:it'?s |the answer is |the information is |they'?re )?(?:not|missing|absent|unclear|unsure)|if you (?:can'?t|cannot|don'?t know)|don'?t know|only (?:use|from|based on)|based only on)\b/;
/**
 * Coding: what bounds the work. Code isn't measured in words; its "length" is its scope:
 * which features, which files, what's out, and whether to explain.
 */
const CODE_SCOPE_RE =
  /\b(?:(?:single|one) (?:file|class|function|method|script|module|component|page|endpoint)|only (?:the|use|uses|using|support|supports|handle|need|include|change|modify|touch|return|output)|just (?:the )?(?:code|function|class|diff|changes?|snippet)|code only|no (?:gui|ui|explanations?|comments|tests|external|third[- ]party|frameworks?|libraries|dependencies)|without (?:a |any )?(?:gui|ui|explanations?|tests|libraries|frameworks?|dependencies)|minimal|bare[- ]bones|mvp|simple|basic|small|under \d+ lines|\d+ lines|standard library|stdlib|out of scope|don'?t (?:change|touch|add))\b/;
/** Coding: how to hand the code back (beyond the general format words). */
const CODE_FORMAT_RE =
  /\b(?:(?:single|one) (?:file|class|script)|code only|just the code|no explanations?|runnable|full (?:code|program|file|source)|complete (?:code|program|file|class|source)|\w+\.(?:java|py|js|ts|tsx|jsx|go|rb|cs|cpp|c|rs|kt|swift|php|sh|sql))\b/;
/** Coding: changing existing code (vs. building something new), for the right examples. */
const CODE_CHANGE_RE =
  /\b(?:fix|bug|debug|broken|error|refactor|change|update|modify|rename|move|remove|delete|migrate|upgrade|optimi[sz]e|speed up|clean up)\b/;
const UNBOUNDED_RE =
  /\b(?:everything|all you know|as much as (?:possible|you can)|as detailed as possible|in as much detail|exhaustive(?:ly)?|leave nothing out|every single|all (?:the|of the) details)\b/;

export const outputRules: Rule[] = [
  {
    id: 'output.no-format',
    dimension: 'output',
    title: 'No output format',
    sources: [S.anthropicFormat, S.vertexComponents, S.microsoftPromptEng, S.openaiBestPractices],
    evaluate: ({ features, useCase }) => {
      const lower = features.instructionLower;
      const coding = useCase === 'coding';
      if (FORMAT_RE.test(lower) || (coding && CODE_FORMAT_RE.test(lower))) return null;
      if (coding) {
        // Code is the obvious shape; what's unsaid is how to hand it back.
        return {
          penalty: 0.3,
          message:
            "The prompt doesn't say how to hand the code back: one file or several, the full program or just the changes, with or without an explanation.",
          suggestion: CODE_CHANGE_RE.test(lower)
            ? 'Say what to return, e.g. "only the changed function, as a diff" or "the fixed file in full, then one line on what changed".'
            : 'Say what to return, e.g. "one runnable file in a single code block, then the command to run it".',
        };
      }
      return {
        // A review isn't a quick question, even under Q&A: its shape matters.
        penalty:
          useCase === 'brainstorming'
            ? 0.2
            : useCase === 'qa' && !isReviewTask(features)
              ? 0.35
              : 0.45,
        message: "The prompt doesn't say what shape the answer should take.",
        suggestion:
          useCase === 'extraction'
            ? 'Specify the exact structure, e.g. "Return JSON with fields name, email, company".'
            : 'Name the format, e.g. "a Markdown table with columns X, Y, Z" or "3 short paragraphs".',
      };
    },
  },
  {
    id: 'output.no-length',
    dimension: 'output',
    title: 'No length limit',
    sources: [S.openaiBestPractices, S.dairTips, S.anthropicPricing],
    evaluate: ({ features, useCase }) => {
      // Extraction output length follows its input, so a limit isn't needed; coding is bounded
      // by scope instead (output.no-code-scope).
      if (useCase === 'extraction' || useCase === 'coding') return null;
      const unbounded = UNBOUNDED_RE.test(features.instructionLower);
      if (
        !unbounded &&
        (detectExplicitLength(features.instructionLower) ||
          LENGTH_WORDS_RE.test(features.instructionLower))
      ) {
        return null;
      }
      if (unbounded) {
        // "Everything, in as much detail as possible" is the opposite of a scope.
        return {
          penalty: 0.6,
          message:
            'The prompt asks for everything, so the answer will be long, costly and unfocused.',
          suggestion:
            'Narrow it to what you need, e.g. "the 3 main causes, one paragraph each" or "a 200-word overview for a beginner".',
        };
      }
      return {
        penalty: useCase === 'qa' && !isReviewTask(features) ? 0.3 : 0.4,
        message:
          'No length or scope limit. Output costs 5–6× more than input, so answers tend to run long.',
        suggestion:
          'Bound the answer, e.g. "in under 150 words", "5 bullet points", or "one paragraph".',
      };
    },
  },
  {
    id: 'output.no-code-scope',
    dimension: 'output',
    title: 'Scope not defined',
    sources: [S.anthropicClear, S.openaiBestPractices, S.anthropicPricing],
    useCases: ['coding'],
    evaluate: ({ features }) => {
      const lower = features.instructionLower;
      if (
        CODE_SCOPE_RE.test(lower) ||
        detectExplicitLength(lower) ||
        LENGTH_WORDS_RE.test(lower) ||
        CODE_FORMAT_RE.test(lower)
      )
        return null;
      return {
        penalty: UNBOUNDED_RE.test(lower) ? 0.5 : 0.2,
        message:
          "The prompt doesn't define what's in or out of scope, so the model decides how much code and explanation to write. Output is billed at 5–6× the input rate, so a defined scope keeps responses focused and lower cost.",
        suggestion: CODE_CHANGE_RE.test(lower)
          ? 'Say what\'s in and out, e.g. "only change the auth module; don\'t touch the tests or the public API".'
          : 'Say what\'s in and out, e.g. "core features only, no GUI, standard library only, one file".',
      };
    },
  },
  {
    id: 'output.no-criteria',
    dimension: 'output',
    title: 'No success criteria',
    sources: [S.principled, S.vertexComponents, S.anthropicClear],
    useCases: ['coding', 'analysis', 'extraction'],
    evaluate: ({ features, useCase }) =>
      CRITERIA_RE.test(features.instructionLower)
        ? null
        : {
            penalty: 0.3,
            message: 'No requirements or constraints say what a correct answer must satisfy.',
            suggestion:
              useCase === 'coding'
                ? 'List the must-haves, e.g. "handle invalid input without crashing", "standard library only", "include 2 unit tests".'
                : 'List the must-haves, e.g. "must handle empty input", "only use the standard library", "cite the source line".',
          },
  },
  {
    id: 'output.no-review-focus',
    dimension: 'output',
    title: 'No review focus',
    sources: [S.openaiBestPractices, S.vertexComponents, S.principled],
    evaluate: ({ features }) =>
      isReviewTask(features) && !REVIEW_FOCUS_RE.test(features.instructionLower)
        ? {
            penalty: 0.45,
            message:
              'The prompt asks for a review but gives no yardstick, so the feedback will be generic.',
            suggestion:
              'Say what to judge it against and what matters most, e.g. "for a junior analyst role; focus on measurable impact and ATS keywords".',
          }
        : null,
  },
  {
    id: 'output.no-fallback',
    dimension: 'output',
    title: 'No "out" when the answer may be missing',
    sources: [S.microsoftPromptEng],
    useCases: ['qa', 'analysis', 'extraction'],
    evaluate: (ctx) =>
      (hasMaterial(ctx.features) || fileUse(ctx).substantive) &&
      !FALLBACK_RE.test(ctx.features.instructionLower)
        ? {
            penalty: 0.2,
            message:
              "When answering from provided text or files, the model isn't told what to do if the answer isn't there, which invites made-up answers.",
            suggestion:
              'Add an out, e.g. "If the answer isn\'t in the text, reply \'not found\'" or "use null for missing fields".',
          }
        : null,
  },
];

export { UNBOUNDED_RE };
