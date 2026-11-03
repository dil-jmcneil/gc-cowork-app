import ArrowRightIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowRight";
import BellIcon from "@diligentcorp/atlas-react-bundle/icons/Bell";
import InfoIcon from "@diligentcorp/atlas-react-bundle/icons/Info";
import MoreIcon from "@diligentcorp/atlas-react-bundle/icons/More";
import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import SnoozeIcon from "@diligentcorp/atlas-react-bundle/icons/Snooze";
import TrashIcon from "@diligentcorp/atlas-react-bundle/icons/Trash";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useState, type MouseEvent, type ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { SignalDialog } from "@/components/home/SignalDialog";
import { ATTENTION_ITEMS, type AttentionItem } from "@/home/attentionItems";
import { attentionView, nextMonday, useAttentionStore } from "@/home/attentionStore";
import { SIGNALS } from "@/signals/signals";
import { SPACE } from "@/lib/layout";
import type { Workstream } from "@/workstreams/workstream";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";

const SNOOZE_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

type Toast = { message: string; undo: () => void };

/**
 * Figma "Attention pane" (AI agentic playground, 3274:11121): a plain title,
 * then one card per item. Each card opens its signal, and its menu snoozes
 * the item until next Monday or dismisses it.
 */
export function AttentionPane({ heading = "Your Diligent Daily Brief" }: { heading?: string }) {
  const { tokens } = useTheme();
  const [openSignalId, setOpenSignalId] = useState<string | null>(null);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const store = useAttentionStore();
  const view = attentionView(ATTENTION_ITEMS, store, new Date());
  const openSignal = SIGNALS.find((c) => c.id === openSignalId) ?? null;
  const muted = tokens.semantic.color.type.muted.value;

  const open = (id: string) => {
    store.markSeen(id);
    setOpenSignalId(id);
  };
  const snooze = (item: AttentionItem) => {
    store.snooze(item.id);
    setToast({
      message: `Snoozed until ${SNOOZE_DATE.format(nextMonday(new Date()))}.`,
      undo: () => useAttentionStore.getState().unsnooze(item.id),
    });
  };
  const dismiss = (item: AttentionItem) => {
    store.dismiss(item.id);
    setToast({ message: "Dismissed.", undo: () => useAttentionStore.getState().restore(item.id) });
  };

  return (
    <Stack gap={SPACE.block} component="section" aria-labelledby="attention-pane-heading">
      <Typography
        id="attention-pane-heading"
        variant="h6"
        component="h2"
        sx={{ color: tokens.semantic.color.type.default.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {heading}
      </Typography>

      {view.active.length ? (
        <Stack
          component="ul"
          gap={SPACE.group}
          aria-label="Items that need your attention"
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {view.active.map(({ item, backFromSnooze }) => (
            <Box component="li" key={item.id}>
              <AttentionCard
                item={item}
                backFromSnooze={backFromSnooze}
                onOpen={() => open(item.id)}
                menu={[
                  {
                    label: "Snooze",
                    detail: "Resurfaces next Monday",
                    icon: <SnoozeIcon />,
                    onClick: () => snooze(item),
                  },
                  { label: "Dismiss", detail: "Delete permanently", icon: <TrashIcon />, onClick: () => dismiss(item) },
                ]}
              />
            </Box>
          ))}
        </Stack>
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
            <Stack component="ul" gap={SPACE.group} aria-label="Snoozed items" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {view.snoozed.map(({ item, until }) => (
                <Box component="li" key={item.id}>
                  <AttentionCard
                    item={item}
                    snoozedUntil={until}
                    onOpen={() => open(item.id)}
                    menu={[
                      {
                        label: "Unsnooze",
                        detail: "Back in your brief now",
                        icon: <BellIcon />,
                        onClick: () => store.unsnooze(item.id),
                      },
                      {
                        label: "Dismiss",
                        detail: "Delete permanently",
                        icon: <TrashIcon />,
                        onClick: () => dismiss(item),
                      },
                    ]}
                  />
                </Box>
              ))}
            </Stack>
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
            <Button
              size="small"
              variant="text"
              onClick={() => {
                toast?.undo();
                setToast(null);
              }}
            >
              Undo
            </Button>
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

type MenuAction = { label: string; detail: string; icon: ReactNode; onClick: () => void };

/** Stops a click on an inner control from also opening the card. */
const inner = (handler?: () => void) => (e: MouseEvent) => {
  e.stopPropagation();
  handler?.();
};

/**
 * One attention item. The whole card opens it, and so does the Open (or, once
 * a workstream exists, Revisit) button, which is the keyboard path. The menu,
 * the info tooltip and the workstream link don't open the card.
 */
function AttentionCard({
  item,
  backFromSnooze = false,
  snoozedUntil,
  onOpen,
  menu,
}: {
  item: AttentionItem;
  backFromSnooze?: boolean;
  snoozedUntil?: string;
  onOpen: () => void;
  menu: MenuAction[];
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const workstream = useWorkstreamStore((s) => s.workstreams.find((w) => w.sourceSignalId === item.id));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const muted = tokens.semantic.color.type.muted.value;
  const titleId = `attention-${item.id}-title`;

  return (
    <Card
      onClick={onOpen}
      sx={{
        p: 0,
        cursor: "pointer",
        transition: "background-color 150ms ease",
        "&:hover": { bgcolor: tokens.semantic.color.surface.variant.value },
      }}
    >
      <CardContent sx={{ p: SPACE.section, "&:last-child": { pb: SPACE.section } }}>
        <Stack gap={SPACE.block}>
          {/* Header: source · time and status on the left; snooze chip and menu on the right. */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={SPACE.item} flexWrap="wrap">
            <Stack direction="row" alignItems="center" gap={SPACE.group} flexWrap="wrap" sx={{ minHeight: 32 }}>
              <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ color: muted }}>
                <Stack direction="row" alignItems="center" gap={SPACE.pair}>
                  <ScaleIcon aria-hidden style={{ width: 20, height: 20 }} />
                  <Typography
                    variant="body1"
                    sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.bold.value }}
                  >
                    {item.source}
                  </Typography>
                </Stack>
                <Typography variant="body1" aria-hidden sx={{ color: "inherit" }}>
                  ·
                </Typography>
                <Typography variant="body1" sx={{ color: "inherit" }}>
                  {item.receivedAt}
                </Typography>
              </Stack>
              <StatusIndicator
                color={workstream ? "success" : "information"}
                label={workstream ? "Workstream started" : item.badge}
              />
            </Stack>
            <Stack direction="row" alignItems="center" gap={SPACE.item}>
              {backFromSnooze ? (
                <Chip variant="outlined" size="small" icon={<BellIcon />} label="Back from snooze" />
              ) : null}
              {snoozedUntil ? (
                <Chip
                  variant="outlined"
                  size="small"
                  icon={<SnoozeIcon />}
                  label={`Snoozed until ${SNOOZE_DATE.format(new Date(snoozedUntil))}`}
                />
              ) : null}
              <IconButton
                size="small"
                aria-label={`More actions for ${item.title}`}
                aria-haspopup="menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAnchor(e.currentTarget);
                }}
              >
                <MoreIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Body: workstream link, title with the why-surfaced tooltip, summary; Open on the right. */}
          <Stack direction="row" alignItems="center" gap={SPACE.section}>
            <Stack gap={SPACE.pair} sx={{ flex: 1, minWidth: 0 }}>
              {workstream ? <WorkstreamLink workstream={workstream} /> : null}
              <Stack direction="row" alignItems="center" gap={SPACE.pair}>
                <Typography
                  id={titleId}
                  variant="h5"
                  component="h3"
                  sx={{
                    fontWeight: tokens.semantic.fontWeight.emphasis.value,
                    color: tokens.semantic.color.type.default.value,
                  }}
                >
                  {item.title}
                </Typography>
                <Tooltip title={item.whySurfaced} placement="top" arrow>
                  <IconButton size="small" aria-label="Why this was surfaced" onClick={inner()} sx={{ color: muted }}>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              {/* Figma Text/Body: the summary is 16px regular, muted. */}
              <Typography
                variant="h5"
                component="p"
                sx={{ fontWeight: tokens.semantic.fontWeight.regular.value, color: muted }}
              >
                {item.summary}
              </Typography>
            </Stack>
            {workstream ? (
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowRightIcon aria-hidden />}
                onClick={inner(onOpen)}
                aria-describedby={titleId}
                sx={{ flexShrink: 0 }}
              >
                Revisit
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={inner(onOpen)}
                aria-describedby={titleId}
                sx={{ flexShrink: 0 }}
              >
                Open
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
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
    </Card>
  );
}

/** Once a workstream exists, the card links to it above the title. */
function WorkstreamLink({ workstream }: { workstream: Workstream }) {
  const { tokens } = useTheme();
  return (
    <Link
      component={RouterLink}
      to={`/workstreams/${workstream.id}`}
      underline="hover"
      onClick={(e) => e.stopPropagation()}
      sx={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: SPACE.pair }}
    >
      <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
      <Typography
        variant="body1"
        component="span"
        sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        Workstream: {workstream.name}
      </Typography>
    </Link>
  );
}
