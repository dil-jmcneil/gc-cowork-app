# GC Cowork: home page foundation

## Intent

GC Cowork is a new surface for a company's general counsel (persona: **Peter**). It's built on the core of the generic supervisor chat surface in [d1-integrated](https://github.com/dil-jmcneil/d1-integrated) (local checkout: `/Users/jmcneil/Projects/d1-integrated`).

This first step lays the foundation: the app shell, chat, and a GC-flavored home page. Later work will grow it toward the regulatory change object model (OOUX). In that model, a **regulatory change** creates **projects**, each project has a **plan**, each plan has **tasks**, and each task has a **communication thread**. The surfaces in that model are the home screen, left-nav Projects / Compliance calendar / History, and external channels. Today's choices should make that growth easy, but none of it is built now.

## Goals

1. A runnable app in `gc-cowork-app` that uses the same stack and visual language as d1-integrated.
2. **Shell:** the common Atlas top nav and left nav. The left nav has **New chat** and a **Chat history** list of this session's chats.
3. **Home page:** exactly three things:
   - the primary chat hero (heading, capability line, and composer)
   - three quick action cards
   - the attention pane, with one item
4. **Chat:** sending from the home composer or clicking a quick action creates a new chat, adds it to history, navigates to it, and streams a mocked assistant reply. Clicking a history item reopens that chat.
5. **The "regulatory changes" scripted response** streams with real tool-call UI, then renders a structured list of changes.

## Non-goals (this step)

- Workflows, Boards, Library, Activity, Agents/Skills builders, Settings, Calendar pages, and their nav entries.
- Projects, Plans, Tasks, Communication threads, and the Compliance calendar, including the calendar widget on home.
- What happens when you click the attention item. It can be inert for now, but keep it visibly an item rather than a button that does nothing.
- CTAs on regulatory change cards ("See in chat", "View linked projects", "Create project"). Leave them off; don't render dead buttons.
- Any real backend or LLM. Everything is mocked and runs client-side.
- d1-integrated's other demo scaffolding: studio user-type FAB, the q2/long-term nav and home mode switch (keep long-term only), classic/Q2 home switch, legacy and seeded demo chats, workflow deep links, and the boards AI launcher. The theme toggle is kept; see "Look".

## Anti-goals

- **Copying d1-integrated wholesale and leaving dead code paths behind.** Bring over only what this scope uses, and remove references to the excluded features rather than stubbing them.
- **Custom components where Atlas has one.** Follow d1-integrated's `AGENTS.md`: use Atlas/MUI components, use the `sx` prop with design tokens only, and nothing below `textSm`.
- **Looking different from the supervisor surface.** This should read as a sibling product.

## Constraints

- **Stack (decided by the user: match d1-integrated):**
  - Vite, React 19, TypeScript
  - `@diligentcorp/atlas-react-bundle` (the https tgz from atlas.diligent.com, which needs network access), MUI 7 with its Emotion peers
  - react-router 7, zustand
  - the chat UI pieces d1-integrated uses (assistant-ui and/or its own `AtlasChat*` components; see "How")
  - path alias `@` → `src`
- Keep `<AppLayout>` from the Atlas bundle at the root. Tokens, presets, and the MUI-X license depend on it.
- Copy d1-integrated's `AGENTS.md` into the repo root, trimmed to what applies, so future agent work follows the same Atlas rules. The Atlas MCP server is connected in this environment and should be consulted for component usage.
- **Writing style:** sentence case, friendly, concise (Microsoft style guide, as in `AGENTS.md`).
- The repo currently holds a blank `create-vite` react-ts scaffold, which gets replaced. Remote: `git@github-diligent:dil-jmcneil/gc-cowork-app.git` (use the `github-diligent` SSH alias).

## How (decided)

### Look

- *(User's decision.)* Keep both of d1-integrated's theme variants and the ability to toggle between them:
  - **Default** (`current`): today's Atlas look
  - **Refreshed** (`refreshed`): the lighter redesign, applied through the `.refreshed-tokens` body class and the per-component `variant === "refreshed"` branches
- Carry over `themeVariantStore` (persisted in localStorage; give it a GC-specific storage key), the `.refreshed-tokens` CSS overrides from `styles.css`, the body-class sync in `App.tsx`, and the variant branches in every component brought over.
- Expose the toggle the way d1-integrated does: the demo settings FAB and dialog, trimmed so theme is the only setting.
- Both variants must look right across everything in scope: the nav, the home page, chat, tool calls, reasoning, and the new regulatory change cards.
- Nav and home use d1-integrated's **long-term** mode only. Drop the `q2` branches.

### Shell

- Same structure as d1-integrated's `App.tsx` `Shell` and `CommandCenterNavigation.tsx`: Atlas top nav plus a left side nav with **Home**, **New chat**, and **Chat history**.
- *(Assistant's call.)* **Home** goes to `/`. **New chat** goes to `/chats/new`, which mirrors d1-integrated's `NewChatPage`: the hero and composer only, with no quick actions or attention pane. A chat record is created on first send, not on click, so history never fills with blank chats.
- Routes:
  - `/` (home)
  - `/chats/new`
  - `/chats/:chatId` (a conversation)
  - Optionally `/chats` (all chats), only if the nav's "see all" needs it. Builder's call.
- d1-integrated runs `scripts/patch-atlas-mock-navigator.mjs` on postinstall and uses `configureAtlasPrototypeNav.ts` to tweak the Atlas mock navigator through the DOM. Carry over only the parts needed for this shell to look right, and drop Pulse/Boards-specific patches.
- App and org naming:
  - The app title in the nav should read **"GC Cowork"**, unless the bundle's nav can't be relabeled cleanly. In that case, keep the default and note it.
  - The org name and logo on `AppLayout` represent a fictional customer. Builder's pick.

### Home page

Top to bottom, centered like d1-integrated's `IndexPage`:

1. **Chat hero:** the `CommandCenterChatHero` pattern ("What can I help you with today?" plus a GC-specific capability line) and the home composer (`PrototypeHomeComposer`).
2. **Quick actions:** the `HomeQuickActions` pattern, three cards in a row, each a title plus description. Each card seeds a prompt and starts a new chat.
   1. **Show recent regulatory changes:** "See what's changed in the rules that affect us, and why each one matters." Triggers the scripted response below.
   2. **See what's due in the next two weeks:** points toward the future tasks and compliance calendar. *(Builder's/assistant's pick.)* Generic mock reply.
   3. **Research a regulation:** pulls the current text and recent amendments. *(Assistant's pick.)* Generic mock reply.
   - Final copy is the builder's call within the writing style.
   - Keep the "AI-generated content may have inaccuracies." line under the cards.
3. **Attention pane:** the `AttentionPane` pattern, simplified, with exactly one item:
   - Tag: **SEC rule change**, plus a **New** status badge
   - Title: **New cyber-attack reporting rule**
   - Summary: "The SEC tightened its cyber rule. A company must now report a material cyber-attack on Form 8-K, under Item 1.05, within four business days after it decides that the attack is material."
   - Meta line: "Final rule. Applies from this filing season. Cowork found it today at 6:35 AM."
   - Related internal policy, shown with the item as where this lands for the company: **"Incident Response Plan §4.2: report a cyber-attack in four business days"**. *(Assistant's call: placement and treatment inside the item are left to the builder.)*
   - Dismiss and snooze triage from d1-integrated isn't needed. Leave it out unless it comes along for free with the component.

### Chat

- Bring over d1-integrated's chat core: the chat record store (`chatStore`), streaming runtime (`useChatRuntime`, `useChatSession`, `streamAssistantMessage`), chunk types (`chatTypes`), stream helpers, `ToolCall`, reasoning display, and the live thread/message rendering (`PrototypeChatThread`, `AtlasChat*`). Strip out scenario, workflow, and appointment fields and the seed chats.
- *(Assistant's call.)* Assistant text renders as plain text through Atlas `AIChatMessageTextBlock`, the same as d1-integrated's live thread. Don't bring over the assistant-ui `markdown-text`, and drop assistant-ui, Tailwind, and remark if nothing else in scope needs them.
- Persisting chats across reloads isn't required. It's fine to follow whatever d1-integrated's store already does.
- **Generic reply:** any prompt that isn't the regulatory changes prompt gets a short mocked reply streamed as text, like d1-integrated's `buildGenericReply`, reworded for a GC context.
- **Regulatory changes scripted response.** Triggered by the quick action, and also by free-text prompts that clearly ask for recent regulatory changes (simple keyword match). Streams in this order:
  1. A reasoning segment with a short summary, such as "Checking recent rule changes against your policies".
  2. Two or three tool calls, each going `running` → `success`, using the existing `ToolCall` component and icon kinds. For example:
     - "Searching SEC and Federal Register updates" (`web_search`)
     - "Reading final rule text" (`web_fetch`)
     - "Checking your policy library" (`arca` or the Diligent mark)
  3. A one-line text intro.
  4. A **regulatory change list**: a new structured chat part type, for example `{ type: "regulatory-change-list", items: RegulatoryChange[] }`, rendered as cards, not markdown.
- **`RegulatoryChange` shape** (a subset of the OOUX object; keep it in its own module so later work extends it):
  - `id`
  - `title`
  - `summary`
  - `regulatoryBody` (e.g., SEC, FINRA, EU Commission)
  - `effectiveDate`
  - `status` (e.g., New, In review, Upcoming)
  - `deadlines` (1..n, each a label plus a date)
  - `reasonsRelevant` (1..n short strings)
- **List contents:** five mocked changes. The first is the SEC cyber-attack reporting rule, with the same facts as the attention item. The other four are plausible, varied, made-up changes across different bodies. They're illustrative, not legal advice, and don't need to be factually current.
- **Each card shows** title, summary, regulatory body, effective date, a status tag, deadlines, and reasons relevant. No buttons.

## Left to the builder

- Which d1-integrated files to copy and adapt versus rewrite, as long as the anti-goals hold.
- Exact copy for the hero capability line, quick action descriptions, generic reply, and the four extra regulatory changes.
- Timing of the streaming animation. It should feel like d1-integrated's scripted scenarios.
- Fictional customer org name and logo.
- Card layout details for the regulatory change list, using Atlas components and tokens.

## Done means

- `npm install && npm run dev` serves the app. The home page shows the hero, the three quick actions, and the attention pane with the cyber rule item.
- Clicking **Show recent regulatory changes** opens a new chat and streams reasoning, tool calls that resolve, an intro line, and five regulatory change cards.
- The new chat appears in the left-nav chat history, and New chat returns you to a fresh start.
- The other two quick actions and free-text prompts stream a generic reply.
- The demo settings toggle switches between Default and Refreshed, the change shows across the nav, home, and chat, and the choice survives a reload.
- `npm run build` passes. No console errors on the golden path.
