# GC Cowork

A prototype surface for a company's general counsel, built on the Atlas design system and the same stack as the generic supervisor chat surface ([d1-integrated](https://github.com/dil-jmcneil/d1-integrated)).

The first step covers:

- the Atlas shell, with a left nav for Home, New chat, and chat history
- a home page with the chat hero, three quick actions, and an attention pane
- a mocked chat that streams replies with reasoning and tool calls
- a scripted "Show recent regulatory changes" reply that renders compact regulatory change cards, each showing its project (with an AI status summary) or a Create project button
- Projects: a Create project screen that drafts the project and plan from a change, a project page, and a Projects section in the left nav

All chat responses are mocked client-side. There's no backend.

See `docs/superpowers/specs/2026-10-30-gc-home-foundation-design.md` for the design and `AGENTS.md` for the Atlas rules that apply to this repo.

## Run it

```bash
npm install
```

The install fetches `@diligentcorp/atlas-react-bundle` from atlas.diligent.com, so you need network access to it. A postinstall script patches the bundle's mock navigator so the app title reads "GC Cowork".

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

## Sign-in gate

The whole app sits behind a simple username/password form (`src/auth/LoginGate.tsx`), so you can deploy this prototype publicly without it showing up to random visitors or search engines. Credentials come from `VITE_AUTH_USERNAME` / `VITE_AUTH_PASSWORD` (see `.env`; defaults to `diligent` / `gcpersona`).

**This is not real security.** Vite inlines these env vars into the client bundle at build time, so the password is visible to anyone who inspects the deployed JavaScript. It only keeps the demo from being casually stumbled on. For a real deployment, set different values via your hosting provider's environment settings rather than committing production credentials, and don't use this as the only thing standing between the app and sensitive data.

Once signed in, the browser remembers it (`localStorage`) until you clear site data — the same lightweight pattern used for the theme toggle below.

## Theme toggle

The lightbulb button in the bottom-right corner opens demo settings, where you can switch between the **Default** and **Refreshed** looks. The choice is saved in localStorage under `gc-cowork-theme-variant`.
