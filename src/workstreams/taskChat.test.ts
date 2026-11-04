import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { ATG_RULING } from "@/signals/signals";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "@/workstreams/workstreamStore";
import { handleTaskChatMessage, seedTaskChat, taskChatId } from "@/workstreams/taskChat";

const NOW = new Date("2026-11-03T12:00:00Z");
let WORKSTREAM_ID = "";
const task = () =>
  useWorkstreamStore.getState().getWorkstream(WORKSTREAM_ID)!.plan.tasks.find((t) => t.id === `${ATG_RULING.id}-website`)!;

beforeEach(() => {
  useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] });
  useChatMessagesStore.setState({ messagesByChatId: {} });
  WORKSTREAM_ID = useWorkstreamStore.getState().createWorkstream(draftWorkstreamFromSignal(ATG_RULING)).id;
});

test("a status question gets the status summary and leaves the thread alone", () => {
  const before = task().history.length;
  const reply = handleTaskChatMessage(WORKSTREAM_ID, task().id, "Where does this stand?", NOW);
  expect(reply).toMatch(/followed up on Oct 30 \(1 of 3\)/);
  expect(task().history).toHaveLength(before);
});

test("anything else is recorded in the thread and passed on to the owner", () => {
  const before = task().history.length;
  const reply = handleTaskChatMessage(WORKSTREAM_ID, task().id, "Please send the vendor list today.", NOW);
  expect(reply).toContain("Morgan Diaz");
  expect(task().history).toHaveLength(before + 2);
  expect(task().history[before]).toMatchObject({
    channel: "chat",
    authorRole: "delegator",
  });
});

test("the task chat opens with one welcome message that names the owner", () => {
  seedTaskChat(task());
  seedTaskChat(task());
  const messages = useChatMessagesStore.getState().messagesByChatId[taskChatId(task().id)];
  expect(messages).toHaveLength(1);
  const part = messages[0].parts[0];
  expect(part.type === "text" && part.text).toContain("Morgan");
});
