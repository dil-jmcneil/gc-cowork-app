import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "@/workstreams/workstreamStore";
import { ATG_RULING, SIGNALS } from "@/signals/signals";

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

test("only the past workstreams exist until the GC starts one", () => {
  const { getWorkstreamForSignal } = useWorkstreamStore.getState();
  for (const signal of SIGNALS) {
    if (signal.pastWorkstream) expect(getWorkstreamForSignal(signal.id)?.name).toBe(signal.pastWorkstream.name);
    else expect(getWorkstreamForSignal(signal.id)).toBeUndefined();
  }
});

test("createWorkstream stores the workstream and links it to its change", () => {
  const draft = {
    ...draftWorkstreamFromSignal(ATG_RULING),
    name: "Advance notice bylaw update",
  };
  const workstream = useWorkstreamStore.getState().createWorkstream(draft);
  expect(workstream.name).toBe("Advance notice bylaw update");
  expect(workstream.statusSummary.length).toBeGreaterThan(0);
  expect(useWorkstreamStore.getState().getWorkstreamForSignal(ATG_RULING.id)).toBe(workstream);
  expect(useWorkstreamStore.getState().getWorkstream(workstream.id)).toBe(workstream);
});

test("createWorkstream falls back to the change title when the name is blank", () => {
  const draft = { ...draftWorkstreamFromSignal(ATG_RULING), name: "   " };
  expect(useWorkstreamStore.getState().createWorkstream(draft).name).toBe(ATG_RULING.title);
});

test("acceptPlan marks the plan accepted", () => {
  const workstream = useWorkstreamStore.getState().createWorkstream(draftWorkstreamFromSignal(ATG_RULING));
  useWorkstreamStore.getState().acceptPlan(workstream.id);
  expect(useWorkstreamStore.getState().getWorkstream(workstream.id)!.plan.status).toBe("accepted");
});

describe("task actions", () => {
  let WORKSTREAM_ID = "";
  beforeEach(() => {
    WORKSTREAM_ID = useWorkstreamStore.getState().createWorkstream(draftWorkstreamFromSignal(ATG_RULING)).id;
  });
  const firstTask = () => useWorkstreamStore.getState().getWorkstream(WORKSTREAM_ID)!.plan.tasks[0];

  test("assignTask changes the owner and emails the new one", () => {
    const jordan = {
      id: "jordan.lee@acme.com",
      label: "Jordan Lee",
      detail: "Privacy counsel",
      kind: "directory" as const,
    };
    useWorkstreamStore.getState().assignTask(WORKSTREAM_ID, firstTask().id, jordan);
    const task = firstTask();
    expect(task.delegate.label).toBe("Jordan Lee");
    const last = task.history[task.history.length - 1];
    expect(last).toMatchObject({
      authorRole: "cowork",
      channel: "email",
      to: ["Jordan Lee"],
    });
  });

  test("setTaskStatus updates the status and records it as an action in the history", () => {
    useWorkstreamStore.getState().setTaskStatus(WORKSTREAM_ID, firstTask().id, "Done");
    const task = firstTask();
    expect(task.status).toBe("Done");
    expect(task.history[task.history.length - 1]).toMatchObject({ kind: "action", actor: "Peter", summary: "Set the status to Done" });
  });

  test("nudgeTask sends the owner a reminder email", () => {
    const before = firstTask().history.length;
    useWorkstreamStore.getState().nudgeTask(WORKSTREAM_ID, firstTask().id);
    const task = firstTask();
    expect(task.history).toHaveLength(before + 1);
    expect(task.history[before]).toMatchObject({
      authorRole: "cowork",
      channel: "email",
    });
    expect(task.history[before].body).toMatch(/reminder|following up/i);
  });

  test("messageDelegate sends the owner an email on Peter's behalf", () => {
    useWorkstreamStore.getState().messageDelegate(WORKSTREAM_ID, firstTask().id, "Can you send the list today?");
    const last = firstTask().history.at(-1)!;
    expect(last).toMatchObject({ authorRole: "cowork", channel: "email" });
    expect(last.body).toContain("Can you send the list today?");
  });

  test("addChatNote records Peter's chat message, then Cowork passes it on by email", () => {
    const before = firstTask().history.length;
    useWorkstreamStore.getState().addChatNote(WORKSTREAM_ID, firstTask().id, "Loop in legal ops too.");
    const task = firstTask();
    expect(task.history[before]).toMatchObject({
      authorRole: "delegator",
      channel: "chat",
      body: "Loop in legal ops too.",
    });
    expect(task.history[before + 1]).toMatchObject({
      authorRole: "cowork",
      channel: "email",
    });
  });
});
