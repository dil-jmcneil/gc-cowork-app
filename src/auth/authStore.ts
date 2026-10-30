import { create } from "zustand";

import { checkCredentials } from "./credentials";

const STORAGE_KEY = "gc-cowork-authenticated";

function readPersisted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

type AuthState = {
  isAuthenticated: boolean;
  /** Returns true and signs in on a match; returns false otherwise. */
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: readPersisted(),
  login: (username, password) => {
    const ok = checkCredentials(username, password);
    if (ok) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* ignore quota or privacy errors */
      }
      set({ isAuthenticated: true });
    }
    return ok;
  },
  logout: () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore quota or privacy errors */
    }
    set({ isAuthenticated: false });
  },
}));
