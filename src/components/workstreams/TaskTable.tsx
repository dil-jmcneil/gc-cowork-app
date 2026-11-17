import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";
import CaretRightIcon from "@diligentcorp/atlas-react-bundle/icons/CaretRight";
import { Box, ButtonBase, Collapse, Link, Menu, MenuItem, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, type ReactNode } from "react";

import { formatDate } from "@/lib/dates";
import { SPACE } from "@/lib/layout";
import { orderedTasks, taskDisplayStatus, type TaskDisplayLabel } from "@/workstreams/taskStatus";
import type { HistoryFile } from "@/workstreams/thread";
import type { TaskStatus, WorkstreamTask } from "@/workstreams/workstream";
import { isUnassigned, type OwnerEntry, type TaskOwner } from "@/workstreams/people";

import { DocumentChip } from "./DocumentChip";
import { OwnerTypeahead } from "./OwnerTypeahead";
import { TimelineList } from "./Timeline";

const STATUS_COLOR: Record<TaskDisplayLabel, "subtle" | "information" | "warning" | "error" | "success"> = {
  "Not started": "subtle",
  "In progress": "information",
  "Needs your review": "warning",
  Blocked: "error",
  Done: "success",
};

/**
 * The plan's tasks as divided blocks, in deadline order. Each has a numbered
 * badge and the task's name with its status at the right; labeled Owner and
 * Deadline fields; then a closing line. In a draft that line says what done
 * looks like; once the workstream has started it's Cowork's summary of where
 * the task stands, with its files, then its activity in a collapsed
 * accordion. Pass `onOwnerChange` to make owners editable.
 */
export function TaskTable({
  tasks,
  detail,
  onOwnerChange,
  ownerEntries,
  onOwnerEntryChange,
  onOpenFile,
  onStatusChange,
  summarize,
  highlightTaskId,
  showCc = false,
  now,
  ariaLabel = "Tasks",
}: {
  tasks: WorkstreamTask[];
  /** "done-when" for a draft; "status" once it's started. */
  detail: "done-when" | "status";
  ariaLabel?: string;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  /** A draft: owner name and email typed in on each task, by task id. */
  ownerEntries?: Record<string, OwnerEntry>;
  onOwnerEntryChange?: (taskId: string, entry: OwnerEntry) => void;
  /** Makes each status a menu: Not started, In progress, Done. */
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  /** Opens a file; a task waiting on your review links its file from the status line. */
  onOpenFile?: (fileId: string) => void;
  /** The status line for a task, for the "status" detail. */
  summarize?: (task: WorkstreamTask) => string;
  /** Post-MVP: a CC field. The MVP shows the owner only. */
  showCc?: boolean;
  /** The task a link opened the page on; its block is tinted. */
  highlightTaskId?: string;
  /** With `detail="status"`: when set, each task gets a collapsed activity accordion that reads from this moment. */
  now?: Date;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;
  const muted = tokens.semantic.color.type.muted.value;
  const divider = tokens.semantic.color.ui.divider.default.value;
  const highlight = tokens.component.statusIndicator.colors.information.backgroundColor.value;
  // Numbered in the same order chat uses: "task 2" is the second block.
  const ordered = orderedTasks(tasks);

  return (
    <Stack component="ol" aria-label={ariaLabel} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {ordered.map((task, index) => {
        // A draft hasn't started, so nothing is blocked yet: show each task's own status.
        const status = detail === "done-when" ? { label: task.status } : taskDisplayStatus(task, tasks);
        const highlighted = task.id === highlightTaskId;
        return (
          <Box
            component="li"
            key={task.id}
            id={taskAnchorId(task.id)}
            aria-current={highlighted ? "true" : undefined}
            sx={{
              display: "grid",
              gridTemplateColumns: "28px minmax(0, 1fr)",
              columnGap: SPACE.group,
              // Room above and below each task; a divider between them, none after the last.
              px: SPACE.group,
              py: SPACE.block,
              borderTop: index === 0 ? "none" : `1px solid ${divider}`,
              borderRadius: highlighted ? tokens.semantic.radius.sm.value : 0,
              bgcolor: highlighted ? highlight : undefined,
            }}
          >
            <NumberBadge number={index + 1} />

            <Stack gap={SPACE.group} sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={SPACE.block}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: emphasis, minWidth: 0 }}>
                  {task.description}
                </Typography>
                <Box sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                  {onStatusChange ? (
                    <StatusMenu task={task} label={status.label} onChange={(next) => onStatusChange(task.id, next)} />
                  ) : (
                    <StatusIndicator color={STATUS_COLOR[status.label]} label={status.label} />
                  )}
                </Box>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: showCc
                    ? "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)"
                    : "minmax(0, 2fr) minmax(0, 1fr)",
                  columnGap: SPACE.section,
                  rowGap: SPACE.group,
                }}
              >
                <Field label="Owner">
                  {onOwnerEntryChange ? (
                    <OwnerEntryFields
                      entry={ownerEntries?.[task.id] ?? { name: "", email: "" }}
                      onChange={(entry) => onOwnerEntryChange(task.id, entry)}
                      taskName={task.description}
                    />
                  ) : onOwnerChange ? (
                    <OwnerTypeahead
                      value={task.delegate}
                      onChange={(owner) => onOwnerChange(task.id, owner)}
                      ariaLabel={`Owner of ${task.description}`}
                    />
                  ) : (
                    <OwnerValue owner={task.delegate} />
                  )}
                </Field>
                <Field label="Deadline">
                  <Typography variant="body1">{formatDate(task.deadline)}</Typography>
                </Field>
                {showCc ? (
                  <Field label="CC">
                    <Typography variant="body1">{task.ccs.map((cc) => cc.label).join(", ") || "None"}</Typography>
                  </Field>
                ) : null}
              </Box>

              {/* 4px closer to the Owner and Deadline fields than the other gaps (8px). */}
              <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                gap={SPACE.block}
                sx={{ mt: -SPACE.pair }}
              >
                <Typography variant="body1" sx={{ color: muted }}>
                  {detail === "done-when" ? (
                    <>
                      <Box component="span" sx={{ fontWeight: emphasis }}>
                        Done when:{" "}
                      </Box>
                      {task.doneWhen}
                    </>
                  ) : (
                    <>
                      {summarize?.(task) ?? ""}
                      <ReviewFileLink task={task} onOpenFile={onOpenFile} />
                    </>
                  )}
                </Typography>
              </Stack>

              {detail === "status" && onOpenFile ? <TaskFiles task={task} onOpenFile={onOpenFile} /> : null}
              {detail === "status" && now ? <TaskActivity task={task} now={now} /> : null}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

/** The files on a task, as chips that open them: what Cowork created and what people uploaded. */
function TaskFiles({ task, onOpenFile }: { task: WorkstreamTask; onOpenFile: (fileId: string) => void }) {
  const files = task.history.filter((e): e is HistoryFile => e.kind === "file");
  if (!files.length) return null;
  return (
    <Stack
      component="ul"
      direction="row"
      gap={SPACE.item}
      flexWrap="wrap"
      aria-label={`Files on ${task.description}`}
      sx={{ listStyle: "none", m: 0, p: 0 }}
    >
      {files.map((file) => (
        <li key={file.id} style={{ minWidth: 0, maxWidth: "100%" }}>
          <DocumentChip name={file.name} onOpen={() => onOpenFile(file.id)} />
        </li>
      ))}
    </Stack>
  );
}

/**
 * A task's messages, Cowork's actions and files, collapsed to one quiet row
 * on a subtle surface; open it to read the timeline.
 */
function TaskActivity({ task, now }: { task: WorkstreamTask; now: Date }) {
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);
  const muted = tokens.semantic.color.type.muted.value;
  const Caret = open ? CaretDownIcon : CaretRightIcon;
  const panelId = `activity-${task.id}`;
  if (!task.history.length) return null;
  return (
    <Box
      sx={{
        bgcolor: tokens.semantic.color.surface.subtle.value,
        borderRadius: tokens.semantic.radius.sm.value,
      }}
    >
      <ButtonBase
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Activity on ${task.description}, ${task.history.length}`}
        onClick={() => setOpen((v) => !v)}
        sx={{
          width: "100%",
          justifyContent: "flex-start",
          gap: SPACE.item,
          px: SPACE.group,
          py: SPACE.item,
          borderRadius: tokens.semantic.radius.sm.value,
          textAlign: "left",
        }}
      >
        <Caret aria-hidden style={{ width: 16, height: 16, flexShrink: 0, color: muted }} />
        <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
          Activity
        </Typography>
        <Typography variant="textMd" sx={{ color: muted }}>
          {task.history.length}
        </Typography>
      </ButtonBase>
      <Collapse in={open} id={panelId} unmountOnExit>
        <Box sx={{ px: SPACE.group, pb: SPACE.group }}>
          <TimelineList
            items={task.history.map((entry) => ({ entry }))}
            ariaLabel={`Activity on ${task.description}`}
            now={now}
            pageSize={5}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

/** The task's number in a rounded badge, so "task 2" in chat is easy to find. */
function NumberBadge({ number }: { number: number }) {
  const { tokens } = useTheme();
  return (
    <Box
      component="span"
      aria-label={`Task ${number}`}
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: tokens.semantic.color.surface.variant.value,
        color: tokens.semantic.color.type.default.value,
      }}
    >
      <Typography variant="body1" component="span" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
        {number}
      </Typography>
    </Box>
  );
}

/** A small muted label over its value. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair} sx={{ minWidth: 0 }}>
      <Typography
        variant="textMd"
        sx={{ color: tokens.semantic.color.type.muted.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

const STATUS_OPTIONS: TaskStatus[] = ["Not started", "In progress", "Done"];

/**
 * The task's status badge as a menu button. You set the base status; Needs
 * your review and Blocked come from the work itself, so they aren't options.
 */
function StatusMenu({
  task,
  label,
  onChange,
}: {
  task: WorkstreamTask;
  label: TaskDisplayLabel;
  onChange: (status: TaskStatus) => void;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <ButtonBase
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        aria-label={`Status of ${task.description}: ${label}. Change status`}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ gap: SPACE.pair, borderRadius: tokens.semantic.radius.sm.value, px: SPACE.pair, ml: -SPACE.pair }}
      >
        <StatusIndicator color={STATUS_COLOR[label]} label={label} />
        <CaretDownIcon aria-hidden style={{ width: 16, height: 16, color: tokens.semantic.color.type.muted.value }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            selected={option === task.status}
            onClick={() => {
              setAnchor(null);
              onChange(option);
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** For a task waiting on your review: a link to the file to review, after its status line. */
function ReviewFileLink({ task, onOpenFile }: { task: WorkstreamTask; onOpenFile?: (fileId: string) => void }) {
  const file =
    task.awaitingReview && task.reviewFile
      ? task.history.find((e) => e.kind === "file" && e.name === task.reviewFile)
      : undefined;
  if (!file || !onOpenFile) return null;
  return (
    <>
      {" "}
      <Link
        component="button"
        type="button"
        underline="hover"
        onClick={() => onOpenFile(file.id)}
        sx={{ font: "inherit", verticalAlign: "baseline" }}
      >
        Open the draft
      </Link>
    </>
  );
}

/** Element id a workstream link scrolls to, for `?task=`. */
export function taskAnchorId(taskId: string): string {
  return `task-row-${taskId}`;
}

function OwnerValue({ owner }: { owner: TaskOwner }) {
  const { tokens } = useTheme();
  // Cowork doesn't know who owns a new draft's tasks; you add them in chat.
  if (isUnassigned(owner)) {
    return (
      <Typography variant="body1" sx={{ color: tokens.semantic.color.type.muted.value, fontStyle: "italic" }}>
        Not assigned
      </Typography>
    );
  }
  return (
    <Stack>
      <Typography variant="body1">{owner.label}</Typography>
      {/* Just the email: we don't know their title. */}
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
        {owner.id.replace(/^email:/, "")}
      </Typography>
    </Stack>
  );
}

/** Owner name (first and last in one field) and email, typed in on a draft's task. */
function OwnerEntryFields({
  entry,
  onChange,
  taskName,
}: {
  entry: OwnerEntry;
  onChange: (entry: OwnerEntry) => void;
  taskName: string;
}) {
  return (
    <Stack gap={SPACE.item}>
      <TextField
        size="small"
        fullWidth
        label="Owner name"
        value={entry.name}
        onChange={(e) => onChange({ ...entry, name: e.target.value })}
        slotProps={{ htmlInput: { "aria-label": `Owner name for ${taskName}` } }}
      />
      <TextField
        size="small"
        fullWidth
        type="email"
        label="Owner email"
        value={entry.email}
        onChange={(e) => onChange({ ...entry, email: e.target.value })}
        slotProps={{ htmlInput: { "aria-label": `Owner email for ${taskName}` } }}
      />
    </Stack>
  );
}
