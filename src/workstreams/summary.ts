/**
 * How Cowork writes summaries (docs/superpowers/plans/2026-11-04-workstream-mvp-simplification.md):
 * a bold headline that answers on its own, biased toward the owner's next
 * action, then one or two supporting sentences, never more.
 */
export type Summary = { headline: string; support: string[] };

export const MAX_SUPPORT_SENTENCES = 2;

/** Sentence ends: . ! or ? (optionally closing a quote), before a capitalized word or the end. */
const SENTENCE_END = /[.!?]["”’)]?(?=\s+["“‘(]?[A-Z]|\s*$)/g;

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  for (const match of text.matchAll(SENTENCE_END)) {
    const end = match.index! + match[0].length;
    sentences.push(text.slice(start, end).trim());
    start = end;
  }
  const rest = text.slice(start).trim();
  if (rest) sentences.push(rest);
  return sentences;
}

export function summarySentences(text: string): number {
  return splitSentences(text).length;
}

/** The first sentences that fit the support limit, in order. */
export function capSupport(parts: (string | undefined)[], max = MAX_SUPPORT_SENTENCES): string[] {
  return parts
    .filter((p): p is string => Boolean(p))
    .flatMap(splitSentences)
    .slice(0, max);
}

/** The summary as plain text, e.g. for chat. */
export function summaryText(summary: Summary): string {
  return [summary.headline, ...summary.support].join(" ");
}
