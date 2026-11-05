# Workstream MVP Simplification Plan

**Goal:** Act on the Nov 4 feedback from Cyprian: one workstream page for every link, the chat always open beside it, a status summary that leads with what's waiting on you, a much simpler plan, and history recast as a short "timeline" grouped by milestone.

**Out of scope for now:** building two versions of the plan and timeline (A: separate components, B: one combined timeline) for feedback. This plan builds one layout, A: a simple plan with a separate timeline.

**Sources:** the call transcript "Call with Joe McNeil" (Nov 4, 2026) and Cyprian's "next steps" summary.

**Branch:** `scenario-refinement`, which is even with `main` at 8810150.

**Hide, don't delete:** this applies to the task page, the task quick-view dialog, the signal dialog, the separate create page and the "Revise via chat" button. All of them stay in the code with their tests. A single MVP-scope flag turns them off, and a Demo Settings switch can bring them back for a demo.

---

## The feedback, and where it lands

| # | Feedback | What changes in the app | Phase |
|---|----------|------------------------|-------|
| 1 | One workstream page, no task views. Every link goes to the full workstream. | Calendar, attention pane, chat cards and old task URLs all go to `/workstreams/:id`, opened on the right milestone. The task page and both dialogs are hidden. | 1 |
| 2 | The chat is always open on the right, and the page has one mode. Remove the chat button. | The workstream page uses `SideChatLayout`. The chat can edit the plan, close a task, and answer questions about the workstream. "Revise via chat" is hidden. Drafting a workstream happens on the same page. | 2 |
| 3 | One-sentence lead, at most two sentences of description, the rest behind expand. | The summary rules below: a bold headline that answers, then one or two supporting sentences. A shared expand pattern for the rest. | 3 |
| 4 | The status summary gets its own design. It shows what waits on you and what blocks others. | A new `StatusSummary` block. Its headline is your next action when there is one, then "Waiting on you" (with its action) and "Waiting on others" (with Nudge). | 3 |
| 5 | Source and signal details move down and collapse once the workstream exists. | "About This Signal" and "Source" merge into one collapsed section near the bottom. | 3 |
| 6 | History moves up and shows the last two days, then 10, then all. Call it "timeline". | `HistoryList` becomes `TimelineList`, with stepped expansion. The label changes from History to Timeline. | 4 |
| 7 | A much simpler plan: each milestone shows its status, owner and whether you must act. One milestone in the demo is blocked by you, and you can clear it. | One row per milestone. The memo awaiting your review blocks Milestone 1, and you clear it from the row, the status summary or the chat. | 4, 6 |
| 8 | History belongs to each milestone. Click a milestone to see its activity. | Each milestone row expands to its own timeline: entries from its tasks' histories. | 4 |

---

## How Cowork writes summaries

This applies to every summary Cowork writes: the workstream status summary, milestone and task status lines, calendar activity lines, the attention card, and the chat's opening line.

1. **The headline is the answer.** It's bold, and it's enough on its own. If you read only the headline, you know what you need to know. If Cowork can't put the answer in one headline, the summary isn't simple enough yet.
2. **One or two supporting sentences, at most.** They back up the headline and nothing else: no side facts, no background.
3. **Bias toward action.** When the workstream's owner (Peter) has to act, that action *is* the headline, with the action itself (for example "Review Dana's memo and confirm it to close Milestone 1"). What's blocked on other people comes next. Progress news comes last, and only if there's room.

Store summaries as `{ headline, support }` rather than one string, so every surface can bold the headline and drop the support when space is tight. `summarizeWorkstream`, `summarizeTask`, `taskActivity` and the scripted ATG summaries all move to this shape, and a shared `<Summary>` component renders it.

---

## How the hiding works

Add `src/demo/mvpScopeStore.ts`, modeled on `planRulesStore.ts` and persisted in localStorage:

- `showPostMvpViews: boolean`, default `false`. When it's false:
  - The task route redirects to the workstream.
  - `TaskQuickView` and `SignalDialog` are never opened.
  - `CreateWorkstreamPage` redirects to the one-page draft.
  - "Revise via chat" is not rendered.

Demo Settings gets a "Workstream" section with a "Show post-MVP views" switch, so the hidden views can be shown in a demo without a code change.

**Guarded, not removed:** `TaskPage.tsx`, `TaskQuickView.tsx`, `TaskDetailsCard.tsx`, `TaskBadges.tsx`, `SignalDialog.tsx`, `CreateWorkstreamPage.tsx`, `taskChat.ts`, and their tests. Each guard site gets a one-line comment pointing back to this plan.

---

## Phase 1: Every link goes to the workstream

1. **Deep link to a milestone.** `/workstreams/:id?milestone=<milestoneId>` scrolls to that milestone and expands it. A `&task=<taskId>` parameter also highlights the task row inside it.
2. **Calendar.**
   - `complianceEvents.ts`: change `href` for task events to the milestone deep link.
   - `ComplianceCalendar.handleOpen`: task events navigate to that link instead of setting `openTask`.
   - Deadline events whose signal has a workstream go to it. Deadline events with no workstream go to the draft (Phase 2).
   - Past-workstream reference events go to their own pages (see open question 2).
3. **Attention pane.**
   - Clicking the card, Open, or Revisit goes straight to the workstream: the existing one, or a new draft for a new signal.
   - The footer link to the workstream stays.
4. **Chat signal cards (`SignalList`).** "View workstream" and "Create workstream" both go to the workstream page. Signals with no workstream and no plan get no drill-in. The card itself, with its outcome line and source link, is the whole story.
5. **Plan rows.** `PlanMilestones.onOpenTask` expands the task in place instead of navigating.
6. **Old task URLs.** When the flag is off, `/workstreams/:id/tasks/:taskId` redirects to `/workstreams/:id?milestone=<task.milestoneId>&task=<taskId>`, so bookmarks and test links still land somewhere.

**Tests:**
- Calendar task events link to the workstream with the task's milestone.
- The task route redirects when the flag is off and renders `TaskPage` when it's on.
- The attention card Open action never opens a dialog when the flag is off.

## Phase 2: One page, with the chat always open

1. **Layout.**
   - Wrap `WorkstreamPage` in `SideChatLayout`, with `chatId = workstreamChatId(id)`.
   - Seed the chat with one Cowork line: the status summary's headline.
   - Update `Shell.hasSideChat` to match `/workstreams/:id`.
2. **Workstream chat handler** (`src/workstreams/workstreamChat.ts`, new). It does three things:
   - **Plan edits:** delegate to the existing `planEditFromChat` and `updatePlan`. Removing Milestone 4 keeps working here.
   - **Confirming a task:** if a task is awaiting your review and the message matches `CONFIRMS_DONE`, call `confirmTaskDone`. Lift this from `taskChat.ts` into a shared helper.
   - **Questions:** "where does it stand", "what's waiting on me", or "is this relevant" get an answer built from the status summary and the signal's relevance points. Anything else gets the existing fallback reply.
3. **Remove the chat button.** Hide "Revise via chat". The always-open chat replaces it.
4. **Create on the same page.**
   - For a new signal, `createWorkstream` runs with `plan.status = "draft"`, and the app navigates to `/workstreams/:id`.
   - A draft shows a "Start workstream" primary action in the page header, which is the existing `acceptPlan`.
   - Name and description edits go through chat for the MVP.
   - `CreateWorkstreamPage` is hidden behind the flag.

**Tests:**
- `workstreamChat`:
  - "Remove milestone 4" edits the plan.
  - "Got it" closes the memo task while it's awaiting review.
  - "What's waiting on me" names the memo.
- Opening a new signal creates exactly one draft. A second open reuses it.

## Phase 3: Status summary first, and short blocks

1. **New derivation, `workstreamAttention(workstream, now)`.** It returns:
   - `summary`: `{ headline, support }`, following the summary rules. When `waitingOnYou` isn't empty, the headline is your first action. Otherwise it's the biggest blocker on others, and only then progress.
   - `waitingOnYou`: items with an action. For now that means a task awaiting your review, whose action is Confirm and close.
   - `waitingOnOthers`: overdue or blocking tasks, each with its owner, plus Nudge.

   Build it on `taskAttention` and `currentMilestone`. The scripted ATG summaries are rewritten as `{ headline, support }` and stay the source of the wording for that story.
2. **`StatusSummary` component** (in `src/components/workstreams/`). It needs its own visual design:
   - An emphasized surface, such as an informational tint with an accent bar. It must use Atlas tokens and no sparkle or AI styling.
   - The headline at 16px emphasized. When you have to act, it says what to do.
   - The support sentence or two below it, in body text.
   - Below it, up to two labeled lines, "Waiting on you" and "Waiting on others", each with an inline x-small button.
   - Anything more goes behind "Show more".
3. **New page order:**
   1. Header with the workstream name.
   2. Status summary.
   3. Plan, then timeline.
   4. "About This Signal", which absorbs the Source card. It's collapsed once the plan is accepted and open while it's a draft.
   5. Rules, behind the existing Demo Settings toggle.
4. **Copy pass:** every block follows the summary rules, with a bold headline that answers and at most two supporting sentences. Anything longer moves into an expand. This covers:
   - the milestone `doneWhen` and `startsWhen` text
   - the approach
   - the relevance bullets beyond the first two

**Tests:**
- `workstreamAttention` for the ATG story:
  - The headline asks you to review Dana's memo, and the support is at most two sentences.
  - The memo is listed under `waitingOnYou`.
  - Morgan's overdue task is listed under `waitingOnOthers`.
  - After `confirmTaskDone`, `waitingOnYou` is empty and the headline moves to Morgan's overdue reply.
- A summary helper test: every generated summary has a headline and no more than two support sentences.

## Phase 4: A simple plan and a separate timeline

1. **Milestone status, `milestoneProgress(milestone, tasks, now)`** in `milestones.ts`. It returns:
   - `status`: one of `"Done" | "In progress" | "Blocked" | "Not started"`
   - `owner`: the owner of the open task. With more than one, it's the first owner plus a count, e.g. "Alex Kim +1".
   - `needsYou`: true when a task is awaiting your review, or the milestone's approval is due.
   - `blockedBy`: who it's waiting on, if anyone.

   This replaces the Done / Current / Upcoming triple for display. Keep `milestoneStatuses` for anything else that uses it.
2. **Simplified `PlanMilestones`.**
   - One row per milestone: a status dot and label, the title, the owner, and a "Needs you" badge plus its action at the top right (the same pattern as the calendar rows).
   - Expanding a row shows its tasks (compact), its milestone timeline, and the start and done contract in one line each.
   - The "Plan" card is renamed. The working name is "Milestones"; open question 4 covers the final name.
3. **`TimelineList`** (renaming `HistoryList` and moving it into `components/workstreams/`):
   - The default view is entries from the last two days, relative to the demo's today.
   - "Show 10 more" first, then "Show all (N)".
   - Each entry gets a small milestone label when it's shown in the page-level timeline.
   - The filter chips drop to a single quiet "Filter" menu, to cut the noise.
   - Labels change from "History" to "Timeline" across the UI.
4. **Milestone timeline.** It's the same list, filtered to the milestone's tasks' entries. Later these can become separate threads per owner.
5. **Placement:** milestones first, then the workstream timeline, both above "About This Signal".

**Tests:**
- `milestoneProgress` for ATG: M1 is Blocked with `needsYou`, M2 is In progress, and M3 is Not started.
- `TimelineList` shows only the last two days, then 10, then all.

## Phase 5: The demo scenario

Shape `atgStory.ts` around what Cyprian asked for:

- **The start:** Milestone 1, "Get counsel's view", is **blocked by you**. Dana sent the memo, and the task is awaiting your review. Milestone 2 waits on it:
  - The agenda task is in progress.
  - The questionnaire waits on the approved text.
- **Clearing it:** there are three ways, all calling `confirmTaskDone`:
  - the status summary's "Confirm and close"
  - the M1 row's action
  - the chat reply "Got it"
- **After you clear it:**
  - M1 shows Done.
  - M2 is current.
  - The status summary's headline changes to the next thing that matters (Morgan's overdue reply).
  - A timeline entry records your confirmation.
- **Calendar:** the memo row's Review action goes to the workstream on M1, instead of opening the dialog.

**Tests:** extend `atgStory.test.ts` with an end-to-end story: blocked by you, then confirm, then the next state for the milestones and the summary.

---

## Order of work and commits

One commit per phase, each with tests passing and checked in the browser:

1. Phases 1 and 2 together, since links need the one page to land on.
2. Phase 3.
3. Phase 4.
4. Phase 5, plus a final browser pass of the full story.

## Decisions

Phases 1 and 2 shipped with these answers (Nov 4):

1. A new signal opens Cowork's draft on the workstream page. The draft isn't saved until you click "Start workstream", so it never puts tasks on the calendar or adds a workstream to the nav.
2. California and Cyber 8-K load as real workstreams, each with two milestones. The Workstreams nav lists them from the start.
3. "Revise via chat" is the button that's hidden.

Phase 3 (Nov 4):

4. The workstream summary is derived from its tasks (`workstreamAttention`) instead of stored, so it never goes stale. `Workstream.statusSummary` and `summarizeWorkstream` are gone. Task-level summaries are still strings for now.
5. "Waiting on others" means an overdue task or an owner who hasn't answered a follow-up. In ATG that's Morgan, whose website task isn't overdue yet; the headline moves to Morgan once you confirm the memo.
6. "Waiting on you" names who is held up: the owners of not-started tasks in the next milestone (Alex Kim, for the memo).

Phase 4 (Nov 4):

7. A milestone is Blocked when a task waits on your review (shown as "Needs you", with Confirm and close on the row) or a task is overdue (shown as Blocked, "Waiting on" its owner). It's In progress once any task has moved, so ATG's Milestone 4 reads In progress: Pete is already drafting the review process.
8. The owner shown is the open task with the nearest deadline, plus a count ("Morgan Diaz +1").
9. A row starts expanded when it needs you or a link points at it. "Show 10 more" adds 10 to the last two days; with nothing in the last two days it reads "Show the latest 10".

Phase 5 (Nov 4):

10. The milestone after one that needs you reads Blocked, "Waiting on you", while its owners haven't started (Alex, in Milestone 2). It's In progress once you confirm.
11. Confirming the memo applies the "share the draft" rule: Cowork tells Alex the text is approved and resumes follow-ups, and that shows on Milestone 2's timeline. The text itself comes from Peter, so counsel's privileged files never pass through Cowork.
12. Only a task waiting on your review can be confirmed, so a second click changes nothing.
13. The ATG agenda task stays Done (Alex booked the Dec 15 slot on Oct 29), rather than In progress as first planned. Milestone 2 waiting on you carries the point instead.

## Open questions

1. **A new signal: draft workstream page or signal dialog?** This plan creates a draft workstream and opens it on the one page, which matches the rule that every link goes to the workstream and keeps one mode. The other choice is to keep the signal dialog for new signals only.
2. **Past workstreams (California, Cyber 8-K).** Today they have no pages, and calendar clicks open their signal. The plan seeds them as real workstreams in the store, so their calendar tasks follow the same rule. The closed signals (FTC, exculpation, clawback) keep their chat cards with no drill-in.
3. **The "chat toggle button".** The plan reads this as "Revise via chat" on the workstream page, the button Joe called sloppy on the call. If there's another toggle in Cyprian's screenshot, it gets the same treatment.
4. **What to call "Plan".** Joe suggested it might not be called Plan. The working label is "Milestones".

---

## Follow-up (Nov 4): tasks replace milestones, two layouts

Joe's sketches and answers after Phase 5:

- **Milestones become the tasks.** A plan is a short list of big-picture tasks in deadline order. Each has an owner, CCs, a deadline, a status and **what done looks like** (a postcondition naming who confirms it). How each gets done is left to Cowork, the people involved and the plan's rules. Milestone rules merged into one rule list.
- **Five statuses:** Not started, In progress, Needs your review, Blocked (waiting on another unfinished task, `waitingOn`) and Done. Drafts show only the base status.
- **Two layouts, one page component.** Create: summary (what the signal is, why it matters, what Cowork suggests), Relevance and Source cards, the Plan card with "Done when" lines, Accept and start. View: status summary beside Artifacts, Tasks with status lines and "Open activity log" (a dialog), Relevance and Sources collapsed. Owners are editable in both; in View a change reassigns the task and Cowork emails the new owner.
- **Smart Brevity** is a Claude skill for writing this prototype's copy (`.claude/skills/smart-brevity/SKILL.md`), applied in spirit with no framework labels on screen.
- The ATG story is four tasks. Morgan's website follow-ups folded into Pete's "Adopt and disclose", so the ATG story no longer has an owner to nudge; Maya's overdue vendor pick in Climate disclosure readiness still shows Nudge.
