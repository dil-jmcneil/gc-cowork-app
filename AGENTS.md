# Important rules

This repo is GC Cowork, a general counsel surface built on the Atlas prototype stack. Current scope is defined in `docs/superpowers/specs/2026-10-30-gc-home-foundation-design.md`.

You are working in a prototype environment intended for product designers and developers to use the Atlas design system for the purpose of quick app prototyping.

Atlas relies on a heavily themed MUI setup, and a set of custom components that are authored by Atlas on top of MUI. Some type-level modifications are managed via TypeScript module augmentation of the theme.

MUI-X components are also available, and the MUI-X Pro license is automatically applied by the Theme Provider that is added by the `<AppLayout>` component from the `@diligentcorp/atlas-react-bundle` package.

Do not remove `<AppLayout>` from the application, since many feature, like `const { tokens, presets } = useTheme()` are available only inside the `<AppLayout>` component.

**Prefer using the design system over creating and defining custom components**, if there is one that fits the functional purpose you're trying to achieve. The goal is to create consistent prototypes that don't contain a lot of custom code or components.

Avoid installing and using shadcn/ui components, or any other third-party component sets, unless absolutely necessary for something specific that the design system does not provide, like charts.

## Atlas MCP server

**Always consult the Atlas MCP server** for the most up-to-date information about the list of components in the design system and their documentation.

While in a lot of cases the theme follows the default MUI API, often there are Atlas-specific ways to use them, and the documentation contains examples how to use components properly, as well as enhanced accessibility information.

The Atlas MCP server has been pre-configured in the project's mcp.json file, but you might need to ask the user to enable it in the MCP settings of Cursor, VS Code, or other MCP clients. Don't proceed with the task until the user has enabled the MCP server and you can get design system information from the server.

If you have trouble communicating with the MCP server, it could be that the pre-shared key in the mcp.json file is outdated.
Please prompt the user to get a new key from the Atlas documentation on Confluence.

## Atlas React Bundle dependency

The `@diligentcorp/atlas-react-bundle` package is vendored: `package.json` installs it from `vendor/atlas-react-bundle-0.0.1.tgz` in this repo. On Nov 10, 2026 the hosted tarball (`https://atlas.diligent.com/react-bundle.tgz`) started shipping without its `dist/` folder, which broke every fresh install (and Vercel deploys) with "Cannot find module '@diligentcorp/atlas-react-bundle'". The vendored copy is the last good bundle (from Oct 30).

To update it once the hosted bundle is fixed: download it, check that `tar tzf react-bundle.tgz | grep dist/index.js` finds the build, replace the file in `vendor/`, and reinstall. Or point `package.json` back at the URL. Package lock files are intentionally ignored in the .gitignore file.

## Styling

Only use the MUI `sx` prop for custom styles!

For custom styles, colors, spacing, shadows, and others, **use design tokens** via the `useTheme` hook on in the sx prop function.

```tsx
<Typography sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
  Hello, world!
</Typography>
```

You can use the MCP server to search for design tokens by path or value.

### Typography

Text stays between 12px and 18px. In this bundle the MUI variants render a step below their token names, so pick by rendered size:

| Rendered | Variant | Use for |
| --- | --- | --- |
| 18px semibold | `h4` + emphasis weight | Page titles and dialog titles |
| 16px semibold | `h5` + emphasis weight | The one headline on a card, e.g. an attention card's title |
| 14px semibold | `h6` + emphasis weight | Card and section headings |
| 14px (Type/Md) | `body1` | The default for content: values, table cells, messages, summaries. Add emphasis weight for names and subjects |
| 12px | `textMd` | Sparingly, for helper text an experienced user can skip: field labels, timestamps, meta lines, table headers |

- Never use `textSm` (10px), `labelXs` (11px), or `h3` and larger (22px+) on these screens. The home hero is the one exception.
- The attention card follows its Figma (3274:11121): 16px semibold title over a 16px regular muted summary.
- `h5` and `h6` render at regular weight; add `fontWeight: tokens.semantic.fontWeight.emphasis.value` for headings.
- The Atlas dialog title styles any `h2` inside it at 22px. Re-apply `theme.typography.h4` on the title.

### Spacing

Use the named scale in `src/lib/layout.ts` (`SPACE`), never raw numbers: `pair` 4px (label to value), `item` 8px (items in a row, lines in an item), `group` 12px (groups inside a card, list items), `block` 16px (card padding, stacked cards), `section` 24px (page sections, the maximum). Less space inside related content, more between blocks.

Atlas `Card` adds its own padding; set `p: 0` on the card when `CardContent` sets padding. Atlas pins dialogs to 440px; detail dialogs use `DETAIL_DIALOG_PAPER` (880px) so content fits without long scrolls.

### Cowork's avatar

Wherever Cowork speaks or acts (history, chat), show the Diligent D (`CoworkAvatar`, `src/assets/cowork-avatar.svg`).

### No AI sparkle icons

Never use the Atlas `AiSparkle` icon or any other `Ai*` icon that renders pink/purple. We're moving away from that treatment. A grayscale icon is fine only where an icon really helps. Don't mark content as AI-generated vs deterministic: no "AI-generated" captions or sparkle markers on summaries, drafts, or plans.

## Layouts

Use `<Container>` for setting up basic rules such as max width and alignment of the page. This is already done in the `PageLayout` component.

For layouts, prefer `<Stack>` or `<Box>` components.

### Grids

The responsive `<Grid>` component have the following column sizes available: "sm": 4, "md" & "lg": 8, "xl": 12.

Use the `GridPreset` for the page from `useTheme`.

```tsx
import {
  Container,
  GridLegacy as Grid, // Note that we use the old `GridLegacy` component from MUI which has been replaced since
  useTheme,
} from "@mui/material";

function MyLayout() {
  const { presets } = useTheme();
  return (
    <Container>
      <Grid {...presets.GridPresets.page}>
        <Grid item sm={4} md={4} lg={4} xl={6} />
      </Grid>
    </Container>
  );
}
```

## App contents

Assume that you're working on an enterprise B2B app unless otherwise specified.

The org name and logo you can set on the `AppLayout` component in `App.tsx` should represent the customer.

### Signals, not insights or regulatory changes

Anything Cowork surfaces for the GC is a **signal** (`src/signals`). Its kind is a metadata tag, not a separate object: each signal has exactly one `type` tag ("Court ruling", "Regulatory change", "Enforcement action", "Peer filing") plus optional `jurisdiction` and `topic` tags. Don't call a signal an "insight", or a "regulatory change" unless its type tag says so. Chat still understands "insights" when the user types it.

Every signal lists why it matters to Acme under one label, **Relevance** (`RELEVANCE_LABEL`), whatever its type. Show at most two reasons anywhere (`shownRelevance`). Don't add per-type names like "Points for Counsel" or "Reasons Relevant".

The primary demo signal is the ATG v. Lane ruling on advance notice bylaws (`gc-cowork-discovery/operating use case`). Past signals (`PAST_SIGNALS`) stay out of the attention pane; two have past workstreams, which load as real workstreams (`src/workstreams/pastWorkstreams.ts`) with pages and tasks on the calendar.

### Workstreams and history

The OOUX Project object is called a **workstream** everywhere: in the UI, in routes (`/workstreams/...`), and in code (`src/workstreams`, `Workstream`, `useWorkstreamStore`). Each task keeps a **history** of messages, actions (by Cowork or the GC, with the plan rule applied when there is one) and files; the UI calls this the **timeline** (`TimelineList`). It opens on the last two days, then steps to 10 more, then all. The activity log is one dialog for the whole workstream, opened from the Tasks header and filterable to one task.

### MVP scope: one workstream page

Every link goes to the workstream page (`workstreamHref`, with `?task=` to open it on a task), except attention cards, which open the signal dialog (`SignalDialog`: the chat signal card's content, plus Create or View workstream). The page always has Cowork's chat on the right. A new signal opens Cowork's draft on the same page. The task page, task quick-view dialog, the older create page and "Revise via chat" are hidden, not deleted: `useMvpScopeStore().showPostMvpViews` (a Demo settings switch) brings them back. See `docs/superpowers/plans/2026-11-04-workstream-mvp-simplification.md`.

Summaries lead with a bold headline that answers on its own (the GC's next action when there is one), then at most two supporting sentences (`src/workstreams/summary.ts`). Write all of Cowork's copy with the `smart-brevity` skill (`.claude/skills/smart-brevity/SKILL.md`). The workstream's status summary is derived live by `workstreamAttention`, not stored. Its panel uses Atlas status colors by `tone`: warning (yellow) when a step waits on the GC, error (red) when something blocks the work, information (blue) when it's on track.

### Q4 MVP configuration

A Demo settings switch (`useMvpScopeStore().q4Mvp`, under "Release scope", on by default) hides what isn't in the Q4 release. So far: the compliance calendar (widget and full page) shows only its Timeline view, with no view toggle; and the left nav has no Workstreams item, in either the expanded nav or the collapsed rail. Workstreams still exist; you reach one from its attention card or its tasks on the calendar. Add new Q4 cuts behind the same flag.

### Plans are tasks plus rule rows

Plans follow big-step / small-step orchestration ("Stop Turning Your Agents into Boxes and Arrows"):

- **Tasks** are the big steps: a short list in deadline order. Each is a contract: an owner, CCs, a deadline, and **what done looks like** (`doneWhen`), a postcondition naming who confirms it ("Peter confirms whether the ruling affects Acme's bylaws"). Never describe the route inside a task. A task can wait on another (`waitingOn`); it shows Blocked until that one is done.
- A task shows one of five statuses (`taskDisplayStatus`): Not started, In progress, Needs your review, Blocked, Done.
- **Rules** are flat rows of *when* (precondition), *Cowork does* (bounded actions, with a circuit breaker where retries are involved) and *until* (postcondition). Rows never refer to other rows. Add failures and edge cases as new `exception` rows instead of new steps. Always include a "no rule fits" row that stops and asks the GC.

### Workstream layouts

One page, two layouts. **Create** (a draft, `/workstreams/new?signal=`): what the signal is, why it matters and what Cowork suggests; the Source card as a horizontal strip across the top (`SourceStrip`, laid out like the signal dialog's header), with Relevance and Key Dates side by side under it; the Plan card (tasks as divided blocks: a numbered badge, the task name, status, labeled Owner and Deadline fields, then "Done when"); Accept and start. **View** (`/workstreams/:id`): the status summary across the top; the Tasks card (16px heading), where each task lists its own files as chips, and the header has two tertiary buttons: "All files (N)" and "Activity log", one dialog for every task's messages, actions and files, with a dropdown to narrow it to a single task by number and name (each task's second line is its status summary); Relevance, Key Dates and Source behind a plain header toggle (outside any card) that reveals the same cards as Create. Tasks are numbered in deadline order (`orderedTasks`), the same numbers chat uses ("remove task 4"). For the MVP, owners show as text and there's no CC column; the owner dropdown and CC return with post-MVP views on. "Accept and start" posts that request in the chat, and Cowork's reply lists the owners it's emailing (`startWorkstream`); typing "Start" does the same. The draft and the started workstream share one chat thread. In View, the status badge is a menu (Not started, In progress, Done; Done from the list counts as confirming). File chips, the All files dialog, and "Open the draft" on a task waiting on your review, open the file in the main panel (`?file=`) with a Back button; the chat stays open. Story files carry mock text (`src/workstreams/atgFiles.ts`).

## Writing style

The Diligent writing style is following the Microsoft Writing Style Guide. Consult it for detailed information, but here are some important rules to follow:

**Use sentence-style capitalization.** Everything is lowercase except the first word in a sentence and proper nouns.

**Exception: card headers use Title Case.** Headers of cards and card-like sections (for example "Status Summary", "Communication Thread", "Your Diligent Daily Brief", dialog section labels) capitalize every major word; short articles, conjunctions, and prepositions stay lowercase ("Chat with Cowork"). Buttons, labels, and body text stay sentence case.

- ✅ Be friendly, concise, and solution-focused.
- ✅ Use “you” and “we”; use contractions; use active voice.
- ✅ Lead with the important part; keep text short and scannable.
- ✅ Make buttons and dialogs action-oriented and consistent.
- ✅ Write with accessibility and localization in mind.
- ❌ Don’t blame the user.
- ❌ Don’t be formal, robotic, or full of jargon.
- ❌ Don’t over-explain or repeat yourself.
- ❌ Don’t rely on culture-specific references or hard-to-translate construct

## Import paths

Import paths are slightly different for the prototype environment compared to the regular development environment.

- Always use the `@diligentcorp/atlas-react-bundle` import path for all components and utilities.
- For icons, use the `@diligentcorp/atlas-react-bundle/icons/[IconName]` import path.
- For global navigation, use the `@diligentcorp/atlas-react-bundle/global-nav` import path.
