---
name: smart-brevity
description: Use when writing or editing any summary, status line, headline, chat reply, or task description that Cowork (the GC's agent) shows in this prototype, including scripted story data in src/signals and src/workstreams and generated text in summary helpers. Applies Axios's Smart Brevity principles in spirit, biased toward the GC's next action.
---

# Smart Brevity for Cowork's copy

Cowork writes for a general counsel who reads between meetings. Every summary has to earn its space: say the one thing that matters, say why, and stop. These rules come from Smart Brevity (Axios: VandeHei, Allen, Schwartz). Apply them **in spirit only**. Never show the framework's labels ("Why it matters", "Go deeper", "The big picture") on screen.

## The four moves, in order

1. **Headline: the answer, short.** Six to ten words when you can manage it, one sentence always. If the GC reads only this, they know what to do. When the GC (Peter) has to act, the action *is* the headline: "Review Dana's memo, then confirm it." What's blocking other people comes next. Progress is last.
2. **Lede: one sentence that backs the headline.** The single fact that makes the headline true: who did what, and when. No warm-up, no "Cowork has been working on…".
3. **Why it matters: one sentence, only if it changes what the GC does.** The stakes or who's held up ("Alex can't start the questionnaire until you approve it"). Skip it if the headline and lede already make it obvious.
4. **Go deeper: behind an expand, never inline.** Details, history, quotes and lists live in the timeline, the activity log, or a "Show more". The summary itself never runs past two sentences after the headline.

If you can't write the headline, you don't understand the state of the work yet. Work out what's actually true first, then write.

## Rules of thumb

- **One idea per summary.** If there are two things the GC must do, the headline names the first. The rest appear in their own rows ("Waiting on you", "Waiting on others").
- **Lead with the person and the verb.** "Dana sent the memo on Nov 2", not "The memo, which Dana sent on Nov 2, …".
- **Cut throat-clearing.** No pleasantries, hedges, or restating the question. No "just", "simply", "please note", "it appears that".
- **Concrete over abstract.** Names, dates, counts, documents: "Nov 6", "1 of 3 follow-ups", "Article II, Section 8".
- **Short words, active voice, contractions.** This also follows the Microsoft style guide in AGENTS.md.
- **No AI labels.** Don't mark text as AI-generated or use sparkle styling. The summary is just the summary.

## Where it applies here

- The workstream status summary (`workstreamAttention` in `src/workstreams/workstreamAttention.ts`, shaped by `src/workstreams/summary.ts`): headline plus at most two support sentences, enforced by tests.
- Task status lines (`summarizeTask`, `taskActivity` in `src/workstreams/taskStatus.ts`) and the scripted `statusSummary` lines in `src/workstreams/atgStory.ts` and `src/signals/signals.ts`: one or two sentences, no repeating the task's own title.
- A task's "what done looks like" line: a postcondition, not steps. State the end state and who confirms it ("Peter confirms whether the ruling affects Acme's bylaws"), never how to get there. The plan's rules govern the how.
- The Create workstream summary: what the signal is, why it matters to Acme, and what Cowork suggests, in that order, in at most three sentences.
- Calendar activity lines, attention cards, and Cowork's chat replies.

## Check before you finish

- Could the GC act from the headline alone?
- Is every sentence after it necessary? Delete any that only restate.
- Is anything longer than two support sentences? Move it behind an expand.
- Did a framework label sneak onto the screen? Remove it.
