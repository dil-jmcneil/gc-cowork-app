import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";
import { Button, ListItemText, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material";
import { useMemo, useState } from "react";

import { PersonLine } from "@/components/tasks/PersonLine";
import { HistoryCard, ThreadMessage } from "@/components/tasks/ThreadMessages";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { SPACE } from "@/lib/layout";
import {
  newestFirst,
  type HistoryAction,
  type HistoryEntry,
  type HistoryFile,
  type HistoryKind,
} from "@/workstreams/thread";

import { timelineWindow, type TimelineStep } from "./timelineWindow";

/** A timeline entry, with an optional line saying where it belongs (a task, or a milestone). */
export type TimelineListItem = { entry: HistoryEntry; context?: string };

const FILTERS: { kind: HistoryKind | "all"; label: string }[] = [
  { kind: "all", label: "All" },
  { kind: "message", label: "Messages" },
  { kind: "action", label: "Actions" },
  { kind: "file", label: "Files" },
];

/**
 * Messages, Cowork's actions and files, newest first. It opens on the last
 * two days, then steps up to 10 more, then everything, so the latest activity
 * is all you see until you ask for more. A quiet Filter menu narrows by kind.
 */
export function TimelineList({ items, ariaLabel, now }: { items: TimelineListItem[]; ariaLabel: string; now: Date }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  const [filter, setFilter] = useState<HistoryKind | "all">("all");
  const [step, setStep] = useState<TimelineStep>("recent");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const newest = useMemo(() => newestFirst(items, (i) => i.entry.sentAt), [items]);
  const matching = filter === "all" ? newest : newest.filter((i) => i.entry.kind === filter);
  const view = timelineWindow(
    matching.map((i) => ({ ...i, sentAt: i.entry.sentAt })),
    now,
    step,
  );
  const filterLabel = FILTERS.find((f) => f.kind === filter)!.label;
  const caption = step === "recent" ? "Last two days" : step === "ten" ? `Latest ${view.shown.length}` : "Everything";

  return (
    <Stack gap={SPACE.group}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={SPACE.item}>
        <Typography variant="textMd" sx={{ color: muted }}>
          {caption}
        </Typography>
        <Button
          variant="text"
          size="small"
          endIcon={<CaretDownIcon aria-hidden />}
          aria-haspopup="menu"
          aria-expanded={menuAnchor ? "true" : undefined}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          Filter: {filterLabel}
        </Button>
        <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
          {FILTERS.map(({ kind, label }) => (
            <MenuItem
              key={kind}
              selected={kind === filter}
              onClick={() => {
                setFilter(kind);
                setMenuAnchor(null);
              }}
            >
              <ListItemText
                primary={`${label} (${kind === "all" ? items.length : items.filter((i) => i.entry.kind === kind).length})`}
              />
            </MenuItem>
          ))}
        </Menu>
      </Stack>
      {view.shown.length ? (
        <Stack component="ol" gap={SPACE.item} aria-label={ariaLabel} sx={{ m: 0, p: 0 }}>
          {view.shown.map(({ entry, context }) => (
            <TimelineRow key={entry.id} entry={entry} context={context} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body1" sx={{ color: muted }}>
          {matching.length ? "Nothing in the last two days." : "Nothing here yet."}
        </Typography>
      )}
      {view.next ? (
        <Button variant="text" size="small" onClick={() => setStep(view.next!.step)} sx={{ alignSelf: "flex-start" }}>
          {view.next.label}
        </Button>
      ) : null}
    </Stack>
  );
}

function TimelineRow({ entry, context }: { entry: HistoryEntry; context?: string }) {
  if (entry.kind === "message") return <ThreadMessage message={entry} context={context} />;
  if (entry.kind === "action") return <ActionRow action={entry} context={context} />;
  return <FileRow file={entry} context={context} />;
}

function ActionRow({ action, context }: { action: HistoryAction; context?: string }) {
  const { tokens } = useTheme();
  const showRules = usePlanRulesStore((s) => s.showRules);
  const muted = tokens.semantic.color.type.muted.value;
  return (
    <HistoryCard
      label="Action"
      sentAt={action.sentAt}
      header={<PersonLine name={action.actor} detail={context ?? (action.actor === "Cowork" ? undefined : "You")} />}
    >
      <Stack gap={SPACE.pair}>
        <Typography variant="body1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
          {action.summary}
        </Typography>
        {action.detail ? <Typography variant="body1">{action.detail}</Typography> : null}
        {showRules && action.rule ? (
          <Typography variant="textMd" sx={{ color: muted }}>
            Rule: {action.rule}
          </Typography>
        ) : null}
      </Stack>
    </HistoryCard>
  );
}

function FileRow({ file, context }: { file: HistoryFile; context?: string }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  const source = [`Added by ${file.addedBy}`, file.note, context].filter(Boolean).join(" · ");
  return (
    <HistoryCard
      label="File"
      sentAt={file.sentAt}
      header={
        <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ minWidth: 0 }}>
          <OpenFileIcon aria-hidden style={{ width: 24, height: 24, flexShrink: 0, color: muted }} />
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="body1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
              {file.name}
            </Typography>
            <Typography variant="textMd" sx={{ color: muted }}>
              {source}
            </Typography>
          </Stack>
        </Stack>
      }
    />
  );
}
