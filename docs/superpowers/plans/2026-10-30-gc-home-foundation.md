# GC Cowork Home Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blank Vite scaffold in `gc-cowork-app` with an Atlas-based GC Cowork shell. It has a home page (chat hero, three quick actions, and a one-item attention pane), working mocked chat with history, a scripted "recent regulatory changes" reply, and a Default/Refreshed theme toggle.

**Architecture:** Port a trimmed subset of d1-integrated: the Atlas `AppLayout` shell and side nav, the zustand chat stores, the mock streaming runtime, and the Atlas chat rendering. Strip every workflow, boards, demo-seed and q2 branch. Add one new structured chat part, `regulatory-change-list`, rendered as cards. Unit tests cover the pure logic: stores, stream folding, prompt routing, and the scripted stream. Pages and visuals are checked in the browser preview.

**Tech Stack:**
- Vite 7, React 19, TypeScript 5
- `@diligentcorp/atlas-react-bundle` (https tgz), MUI 7 + Emotion
- react-router 7, zustand 5
- Vitest + jsdom (new, for the logic tests)

**Spec:** `docs/superpowers/specs/2026-10-30-gc-home-foundation-design.md`. Read it before starting.

**Reference source:** `D1` = `/Users/jmcneil/Projects/d1-integrated`. It's read-only; never edit it. "Port `D1/src/x.ts`" means copy the file into the same relative path here, then apply only the listed changes and delete whatever then dangles: imports, props, and branches for excluded features.

## Global Constraints

- **Stack:** match d1-integrated. Keep `<AppLayout>` from `@diligentcorp/atlas-react-bundle` at the root, and `AtlasThemeProvider tokenMode="atlas-light"` in `main.tsx`.
- **Imports:**
  - components and utilities from `@diligentcorp/atlas-react-bundle`
  - icons from `@diligentcorp/atlas-react-bundle/icons/<Name>`
  - the `@` alias points to `src`
- **Styling:** custom styles only through `sx`, with design tokens. No font size below `textSm`.
- **Copy:** sentence case, friendly and concise (Microsoft style guide).
- **No dead code:** no assistant-ui, Tailwind, remark, shadcn/radix, tiptap, xyflow, pdf-lib, or `@mui/x-chat`, and none of their files. Nothing related to workflows, boards, library, agents, skills, settings, calendar, the studio user-type FAB, q2 or classic home, legacy, case or demo seed chats, or workflow deep links.
- **Persona:** `LOGGED_IN_USER = { firstName: "Peter", fullName: "Peter" }`.
- **App title** in the nav: **"GC Cowork"**.
- **Theme toggle:** both variants, `current` (Default) and `refreshed` (Refreshed). The localStorage key is `gc-cowork-theme-variant`.
- **Atlas MCP:** use `get_atlas_component_docs` when choosing or using Atlas components, for example Card, Chip, Status indicator, AI chat content, and Typography.
- **Git remote:** `git@github-diligent:dil-jmcneil/gc-cowork-app.git`. Commit after each task. Don't push unless the user asks.

## Review Focus

1. **The "Research a regulation" and "See what's due" quick actions must not trigger the regulatory changes list.** The first one's prompt contains "regulation". Covered by the Task 4 test `does not match other quick actions`.
2. **React StrictMode runs effects twice, which could duplicate the opening user message or reply.** A new chat must show exactly one user message and one streamed reply. Covered by the Task 3 test `initializeChatSession is idempotent`.
3. **Whitespace-only prompts from the home composer or the New chat composer** must not create a chat or a history entry. Covered by the Task 3 test `startChatFromPrompt ignores blank`.
4. **Very long opening prompts** must give a history label truncated to 80 characters with "…". Covered by the Task 3 test `deriveTitleFromPrompt truncates`.
5. **Reloading on `/chats/:id`:** the store lives in memory, so the chat is gone. The page shows "Chat not found" with a link home rather than crashing. Covered by the Task 6 browser step.

---

### Task 1: Project setup on the d1 stack

**Files:**
- Delete: the `create-vite` leftovers `src/App.css`, `src/index.css`, `src/assets/{hero.png,react.svg,vite.svg}`, `public/icons.svg`, `.oxlintrc.json`
- Modify: `package.json`, `vite.config.ts`, `tsconfig.app.json`, `index.html`, `README.md`, `.gitignore`
- Create: `AGENTS.md`, `scripts/patch-atlas-mock-navigator.mjs`, `public/acme-logo.png`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/user.ts`, `src/global.d.ts`, `src/vite-env.d.ts`, `vitest.config.ts`, `src/smoke.test.ts`

**Interfaces:**
- Produces:
  - `npm run dev | build | test`
  - the `@/…` alias
  - `LOGGED_IN_USER` from `@/user`

- [ ] **Step 1: Set up `package.json`**
  - Name: `gc-cowork-app`
  - Scripts:
    - `dev: vite`
    - `build: tsc -b && vite build`
    - `preview: vite preview`
    - `test: vitest run`
    - `postinstall: node scripts/patch-atlas-mock-navigator.mjs`
  - Dependencies: the Atlas bundle URL plus every one of its peer dependencies, at D1's versions:
    - `@emotion/cache`, `@emotion/react`, `@emotion/styled`, `@hello-pangea/dnd`, `@lit/react`, `lit`
    - `@mui/material`, `@mui/system`, `@mui/utils`, `@mui/icons-material`
    - `@mui/x-data-grid`, `@mui/x-data-grid-pro`, `@mui/x-date-pickers`, `@mui/x-date-pickers-pro`, `@mui/x-license`, `@mui/x-tree-view`
    - `react`, `react-dom`, `react-router`, `zustand`, `tslib`
  - Dev dependencies:
    - D1's `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`
    - plus `vitest` and `jsdom`
  - Add `package-lock.json` to `.gitignore`, matching D1's AGENTS.md.

- [ ] **Step 2: Copy the D1 config files with changes**
  - `vite.config.ts`: D1's, without the Tailwind plugin.
  - `tsconfig.app.json`: add `"paths": {"@/*": ["./src/*"]}`, plus whatever `baseUrl` D1 uses.
  - `vitest.config.ts`: `environment: "jsdom"`, with the same `@` alias.
  - `index.html`: title "GC Cowork".

- [ ] **Step 3: Copy `D1/AGENTS.md`**
  - Keep the Atlas, styling, typography, layout, writing-style and import-path sections.
  - Add one line saying this repo is GC Cowork, scoped by the spec above.

- [ ] **Step 4: Port `D1/scripts/patch-atlas-mock-navigator.mjs`**
  - Relabel the app to `"GC Cowork"` instead of "Pulse".
  - Drop the Boards "My apps" patch.
  - Keep the cache-busting step.
  - If the bundle can't be relabeled cleanly, keep the default label and add a one-line note to `README.md`.

- [ ] **Step 5: Write the minimal app files**
  - `src/main.tsx`: same as D1.
  - `src/App.tsx`: renders `<AppLayout orgName="Acme Co, Inc." logo="/acme-logo.png" userFullName={LOGGED_IN_USER.fullName}>` with a `Typography` saying "GC Cowork".
  - `src/styles.css`: only D1's two Atlas `@import` lines and the `.AtlasPrototypeAppLayout` background override for now.
  - `src/user.ts`: Peter.
  - Copy `public/acme-logo.png`, `src/global.d.ts` and `src/vite-env.d.ts` from D1.

- [ ] **Step 6: Write `src/smoke.test.ts`**
  ```ts
  import { LOGGED_IN_USER } from "@/user";
  test("alias resolves", () => expect(LOGGED_IN_USER.firstName).toBe("Peter"));
  ```

- [ ] **Step 7: Install, test, and build**
  - Run: `npm install && npm test && npm run build`
  - Expected: the install fetches the Atlas tgz (needs network access to atlas.diligent.com), the patch script logs success, 1 test passes, and the build succeeds.

- [ ] **Step 8: Check in the browser preview**
  - Add a `.claude/launch.json` entry named `gc-cowork-app` that runs `npm run dev` on port 5173.
  - Start it with `preview_start` and check the page for the Atlas top nav and "GC Cowork" with no console errors.

- [ ] **Step 9: Commit**
  - Message: `chore: set up Atlas prototype stack for GC Cowork`

---

### Task 2: Theme variant store, refreshed tokens, and the demo settings toggle

**Files:**
- Create:
  - `src/demo/themeVariantStore.ts` (port)
  - `src/demo/themeVariantStore.test.ts`
  - `src/components/demo/DemoSettingsFab.tsx` (port)
  - `src/components/demo/DemoSettingsDialog.tsx` (port)
  - `src/components/demo/DemoSettingsCardOption.tsx` (port)
  - `src/assets/refreshed/*` (all six files from D1)
- Modify: `src/styles.css` (append D1's `@font-face` rules and `.refreshed-tokens` blocks), `src/App.tsx`

**Interfaces:**
- Produces:
  - `type ThemeVariant = "current" | "refreshed"`
  - `useThemeVariantStore` with `{ variant: ThemeVariant; setVariant(v: ThemeVariant): void }`
  - `<DemoSettingsFab />`

- [ ] **Step 1: Write the failing test**
  ```ts
  test("defaults to current", ...)                  // localStorage empty → variant "current"
  test("setVariant persists under gc-cowork-theme-variant", ...)
      // setVariant("refreshed") → localStorage.getItem("gc-cowork-theme-variant") === "refreshed"
  test("ignores junk in storage", ...)              // stored "purple" → re-import (vi.resetModules) → "current"
  ```

- [ ] **Step 2: Run the test to confirm it fails**
  - Run: `npx vitest run src/demo/themeVariantStore.test.ts`
  - Expected: FAIL, module not found.

- [ ] **Step 3: Port `themeVariantStore.ts`**
  - Change only the storage key, to `gc-cowork-theme-variant`.

- [ ] **Step 4: Run the test to confirm it passes**
  - Run: `npx vitest run src/demo/themeVariantStore.test.ts`
  - Expected: PASS (3 tests).

- [ ] **Step 5: Port the demo settings components**
  - `DemoSettingsDialog`: only the theme section (Default vs Refreshed cards) survives. Remove the version and q2 sections and the `demoSettingsStore` usage. Don't port `demoSettingsStore`.
  - Port `DemoSettingsFab` and `DemoSettingsCardOption` as-is.

- [ ] **Step 6: Update `App.tsx`**
  - Add D1's `useThemeVariantBodyClass`.
  - Render `<DemoSettingsFab />` inside `AppLayout`.

- [ ] **Step 7: Check in the browser preview**
  - Clicking the FAB opens the dialog.
  - Picking Refreshed adds the `refreshed-tokens` class to `body` and changes the shell background.
  - The choice survives a reload.

- [ ] **Step 8: Commit**
  - Message: `feat: add Default/Refreshed theme toggle`

---

### Task 3: Chat core (types, stores, streaming runtime, generic mock reply)

**Files** (all under `src/`):
- Create, porting from D1:
  - `chat/chatTypes.ts`, `chat/chatMessageUtils.ts`, `chat/chatMessagesStore.ts`, `chat/chatStore.ts`, `chat/startChat.ts`
  - `chat/scenarios/streamHelpers.ts`, `chat/mockChatAdapter.ts`
  - `runtime/streamAssistantMessage.ts`, `runtime/useChatRuntime.ts`, `runtime/useChatSession.ts`
- Create, new:
  - `regulatory/regulatoryChange.ts` (type only; Task 4 adds data)
  - `chat/chatStore.test.ts`, `runtime/streamAssistantMessage.test.ts`, `runtime/useChatSession.test.ts`

**Interfaces:**
- Produces:
  - **`chatTypes.ts`:** D1's types without `ChatWorkflowStartedPart`, plus:
    ```ts
    export type ChatRegulatoryChangeListPart = { type: "regulatory-change-list"; items: RegulatoryChange[] };
    // add to ChatPart; add to ChatStreamChunk:
    | { type: "regulatory-change-list"; items: RegulatoryChange[] }
    ```
  - **`regulatory/regulatoryChange.ts`:**
    ```ts
    export type RegulatoryChangeStatus = "New" | "In review" | "Upcoming";
    export type RegulatoryDeadline = { label: string; date: string /* ISO yyyy-mm-dd */ };
    export type RegulatoryChange = {
      id: string; title: string; summary: string; regulatoryBody: string;
      effectiveDate: string /* ISO */; status: RegulatoryChangeStatus;
      deadlines: RegulatoryDeadline[]; reasonsRelevant: string[];
    };
    ```
  - **`chatStore.ts`:**
    - `ChatRecord = { id; title; initialUserText?; threadInitialized: boolean; createdAt: Date; lastActivity: Date; preview: string }`
    - `useChatStore` with `chats` (starts `[]`), `activeChatId`, `createChat({ initialUserText? }): ChatRecord`, `setActiveChatId`, `getChat`, `updateChat`, `touchChat`
    - `export function deriveTitleFromPrompt(prompt: string): string` (D1's logic, now exported)
    - `DEFAULT_CHAT_PREVIEW`
    - Remove scenario, workflow, appointment, `actionRequired` and `suppressNextRun` fields, and the seeds. An empty prompt gives the title "New chat".
  - **`startChat.ts`:** `startChatFromPrompt(prompt: string, navigate: NavigateFunction): ChatRecord | null`
  - **`mockChatAdapter.ts`:** `streamMockReply(promptText: string, signal: AbortSignal): AsyncGenerator<ChatStreamChunk>`. Task 4 adds the regulatory branch; for now it gives the generic reply only.
  - **`useChatSession.ts`:**
    - `export function initializeChatSession(chatId: string): void` (pure, testable)
    - `useChatSession(chatId?: string)`, which calls it in an effect

- [ ] **Step 1: Write the failing tests**
  ```ts
  // chat/chatStore.test.ts
  test("createChat derives sentence-case title and preview", ...)
      // createChat({initialUserText:"show recent regulatory changes."}) → title "Show recent regulatory changes", preview = text, chats[0] is it
  test("deriveTitleFromPrompt truncates", ...)      // 120-char prompt → length 80, ends with "…"
  test("startChatFromPrompt ignores blank", ...)    // ("   ", navigateSpy) → null, chats.length unchanged, navigate not called
  test("startChatFromPrompt navigates to chat", ...) // navigate called with `/chats/${chat.id}`

  // runtime/streamAssistantMessage.test.ts — feed a hand-written async generator
  test("folds reasoning, tool lifecycle, text, and regulatory list into parts", ...)
      // chunks: reasoning-summary, reasoning-delta×2, tool-start{id:"t1"}, tool-update{id:"t1",status:"success"},
      //         text-delta×2, regulatory-change-list{items:[x]}, finish
      // → final message parts types === ["reasoning","tool","text","regulatory-change-list"], tool.status "success", status "done"

  // runtime/useChatSession.test.ts
  test("initializeChatSession is idempotent", ...)
      // chat with initialUserText; call initializeChatSession twice; await stream drain (vi.useFakeTimers + runAllTimersAsync)
      // → messages: exactly 1 user + 1 assistant; assistant status "done"
  test("empty chat gets welcome message", ...)      // no initialUserText → 1 assistant message, 0 user
  ```

- [ ] **Step 2: Run the tests to confirm they fail**
  - Run: `npm test`
  - Expected: FAIL, modules not found.

- [ ] **Step 3: Port the chat files**
  - Port D1's files with the trims above.
  - `streamAssistantMessage`: add a `case "regulatory-change-list"` that pushes `{ type: "regulatory-change-list", items }`.
  - `chatMessagesStore`: drop the seeds.
  - `mockChatAdapter.ts`: keep only `streamText`, a GC `buildGenericReply`, and `streamMockReply`, which wraps everything in try/catch and yields `finish` or `abort`.
    - Generic reply copy: `I looked into "${trimmed}". This is a mocked reply for now. Try "Show recent regulatory changes" to see what Cowork can do.`
    - Blank prompt: D1's "I didn't catch that" line.
  - `useChatSession.ts`: rewrite it around `initializeChatSession`.
    - Guard with `chat.threadInitialized` and set it `true` synchronously before streaming.
    - If there's `initialUserText`: append the user message, append a streaming assistant message, and run `streamAssistantMessage(chatId, id, streamMockReply(text, signal), signal)`. This is the gap in D1, where generic opening prompts got no reply.
    - Otherwise: append the welcome message, reworded for GC: "Hi, I'm Cowork. I can track regulatory changes, research rules, and keep an eye on what's due. What would you like to work on?"

- [ ] **Step 4: Run the tests to confirm they pass**
  - Run: `npm test`
  - Expected: all PASS.

- [ ] **Step 5: Commit**
  - Message: `feat: port chat stores and mock streaming runtime`

---

### Task 4: Regulatory changes data and scripted stream

**Files:**
- Create:
  - `src/regulatory/regulatoryChanges.ts` (fixtures)
  - `src/home/quickActionPrompts.ts`
  - `src/chat/scenarios/regulatoryChangesScenario.ts`
  - `src/chat/scenarios/regulatoryChangesScenario.test.ts`
- Modify: `src/chat/mockChatAdapter.ts`

**Interfaces:**
- Consumes: `RegulatoryChange` (Task 3), `streamReasoning` and `streamText` from `streamHelpers`, `ChatStreamChunk`
- Produces:
  - `REGULATORY_CHANGES: RegulatoryChange[]` (5 items)
  - `CYBER_RULE_CHANGE: RegulatoryChange` (equal to `REGULATORY_CHANGES[0]`)
  - In `src/home/quickActionPrompts.ts`:
    - `SHOW_REGULATORY_CHANGES_PROMPT = "Show me recent regulatory changes that affect us."`
    - `DUE_SOON_PROMPT = "What's due in the next two weeks?"`
    - `RESEARCH_REGULATION_PROMPT = "Help me research a regulation. Pull the current text and trace recent amendments."`
  - `isRegulatoryChangesPrompt(text: string): boolean`
  - `streamRegulatoryChanges(signal: AbortSignal, charDelayMs?: number): AsyncGenerator<ChatStreamChunk>`

- [ ] **Step 1: Write the failing tests**
  ```ts
  test("matches quick action and free-text asks", ...)
      // true for SHOW_REGULATORY_CHANGES_PROMPT, "what are the latest regulatory changes?",
      //          "any new rule changes this month", "recent regulatory updates"
  test("does not match other quick actions", ...)
      // false for RESEARCH_REGULATION_PROMPT, DUE_SOON_PROMPT, "help me research a regulation", "review a contract"
  test("first change is the SEC cyber rule", ...)
      // REGULATORY_CHANGES.length === 5; [0].title === "New cyber-attack reporting rule"; [0].regulatoryBody === "SEC";
      // [0].status === "New"; [0].summary === <spec summary verbatim>; every item has ≥1 deadline and ≥1 reason
  test("streams reasoning, then resolving tools, then intro, then the list", ...)
      // collect chunks with charDelayMs 0 → order of first-seen types:
      // reasoning-summary, reasoning-delta, tool-start, tool-update, text-delta, regulatory-change-list;
      // 3 tool-starts, each followed later by a tool-update with same id and status "success";
      // list chunk items === REGULATORY_CHANGES; last chunk is the list (adapter adds finish)
  ```

- [ ] **Step 2: Run the tests to confirm they fail**
  - Run: `npx vitest run src/chat/scenarios/regulatoryChangesScenario.test.ts`
  - Expected: FAIL.

- [ ] **Step 3: Write the fixtures**
  - `REGULATORY_CHANGES[0]`:
    - id `sec-cyber-8k-105`
    - title `New cyber-attack reporting rule`
    - regulatoryBody `SEC`
    - status `New`
    - summary verbatim: "The SEC tightened its cyber rule. A company must now report a material cyber-attack on Form 8-K, under Item 1.05, within four business days after it decides that the attack is material."
    - deadlines: `[{ label: "File Form 8-K, Item 1.05", date: <4 business days after a fixed materiality date> }]`
    - reasonsRelevant: `["Incident Response Plan §4.2 sets the same four-business-day window", "You file 8-Ks with the SEC"]`
  - Items 1–4: plausible and made up, one each from FINRA, the EU Commission, a US state privacy regulator, and the DOJ or FTC. Mix the `In review` and `Upcoming` statuses. Use fixed ISO dates.

- [ ] **Step 4: Write `regulatoryChangesScenario.ts`**
  - `isRegulatoryChangesPrompt`: a case-insensitive match that needs both a change word (`change|changes|update|updates|new`) and a rule word (`regulatory|regulation|regulations|rule|rules`). It must exclude prompts that contain `research`.
  - The stream, in order:
    1. `streamReasoning("Checking recent rule changes against your policies", <1–2 sentences>, …)`
    2. Three tools, each `tool-start` → `sleep(~600ms)` → `tool-update success` with a `detail` line:
       - `Searching SEC and Federal Register updates` (`web_search`)
       - `Reading final rule text` (`web_fetch`)
       - `Checking your policy library` (`arca`)
    3. `streamText("Here are the recent regulatory changes that affect you, newest first.")`
    4. `{ type: "regulatory-change-list", items: REGULATORY_CHANGES }`
  - Tool sleeps use `charDelayMs === 0 ? 0 : 600`, so the tests run instantly.

- [ ] **Step 5: Branch in `streamMockReply`**
  - If `isRegulatoryChangesPrompt(promptText)`, run `yield* streamRegulatoryChanges(signal)` before `finish`.
  - Otherwise, use the generic reply.

- [ ] **Step 6: Run the tests to confirm they pass**
  - Run: `npm test`
  - Expected: all PASS.

- [ ] **Step 7: Commit**
  - Message: `feat: add scripted regulatory changes reply`

---

### Task 5: Shell, side nav, and routes

**Files:**
- Create, porting from D1:
  - `src/configureAtlasPrototypeNav.ts`, `src/CommandCenterNavigation.tsx`, `src/commandCenterNavLayout.ts`
  - `src/styles/statusTag.ts` (only if still imported after trimming)
  - `src/components/PageLayout.tsx`
- Create, new: placeholder `src/pages/IndexPage.tsx`, `src/pages/NewChatPage.tsx` and `src/pages/ChatPage.tsx` (Tasks 6 and 7 replace these)
- Modify: `src/App.tsx`, `src/styles.css` (append any D1 nav rules the trimmed nav still needs)

**Interfaces:**
- Consumes: `useChatStore` and `DEFAULT_CHAT_PREVIEW` (Task 3), `useThemeVariantStore` (Task 2)
- Produces:
  - Routes inside a `Shell` that renders `AppLayout` + `CommandCenterNavigation` + `<Outlet/>` + `DemoSettingsFab`:
    - `/` → `IndexPage`
    - `/chats/new` → `NewChatPage`
    - `/chats/:chatId` → `ChatPage`

- [ ] **Step 1: Port `configureAtlasPrototypeNav.ts`**
  - Keep only the exports the trimmed nav and `App` still call: `observeAtlasPrototypeNavTweaks`, `observeAiNavSectionLayout`, `useSideNavAppKey`, and `expandPrototypeSideNav` if used.
  - Drop the classic-home chrome, the AI launcher and the collapse hooks if nothing calls them.

- [ ] **Step 2: Port `CommandCenterNavigation.tsx` (long-term mode only)**
  - Items:
    - **Home** (`/`)
    - **New chat** (navigates to `/chats/new`; doesn't create a record)
    - **Chat history**, one recency-ordered list from `useChatStore.chats`, labelled with `title`, linking to `/chats/:id`, with the active row highlighted
  - Remove automations, search if it only searched removed data, calendar, the case and legacy items, the status pills, q2, and studio. Keep `current`/`refreshed` styling branches only where they apply to what's left.

- [ ] **Step 3: Write `App.tsx` and the pages**
  - `App.tsx`: routes and `Shell` as above. Keep the `useLayoutEffect` observers and the theme body-class hook, and drop `WorkflowDeepLink`.
  - Placeholders:
    - `NewChatPage` and `ChatPage` render a `Typography` with the page name.
    - `IndexPage` renders a `Typography` plus an MUI `Button`, "Try regulatory changes", that calls `startChatFromPrompt(SHOW_REGULATORY_CHANGES_PROMPT, navigate)`. This lets Task 6 check the chat in the browser.
    - Task 7 replaces `IndexPage` and `NewChatPage`, and Task 6 replaces `ChatPage`.

- [ ] **Step 4: Build and test**
  - Run: `npm run build && npm test`
  - Expected: PASS.

- [ ] **Step 5: Check in the browser preview**
  - The left nav shows Home, New chat, and an empty Chat history.
  - The nav title reads "GC Cowork".
  - Toggling the theme restyles the nav.
  - No console errors.

- [ ] **Step 6: Commit**
  - Message: `feat: add GC Cowork shell and side nav`

---

### Task 6: Chat UI, regulatory change cards, and the conversation page

**Files:**
- Create, porting from D1:
  - `src/components/chat/{AtlasChatBoxComposer,AtlasChatMessages,AtlasChatMessage,BrandSpinner,DiligentLogo,DiligentToolIconMuted,RefreshedVoiceInput,ToolCall,PrototypeChatThread}.tsx`
  - `src/components/chat/chatTypography.ts`, `src/chat/brandActivityPlacement.ts`, `src/utils/downloadFile.ts` (only if `ToolCall` still uses it)
- Create, new: `src/components/chat/RegulatoryChangeList.tsx`
- Modify: `src/pages/ChatPage.tsx` (replaces the placeholder)

**Interfaces:**
- Consumes: `useChatRuntime` and `useChatSession` (Task 3), `ChatRegulatoryChangeListPart`, `RegulatoryChange`, `useThemeVariantStore`
- Produces:
  - `<PrototypeChatThread chatId header? />`
  - `<RegulatoryChangeList items: RegulatoryChange[] />`
  - `AtlasChatBoxComposer` (used by Task 7's home composer)

- [ ] **Step 1: Port the chat components**
  - `AtlasChatMessage`: remove the `workflow-started` branch and the `WorkflowStartedCard` import. Add `part.type === "regulatory-change-list"` → `<RegulatoryChangeList items={part.items} />`.
  - `PrototypeChatThread`: drop the `aboveComposer`, `threadTrailing` and workflow props if nothing uses them.

- [ ] **Step 2: Write `RegulatoryChangeList`**
  - Build it with Atlas components (look up Card, Chip/Status indicator and Typography through Atlas MCP first).
  - It's a vertical list of cards, each showing:
    - the status tag
    - the regulatory body
    - the title (`textMd` emphasis or a heading level)
    - the summary
    - the effective date
    - the deadlines (label · formatted date)
    - "Why it matters" with `reasonsRelevant` as a short list
  - No buttons.
  - Dates are formatted like "Mar 14, 2027".
  - It must read well in both theme variants. Use only tokens.

- [ ] **Step 3: Write `ChatPage`**
  - It's the non-workflow branch of D1's `WorkflowConversationPage`: `useChatSession(chatId)`, full-height `surface.subtle` box, and `PrototypeChatThread` with D1's `ChatHeaderTitle` in Default and no header in Refreshed.
  - Unknown id: show "Chat not found." with a `Link` to `/` labelled "Go to home".

- [ ] **Step 4: Build and test**
  - Run: `npm run build && npm test`
  - Expected: PASS.

- [ ] **Step 5: Check in the browser preview**
  - Click the placeholder home button "Try regulatory changes". Expect one user message, then reasoning, three tool calls going from running to success, the intro line, and 5 cards with the cyber rule first. The chat appears in Chat history.
  - Switch to Refreshed and repeat.
  - `/chats/unknown` shows "Chat not found." with a working home link.
  - No console errors.
  - Full chat checks happen in Task 7 Step 6.

- [ ] **Step 6: Commit**
  - Message: `feat: add chat thread, tool calls, and regulatory change cards`

---

### Task 7: Home page (hero, quick actions, attention pane) and New chat

**Files:**
- Create, porting from D1:
  - `src/components/CommandCenterChatHero.tsx`, `src/components/chat/PrototypeHomeComposer.tsx`
  - `src/components/home/HomeQuickActions.tsx`, `src/components/home/AttentionPane.tsx`
- Create, new: `src/home/attentionItems.ts`
- Modify: `src/pages/IndexPage.tsx`, `src/pages/NewChatPage.tsx`

**Interfaces:**
- Consumes: `startChatFromPrompt` (Task 3), the three prompts in `src/home/quickActionPrompts.ts` and `CYBER_RULE_CHANGE` (Task 4), `AtlasChatBoxComposer` (Task 6)
- Produces:
  - `type AttentionItem = { id; tag: string; badge: string; title; summary; meta; relatedPolicy: string }`
  - `ATTENTION_ITEMS: AttentionItem[]`

- [ ] **Step 1: Hero copy**
  - Heading: "What can I help you with today?" (unchanged).
  - Capability line: "Ask about a rule, see what's changed, or check what's due. Cowork keeps track of the regulations that affect you."

- [ ] **Step 2: Port `PrototypeHomeComposer`**
  - Drop `WorkflowQuickSuggestions` and `demoSettingsStore`.
  - Submit calls `startChatFromPrompt`.

- [ ] **Step 3: Port `HomeQuickActions` with three actions in this order**
  1. "Show recent regulatory changes": "See what's changed in the rules that affect us, and why each one matters." Prompt: `SHOW_REGULATORY_CHANGES_PROMPT`.
  2. "See what's due in the next two weeks": "Check upcoming filing and compliance deadlines across your obligations." Prompt: `DUE_SOON_PROMPT`.
  3. "Research a regulation": "Pull the current text of a rule and trace its recent amendments." Prompt: `RESEARCH_REGULATION_PROMPT`.
  - Keep the "AI-generated content may have inaccuracies." line.

- [ ] **Step 4: Write `attentionItems.ts` and simplify `AttentionPane`**
  - `attentionItems.ts` holds one item built from `CYBER_RULE_CHANGE`:
    - tag "SEC rule change"
    - badge "New"
    - title and summary from the change
    - meta "Final rule. Applies from this filing season. Cowork found it today at 6:35 AM."
    - relatedPolicy "Incident Response Plan §4.2: report a cyber-attack in four business days"
  - `AttentionPane`: keep D1's visual pattern (section title, card layout, tag, badge styling, both theme branches). Remove the triage menu, dismiss and snooze, the filters, the CTA, and every scenario import.
  - Show `relatedPolicy` under the meta line as a muted line with a document icon (Atlas `OpenFile` or similar), so it reads as "where this lands for you".
  - The item isn't clickable and has no buttons.

- [ ] **Step 5: Write `IndexPage` and `NewChatPage`**
  - `IndexPage`: D1's long-term home layout, keeping only the hero, composer, `HomeQuickActions` and `AttentionPane`, top to bottom and centered. Drop classic home, q2, the workforce/cases panels, and the agenda.
  - `NewChatPage`: D1's, with the hero and composer only.

- [ ] **Step 6: End-to-end check in the browser preview, in both themes**
  - Home shows the hero, three quick action cards in the order above, and the attention item with all five text pieces plus the related policy.
  - Clicking **Show recent regulatory changes**:
    - goes to `/chats/<id>`
    - shows one user message
    - streams the reasoning summary, then three tool calls that go from running to success, then the intro line, then 5 cards with the cyber rule first
    - shows the new chat in Chat history
  - Clicking **Research a regulation** gives the generic reply, not the list.
  - Clicking **See what's due** gives the generic reply.
  - Typing "what are the latest regulatory changes?" into the home composer gives the list.
  - A whitespace-only submit does nothing.
  - **New chat** opens `/chats/new` with no new history row until you send.
  - **Home** returns to `/`.
  - Reloading `/chats/<id>` shows "Chat not found." with a working home link.
  - Switch to Refreshed and repeat the regulatory changes flow. Cards, tool calls and nav all restyle cleanly.
  - `read_console_messages` shows no errors.
  - Take a screenshot of home and of the finished list in each theme.

- [ ] **Step 7: Build and test**
  - Run: `npm test && npm run build`
  - Expected: all PASS.

- [ ] **Step 8: Commit**
  - Message: `feat: add GC home page with quick actions and attention pane`

---

### Task 8: Cleanup check

- [ ] **Step 1: Search for excluded features**
  - Run: `grep -rniE "workflow|boards|appointment|q2|studio|assistant-ui|tailwind|legacy|caseChat|formFour|filingDraft|demoSettingsStore" src`
  - Expected: no matches, except the words in copy or comments where they're legitimately generic. Fix any real leftovers.
- [ ] **Step 2: Rewrite `README.md`**
  - Cover what the app is, `npm install` (needs access to atlas.diligent.com), `npm run dev`, `npm test`, and the theme toggle.
- [ ] **Step 3: Test and build**
  - Run: `npm test && npm run build`
  - Expected: PASS.
- [ ] **Step 4: Commit**
  - Message: `chore: remove leftovers and document setup`
