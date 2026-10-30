import { useAuthStore } from "@/auth/authStore";

const KEY = "gc-cowork-authenticated";
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ isAuthenticated: false });
});

test("starts signed out", async () => {
  vi.resetModules();
  const { useAuthStore: store } = await import("@/auth/authStore");
  expect(store.getState().isAuthenticated).toBe(false);
});

test("login with the right credentials signs in and persists", () => {
  expect(useAuthStore.getState().login("diligent", "gcpersona")).toBe(true);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(localStorage.getItem(KEY)).toBe("true");
});

test("login with the wrong credentials fails and stays signed out", () => {
  expect(useAuthStore.getState().login("diligent", "nope")).toBe(false);
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test("a previously signed-in session stays signed in on reload", async () => {
  localStorage.setItem(KEY, "true");
  vi.resetModules();
  const { useAuthStore: store } = await import("@/auth/authStore");
  expect(store.getState().isAuthenticated).toBe(true);
});
