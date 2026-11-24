import BellIcon from "@diligentcorp/atlas-react-bundle/icons/Bell";
import InfoIcon from "@diligentcorp/atlas-react-bundle/icons/Info";
import MoreIcon from "@diligentcorp/atlas-react-bundle/icons/More";
import SnoozeIcon from "@diligentcorp/atlas-react-bundle/icons/Snooze";
import TrashIcon from "@diligentcorp/atlas-react-bundle/icons/Trash";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { SignalDialog } from "@/components/home/SignalDialog";
import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { ATTENTION_ITEMS } from "@/home/attentionItems";
import { attentionRows, type AttentionRow } from "@/home/attentionRows";
import { attentionView, nextMonday, useAttentionStore } from "@/home/attentionStore";
import { SPACE } from "@/lib/layout";
import { SIGNALS } from "@/signals/signals";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";

const SNOOZE_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

type Toast = { message: string; undo?: () => void };
type MenuAction = { label: string; detail: string; icon: ReactNode; onClick: () => void };

/**
 * What the GC needs to move, as one Atlas table: new signals to turn into
 * workstreams, and tasks in any workstream that wait on them. Each row's
 * button changes with what it needs: View ruling (or rule, action, filing), Review, Nudge, or
 * View workstream. The row menu snoozes it until next Monday or dismisses it.
 */
export function AttentionPane({ heading = "Tasks and Signals" }: { heading?: string }) {
  const { tokens } = useTheme();
  const [openSignalId, setOpenSignalId] = useState<string | null>(null);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const store = useAttentionStore();
  const workstreams = useWorkstreamStore((s) => s.workstreams);
  const nudgeTask = useWorkstreamStore((s) => s.nudgeTask);
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const navigate = useNavigate();

  const now = new Date();
  const view = attentionView(attentionRows(ATTENTION_ITEMS, workstreams, now), store, now);
  const openSignal = SIGNALS.find((s) => s.id === openSignalId) ?? null;
  const muted = tokens.semantic.color.type.muted.value;

  const act = (row: AttentionRow) => {
    store.markSeen(row.id);
    const { action } = row;
    if (action.kind === "nudge") {
      nudgeTask(action.workstreamId, action.taskId);
      setToast({ message: `Cowork sent ${row.owner ?? "the owner"} a reminder.` });
      return;
    }
    // Post-MVP views open the signal first; the MVP goes straight to the workstream.
    if (showPostMvpViews && (action.kind === "create" || action.kind === "view")) setOpenSignalId(row.id);
    else navigate(action.href);
  };
  const snooze = (row: AttentionRow) => {
    store.snooze(row.id);
    setToast({
      message: `Snoozed until ${SNOOZE_DATE.format(nextMonday(new Date()))}.`,
      undo: () => useAttentionStore.getState().unsnooze(row.id),
    });
  };
  const dismiss = (row: AttentionRow) => {
    store.dismiss(row.id);
    setToast({ message: "Dismissed.", undo: () => useAttentionStore.getState().restore(row.id) });
  };

  return (
    <Stack gap={SPACE.block} component="section" aria-labelledby="attention-pane-heading">
      <Stack gap={SPACE.pair}>
        <Typography
          id="attention-pane-heading"
          variant="h6"
          component="h2"
          sx={{ color: tokens.semantic.color.type.default.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
        >
          {heading}
        </Typography>
        <Typography variant="body1" sx={{ color: muted }}>
          New signals and the tasks waiting on you, most urgent first.
        </Typography>
      </Stack>

      {view.active.length ? (
        <AttentionTable
          ariaLabel="Items that need your attention"
          rows={view.active.map(({ item, backFromSnooze }) => ({
            row: item,
            chip: backFromSnooze ? <Chip variant="outlined" size="small" icon={<BellIcon />} label="Back from snooze" /> : null,
            menu: [
              { label: "Snooze", detail: "Resurfaces next Monday", icon: <SnoozeIcon />, onClick: () => snooze(item) },
              { label: "Dismiss", detail: "Delete permanently", icon: <TrashIcon />, onClick: () => dismiss(item) },
            ],
          }))}
          onAct={act}
        />
      ) : (
        <Typography variant="body1" sx={{ color: muted }}>
          You're all caught up.
        </Typography>
      )}

      {view.snoozed.length ? (
        <Stack gap={SPACE.group}>
          <Button
            variant="text"
            size="small"
            onClick={() => setShowSnoozed((v) => !v)}
            aria-expanded={showSnoozed}
            sx={{ alignSelf: "flex-start" }}
          >
            {showSnoozed ? "Hide snoozed" : `Snoozed (${view.snoozed.length})`}
          </Button>
          {showSnoozed ? (
            <AttentionTable
              ariaLabel="Snoozed items"
              rows={view.snoozed.map(({ item, until }) => ({
                row: item,
                chip: (
                  <Chip
                    variant="outlined"
                    size="small"
                    icon={<SnoozeIcon />}
                    label={`Snoozed until ${SNOOZE_DATE.format(new Date(until))}`}
                  />
                ),
                menu: [
                  {
                    label: "Unsnooze",
                    detail: "Back in your brief now",
                    icon: <BellIcon />,
                    onClick: () => store.unsnooze(item.id),
                  },
                  { label: "Dismiss", detail: "Delete permanently", icon: <TrashIcon />, onClick: () => dismiss(item) },
                ],
              }))}
              onAct={act}
            />
          ) : null}
        </Stack>
      ) : null}

      <SignalDialog signal={openSignal} onClose={() => setOpenSignalId(null)} />

      <Snackbar open={toast !== null} autoHideDuration={6000} onClose={() => setToast(null)}>
        <Alert
          severity="success"
          aria-live="polite"
          onClose={() => setToast(null)}
          action={
            toast?.undo ? (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Undo
              </Button>
            ) : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

/** Status and Action fit their content, so the item text gets the room. */
const NARROW = { width: "1%", whiteSpace: "nowrap" } as const;

type TableEntry = { row: AttentionRow; chip: ReactNode; menu: MenuAction[] };

/** Item, Source, Status, Action, then the row menu: one row per thing to move, inside an Atlas card. */
function AttentionTable({
  ariaLabel,
  rows,
  onAct,
}: {
  ariaLabel: string;
  rows: TableEntry[];
  onAct: (row: AttentionRow) => void;
}) {
  return (
    <Card sx={{ p: 0, overflow: "hidden" }}>
      <TableContainer>
        <Table
          aria-label={ariaLabel}
          sx={(theme) => ({
            "& .MuiTableCell-body": { ...theme.typography.body1, verticalAlign: "middle", whiteSpace: "normal" },
            // No divider under the last row; the card edge ends the table.
            "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root": { borderBottom: "none" },
          })}
        >
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell sx={{ width: "24%" }}>Source</TableCell>
              <TableCell sx={NARROW}>Status</TableCell>
              <TableCell sx={NARROW}>Action</TableCell>
              <TableCell sx={NARROW}>
                <Box component="span" sx={visuallyHidden}>
                  More actions
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((entry) => (
              <AttentionTableRow key={entry.row.id} {...entry} onAct={() => onAct(entry.row)} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function AttentionTableRow({ row, chip, menu, onAct }: TableEntry & { onAct: () => void }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const muted = tokens.semantic.color.type.muted.value;
  const titleId = `attention-${row.id.replace(/[^a-zA-Z0-9-]/g, "-")}-title`;

  return (
    <TableRow>
      <TableCell>
        <Stack gap={SPACE.pair} alignItems="flex-start">
          <Stack direction="row" alignItems="center" gap={SPACE.pair}>
            <Typography
              id={titleId}
              variant="body1"
              component="h3"
              sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}
            >
              {row.title}
            </Typography>
            {row.whySurfaced ? (
              <Tooltip title={row.whySurfaced} placement="top" arrow>
                <IconButton size="small" aria-label="Why this was surfaced" sx={{ color: muted }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          <Typography variant="body1" sx={{ color: muted }}>
            {row.summary}
          </Typography>
          {chip}
        </Stack>
      </TableCell>
      <TableCell>
        <Stack gap={SPACE.pair}>
          <Typography variant="body1">{row.source.name}</Typography>
          <Typography variant="body1" sx={{ color: muted }}>
            {row.source.kind}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={NARROW}>
        <StatusIndicator color={row.status.color} label={row.status.label} />
      </TableCell>
      <TableCell sx={NARROW}>
        <Button variant="outlined" size="small" onClick={onAct} aria-describedby={titleId} sx={{ whiteSpace: "nowrap" }}>
          {row.action.label}
        </Button>
      </TableCell>
      <TableCell sx={{ ...NARROW, textAlign: "right" }}>
        <IconButton
          size="small"
          aria-label={`More actions for ${row.title}`}
          aria-haspopup="menu"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <MoreIcon />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={menuAnchor !== null}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {menu.map((action, index) => (
            <MenuItem
              key={action.label}
              divider={index < menu.length - 1}
              onClick={() => {
                setMenuAnchor(null);
                action.onClick();
              }}
            >
              <ListItemIcon>{action.icon}</ListItemIcon>
              <ListItemText primary={action.label} secondary={action.detail} />
            </MenuItem>
          ))}
        </Menu>
      </TableCell>
    </TableRow>
  );
}
