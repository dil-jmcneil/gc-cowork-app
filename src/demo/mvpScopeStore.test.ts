const KEY = "gc-cowork-show-post-mvp-views";

async function loadStore() {
  vi.resetModules();
  return (await import("@/demo/mvpScopeStore")).useMvpScopeStore;
}

beforeEach(() => localStorage.clear());

test("post-MVP views are hidden by default", async () => {
  expect((await loadStore()).getState().showPostMvpViews).toBe(false);
});

test("setShowPostMvpViews persists across reloads", async () => {
  const store = await loadStore();
  store.getState().setShowPostMvpViews(true);
  expect(localStorage.getItem(KEY)).toBe("true");
  expect((await loadStore()).getState().showPostMvpViews).toBe(true);
});

test("the Q4 MVP configuration is on by default", async () => {
  expect((await loadStore()).getState().q4Mvp).toBe(true);
});

test("turning the Q4 MVP configuration off persists across reloads", async () => {
  const store = await loadStore();
  store.getState().setQ4Mvp(false);
  expect(localStorage.getItem("gc-cowork-q4-mvp")).toBe("false");
  expect((await loadStore()).getState().q4Mvp).toBe(false);
});
