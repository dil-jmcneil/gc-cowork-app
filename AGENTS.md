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

We're using an https dependency in the package.json file to install the `@diligentcorp/atlas-react-bundle` package.

The contents of the bundle might change over time, so the integrity information in the package lock file might become outdated. You can always use forced methods to update the dependency or packages. Package lock files are intentionally ignored in the .gitignore file.

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
| 14px semibold | `h6` + emphasis weight | Card and section headings, milestone titles |
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

Every signal lists why it matters to Acme under one label, **Relevance** (`RELEVANCE_LABEL`), whatever its type. Don't add per-type names like "Points for Counsel" or "Reasons Relevant".

The primary demo signal is the ATG v. Lane ruling on advance notice bylaws (`gc-cowork-discovery/operating use case`). Past signals (`PAST_SIGNALS`) stay out of the attention pane; two have past workstreams, which load as real workstreams (`src/workstreams/pastWorkstreams.ts`) with pages and tasks on the calendar.

### Workstreams and history

The OOUX Project object is called a **workstream** everywhere: in the UI, in routes (`/workstreams/...`), and in code (`src/workstreams`, `Workstream`, `useWorkstreamStore`). Each task keeps a **history** of messages, actions (by Cowork or the GC, with the plan rule applied when there is one) and files; the UI calls this the **timeline** (`TimelineList`). It opens on the last two days, then steps to 10 more, then all. Each milestone row expands to its own timeline, and the workstream page's Timeline card rolls every task's history into one list, labeled by milestone.

### MVP scope: one workstream page

Every link goes to the workstream page (`workstreamHref`, with `?milestone=&task=` to open it on a task), and the page always has Cowork's chat on the right. A new signal opens Cowork's draft on the same page. The task page, task and signal dialogs, the separate create page and "Revise via chat" are hidden, not deleted: `useMvpScopeStore().showPostMvpViews` (a Demo settings switch) brings them back. See `docs/superpowers/plans/2026-11-04-workstream-mvp-simplification.md`.

Summaries lead with a bold headline that answers on its own (the GC's next action when there is one), then at most two supporting sentences (`src/workstreams/summary.ts`). The workstream's status summary is derived live by `workstreamAttention`, not stored.

### Plans are milestones plus rule rows

Plans follow big-step / small-step orchestration ("Stop Turning Your Agents into Boxes and Arrows"):

- **Milestones** are a short, ordered spine. Each is a contract: what must be true to start, what must exist when it's done, and who approves the handover. Don't describe the route inside a milestone.
- **Rules** are flat rows of *when* (precondition), *Cowork does* (bounded actions, with a circuit breaker where retries are involved) and *until* (postcondition). Rows never refer to other rows. Add failures and edge cases as new `exception` rows instead of new steps.
- Rules that apply everywhere live on the plan; the rest live on their milestone. Always include a "no rule fits" row that stops and asks the GC.

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
