# GC Cowork

A prototype surface for a company's general counsel, built on the Atlas design system and the same stack as the generic supervisor chat surface ([d1-integrated](https://github.com/dil-jmcneil/d1-integrated)).

The first step covers:

- the Atlas shell, with a left nav for Home, New chat, and chat history
- a home page with the chat hero, three quick actions, and an attention pane
- a mocked chat that streams replies with reasoning and tool calls
- a scripted "Show recent regulatory changes" reply that renders regulatory change cards

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

## Theme toggle

The lightbulb button in the bottom-right corner opens demo settings, where you can switch between the **Default** and **Refreshed** looks. The choice is saved in localStorage under `gc-cowork-theme-variant`.
