import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { SEED_PROJECTS, useProjectStore } from "@/projects/projectStore";
import { handleTaskChatMessage, seedTaskChat, taskChatId } from "@/projects/taskChat";

const PROJECT_ID = "project-cppa-automated-decisions";
const NOW = new Date("2026-10-30T12:00:00Z");
const task = () => useProjectStore.getState().getProject(PROJECT_ID)!.plan.tasks[0];

beforeEach(() => {
  useProjectStore.setState({ projects: [...SEED_PROJECTS] });
  useChatMessagesStore.setState({ messagesByChatId: {} });
});

test("a status question gets the status summary and leaves the thread alone", () => {
  const before = task().thread.length;
  const reply = handleTaskChatMessage(PROJECT_ID, task().id, "Where does this stand?", NOW);
  expect(reply).toMatch(/Past due/);
  expect(task().thread).toHaveLength(before);
});

test("anything else is recorded in the thread and passed on to the owner", () => {
  const before = task().thread.length;
  const reply = handleTaskChatMessage(PROJECT_ID, task().id, "Please send the vendor list today.", NOW);
  expect(reply).toContain("Priya Natarajan");
  expect(task().thread).toHaveLength(before + 2);
  expect(task().thread[before]).toMatchObject({ channel: "chat", authorRole: "delegator" });
});

test("the task chat opens with one welcome message that names the owner", () => {
  seedTaskChat(task());
  seedTaskChat(task());
  const messages = useChatMessagesStore.getState().messagesByChatId[taskChatId(task().id)];
  expect(messages).toHaveLength(1);
  const part = messages[0].parts[0];
  expect(part.type === "text" && part.text).toContain("Priya");
});
