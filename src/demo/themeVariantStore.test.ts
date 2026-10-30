const KEY = "gc-cowork-theme-variant";

async function loadStore() {
  vi.resetModules();
  return (await import("@/demo/themeVariantStore")).useThemeVariantStore;
}

beforeEach(() => localStorage.clear());

test("defaults to current", async () => {
  const store = await loadStore();
  expect(store.getState().variant).toBe("current");
});

test("setVariant persists under gc-cowork-theme-variant", async () => {
  const store = await loadStore();
  store.getState().setVariant("refreshed");
  expect(store.getState().variant).toBe("refreshed");
  expect(localStorage.getItem(KEY)).toBe("refreshed");
  expect((await loadStore()).getState().variant).toBe("refreshed");
});

test("ignores junk in storage", async () => {
  localStorage.setItem(KEY, "purple");
  const store = await loadStore();
  expect(store.getState().variant).toBe("current");
});
