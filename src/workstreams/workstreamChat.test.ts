import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { ATG_RULING } from "@/signals/signals";

import { workstreamAttention } from "./workstreamAttention";
import { summaryText } from "./summary";
import { handleWorkstreamChatMessage, seedWorkstreamChat, workstreamChatId } from "./workstreamChat";
import { draftWorkstreamFromSignal } from "./workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "./workstreamStore";

const NOW = new Date("2026-11-03T12:00:00Z");

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

function startAtgWorkstream() {
  const draft = draftWorkstreamFromSignal(ATG_RULING);
  return useWorkstreamStore.getState().createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } });
}

const memoOf = (id: string) =>
  useWorkstreamStore
    .getState()
    .getWorkstream(id)!
    .plan.tasks.find((t) => t.id.endsWith("-counsel"))!;

test("asking what's waiting on you names the memo, and how to close it", () => {
  const { id } = startAtgWorkstream();
  const reply = handleWorkstreamChatMessage(id, "What's waiting on me?", NOW);
  expect(reply).toMatch(/Dana sent the memo/);
  expect(reply).toMatch(/memo/i);
  expect(reply).toMatch(/Got it/);
});

test('"Got it" closes the memo while it waits on your review', () => {
  const { id } = startAtgWorkstream();
  const reply = handleWorkstreamChatMessage(id, "Got it, the memo looks good", NOW);
  expect(reply).toMatch(/closed/);
  expect(memoOf(id)).toMatchObject({ status: "Done", awaitingReview: false });
  expect(handleWorkstreamChatMessage(id, "What's waiting on me?", NOW)).toMatch(/Nothing/);
});

test("asking to remove a task edits the plan", () => {
  const { id } = startAtgWorkstream();
  const reply = handleWorkstreamChatMessage(id, "Remove task 4 and add its closing action to 3", NOW);
  expect(reply).toMatch(/Task 4/);
  expect(useWorkstreamStore.getState().getWorkstream(id)!.plan.tasks).toHaveLength(3);
});

test("a status question gets the workstream's status summary", () => {
  const workstream = startAtgWorkstream();
  expect(handleWorkstreamChatMessage(workstream.id, "Where does this stand?", NOW)).toBe(
    summaryText(workstreamAttention(workstream, NOW).summary),
  );
});

test("asking why it matters lists the relevance points", () => {
  const { id } = startAtgWorkstream();
  expect(handleWorkstreamChatMessage(id, "Is this actually relevant to us?", NOW)).toContain(
    ATG_RULING.reasonsRelevant[0],
  );
});

test("anything else falls through to Cowork's usual reply", () => {
  const { id } = startAtgWorkstream();
  expect(handleWorkstreamChatMessage(id, "Thanks", NOW)).toBeUndefined();
});

test("the chat opens with the status summary's headline, once", () => {
  const workstream = startAtgWorkstream();
  seedWorkstreamChat(workstream, NOW);
  seedWorkstreamChat(workstream, NOW);
  const messages = useChatMessagesStore.getState().messagesByChatId[workstreamChatId(workstream)];
  expect(messages).toHaveLength(1);
  expect(JSON.stringify(messages[0])).toContain("Review Dana's memo");
});
