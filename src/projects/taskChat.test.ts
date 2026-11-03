import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { ATG_RULING } from "@/insights/insights";
import { draftProjectFromInsight } from "@/projects/projectDraft";
import { SEED_PROJECTS, useProjectStore } from "@/projects/projectStore";
import { handleTaskChatMessage, seedTaskChat, taskChatId } from "@/projects/taskChat";

const NOW = new Date("2026-11-03T12:00:00Z");
let PROJECT_ID = "";
const task = () =>
  useProjectStore.getState().getProject(PROJECT_ID)!.plan.tasks.find((t) => t.id === `${ATG_RULING.id}-website`)!;

beforeEach(() => {
  useProjectStore.setState({ projects: [...SEED_PROJECTS] });
  useChatMessagesStore.setState({ messagesByChatId: {} });
  PROJECT_ID = useProjectStore.getState().createProject(draftProjectFromInsight(ATG_RULING)).id;
});

test("a status question gets the status summary and leaves the thread alone", () => {
  const before = task().history.length;
  const reply = handleTaskChatMessage(PROJECT_ID, task().id, "Where does this stand?", NOW);
  expect(reply).toMatch(/Morgan hasn't replied/);
  expect(task().history).toHaveLength(before);
});

test("anything else is recorded in the thread and passed on to the owner", () => {
  const before = task().history.length;
  const reply = handleTaskChatMessage(PROJECT_ID, task().id, "Please send the vendor list today.", NOW);
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
