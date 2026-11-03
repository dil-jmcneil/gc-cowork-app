const KEY = "gc-cowork-show-plan-rules";

async function loadStore() {
  vi.resetModules();
  return (await import("@/demo/planRulesStore")).usePlanRulesStore;
}

beforeEach(() => localStorage.clear());

test("plan rules are hidden by default", async () => {
  expect((await loadStore()).getState().showRules).toBe(false);
});

test("setShowRules persists across reloads", async () => {
  const store = await loadStore();
  store.getState().setShowRules(true);
  expect(localStorage.getItem(KEY)).toBe("true");
  expect((await loadStore()).getState().showRules).toBe(true);
});

test("ignores junk in storage", async () => {
  localStorage.setItem(KEY, "yes please");
  expect((await loadStore()).getState().showRules).toBe(false);
});
