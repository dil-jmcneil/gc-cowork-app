import { checkCredentials } from "@/auth/credentials";

const ENV = { VITE_AUTH_USERNAME: "diligent", VITE_AUTH_PASSWORD: "gcpersona" };

test("accepts the configured username and password", () => {
  expect(checkCredentials("diligent", "gcpersona", ENV)).toBe(true);
});

test("rejects a wrong password", () => {
  expect(checkCredentials("diligent", "wrong", ENV)).toBe(false);
});

test("rejects a wrong username", () => {
  expect(checkCredentials("someone", "gcpersona", ENV)).toBe(false);
});

test("trims surrounding whitespace but stays case-sensitive", () => {
  expect(checkCredentials(" diligent ", " gcpersona ", ENV)).toBe(true);
  expect(checkCredentials("Diligent", "gcpersona", ENV)).toBe(false);
});

test("rejects everything when the env vars aren't configured", () => {
  expect(checkCredentials("diligent", "gcpersona", {})).toBe(false);
});
