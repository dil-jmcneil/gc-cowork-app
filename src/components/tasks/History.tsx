import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";

import { usePlanRulesStore } from "@/demo/planRulesStore";
import { SPACE } from "@/lib/layout";
import type { HistoryAction, HistoryEntry, HistoryFile, HistoryKind } from "@/workstreams/thread";

import { PersonLine } from "./PersonLine";
import { HistoryCard, ThreadMessage } from "./ThreadMessages";

/** A history entry, with an optional line saying which task it belongs to. */
export type HistoryItem = { entry: HistoryEntry; context?: string };

const FILTERS: { kind: HistoryKind | "all"; label: string }[] = [
  { kind: "all", label: "All" },
  { kind: "message", label: "Messages" },
  { kind: "action", label: "Actions" },
  { kind: "file", label: "Files" },
];

/** Messages, actions and files in one list, filterable by kind. `limit` shows the first few until expanded. */
export function HistoryList({ items, ariaLabel, limit }: { items: HistoryItem[]; ariaLabel: string; limit?: number }) {
  const { presets } = useTheme();
  const [filter, setFilter] = useState<HistoryKind | "all">("all");
  const [expanded, setExpanded] = useState(false);
  const matching = filter === "all" ? items : items.filter((i) => i.entry.kind === filter);
  const shown = limit && !expanded ? matching.slice(0, limit) : matching;

  return (
    <Stack gap={SPACE.group}>
      <Stack
        component="ul"
        direction="row"
        gap={SPACE.item}
        flexWrap="wrap"
        aria-label="Filter history"
        sx={{ listStyle: "none", m: 0, p: 0 }}
      >
        {FILTERS.map(({ kind, label }) => {
          const count = kind === "all" ? items.length : items.filter((i) => i.entry.kind === kind).length;
          const selected = filter === kind;
          return (
            <li key={kind}>
              <Chip
                label={`${label} (${count})`}
                variant="outlined"
                clickable
                aria-pressed={selected}
                onClick={() => setFilter(kind)}
                sx={{ ...(selected && presets.ChipPresets.selected.sx) }}
              />
            </li>
          );
        })}
      </Stack>
      <Stack component="ol" gap={SPACE.item} aria-label={ariaLabel} sx={{ m: 0, p: 0 }}>
        {shown.map(({ entry, context }) => (
          <HistoryRow key={entry.id} entry={entry} context={context} />
        ))}
      </Stack>
      {shown.length < matching.length ? (
        <Button variant="text" size="small" onClick={() => setExpanded(true)} sx={{ alignSelf: "flex-start" }}>
          Show all ({matching.length})
        </Button>
      ) : null}
      {shown.length === 0 ? (
        <Typography variant="body1" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
          Nothing here yet.
        </Typography>
      ) : null}
    </Stack>
  );
}

function HistoryRow({ entry, context }: { entry: HistoryEntry; context?: string }) {
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
