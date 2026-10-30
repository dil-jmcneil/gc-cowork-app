/** The subset of import.meta.env this checks against; passed in for easy testing. */
export type AuthEnv = {
  VITE_AUTH_USERNAME?: string;
  VITE_AUTH_PASSWORD?: string;
};

/** True when `username`/`password` match the configured gate credentials. */
export function checkCredentials(
  username: string,
  password: string,
  env: AuthEnv = import.meta.env,
): boolean {
  const { VITE_AUTH_USERNAME, VITE_AUTH_PASSWORD } = env;
  if (!VITE_AUTH_USERNAME || !VITE_AUTH_PASSWORD) return false;
  return username.trim() === VITE_AUTH_USERNAME && password.trim() === VITE_AUTH_PASSWORD;
}
