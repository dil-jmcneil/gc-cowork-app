import type { ChatStreamChunk } from "@/chat/chatTypes";

/**
 * Shared streaming primitives for the mock agent replies. They yield
 * `ChatStreamChunk`s that `streamAssistantMessage` folds into a message's
 * parts one chunk at a time.
 */

/** Resolves once the timer fires or the signal aborts (never rejects). */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Streams a reasoning segment: a one-shot curated `summary` (shown collapsed)
 * followed by the full narration revealed character-by-character. `charDelayMs`
 * controls the typing speed (default 6ms/char).
 */
export async function* streamReasoning(
  summary: string,
  text: string,
  signal: AbortSignal,
  charDelayMs = 6,
): AsyncGenerator<ChatStreamChunk> {
  yield { type: "reasoning-summary", summary };
  for (const char of text) {
    yield { type: "reasoning-delta", delta: char };
    await sleep(charDelayMs, signal);
    if (signal.aborted) return;
  }
}

/** Streams a text segment (the agent's visible answer) char-by-char. */
export async function* streamText(
  text: string,
  signal: AbortSignal,
  charDelayMs = 10,
): AsyncGenerator<ChatStreamChunk> {
  for (const char of text) {
    yield { type: "text-delta", delta: char };
    await sleep(charDelayMs, signal);
    if (signal.aborted) return;
  }
}
