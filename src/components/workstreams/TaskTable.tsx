import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";
import {
  Box,
  ButtonBase,
  Link,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { Fragment, useState } from "react";

import { formatDate } from "@/lib/dates";
import { SPACE } from "@/lib/layout";
import { orderedTasks, taskDisplayStatus, type TaskDisplayLabel } from "@/workstreams/taskStatus";
import type { TaskStatus, WorkstreamTask } from "@/workstreams/workstream";
import type { TaskOwner } from "@/workstreams/people";

import { OwnerTypeahead } from "./OwnerTypeahead";

const STATUS_COLOR: Record<TaskDisplayLabel, "subtle" | "information" | "warning" | "error" | "success"> = {
  "Not started": "subtle",
  "In progress": "information",
  "Needs your review": "warning",
  Blocked: "error",
  Done: "success",
};

/**
 * The plan's tasks, in deadline order: task, owner, CC, deadline and status,
 * then a second line. In a draft that line says what done looks like; once
 * the workstream has started it's Cowork's summary of where the task stands,
 * with a link to its activity log. Pass `onOwnerChange` to make owners editable.
 */
export function TaskTable({
  tasks,
  detail,
  onOwnerChange,
  onOpenActivity,
  onOpenFile,
  onStatusChange,
  summarize,
  highlightTaskId,
  showCc = false,
  ariaLabel = "Tasks",
}: {
  tasks: WorkstreamTask[];
  /** "done-when" for a draft; "status" once it's started. */
  detail: "done-when" | "status";
  ariaLabel?: string;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  /** Opens the task's activity log. */
  onOpenActivity?: (taskId: string) => void;
  /** Makes each status a menu: Not started, In progress, Done. */
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  /** Opens a file; a task waiting on your review links its file from the status line. */
  onOpenFile?: (fileId: string) => void;
  /** The status line for a task, for the "status" detail. */
  summarize?: (task: WorkstreamTask) => string;
  /** Post-MVP: a CC column. The MVP shows the owner only. */
  showCc?: boolean;
  /** The task a link opened the page on; its rows are tinted. */
  highlightTaskId?: string;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const highlight = tokens.component.statusIndicator.colors.information.backgroundColor.value;
  const muted = tokens.semantic.color.type.muted.value;
  // Numbered in the same order chat uses: "task 2" is the second row.
  const ordered = orderedTasks(tasks);
  const columns = showCc ? 6 : 5;

  return (
    <TableContainer>
      <Table
        size="small"
        aria-label={ariaLabel}
        sx={(theme) => ({
          "& .MuiTableCell-body": theme.typography.body1,
          // Each task is two rows: no divider between them, one under the pair, none under the last.
          "& .task-main .MuiTableCell-root": { borderBottom: "none", pb: SPACE.pair },
          "& .MuiTableBody-root .task-detail:last-of-type .MuiTableCell-root": { borderBottom: "none" },
        })}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 32, pr: 0 }} aria-label="Number">
              #
            </TableCell>
            <TableCell sx={{ width: "34%" }}>Task</TableCell>
            <TableCell>Owner</TableCell>
            {showCc ? <TableCell>CC</TableCell> : null}
            <TableCell>Deadline</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordered.map((task, index) => {
            // A draft hasn't started, so nothing is blocked yet: show each task's own status.
            const status = detail === "done-when" ? { label: task.status } : taskDisplayStatus(task, tasks);
            const highlighted = task.id === highlightTaskId;
            const rowSx = highlighted ? { bgcolor: highlight } : undefined;
            return (
              <Fragment key={task.id}>
                <TableRow
                  id={taskAnchorId(task.id)}
                  className="task-main"
                  aria-current={highlighted ? "true" : undefined}
                  sx={rowSx}
                >
                  <TableCell sx={{ pr: 0, color: muted, fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "normal", fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                    {task.description}
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    {onOwnerChange ? (
                      <OwnerTypeahead
                        value={task.delegate}
                        onChange={(owner) => onOwnerChange(task.id, owner)}
                        ariaLabel={`Owner of ${task.description}`}
                      />
                    ) : (
                      <OwnerCell owner={task.delegate} />
                    )}
                  </TableCell>
                  {showCc ? (
                    <TableCell sx={{ whiteSpace: "normal" }}>{task.ccs.map((cc) => cc.label).join(", ")}</TableCell>
                  ) : null}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(task.deadline)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {onStatusChange ? (
                      <StatusMenu task={task} label={status.label} onChange={(next) => onStatusChange(task.id, next)} />
                    ) : (
                      <StatusIndicator color={STATUS_COLOR[status.label]} label={status.label} />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="task-detail" sx={rowSx}>
                  <TableCell />
                  <TableCell colSpan={columns - 1} sx={{ pt: 0, whiteSpace: "normal" }}>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={SPACE.block}>
                      <Typography variant="body1" sx={{ color: muted }}>
                        {detail === "done-when" ? (
                          <>
                            <Box component="span" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
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
                      {detail === "status" && onOpenActivity ? (
                        <Link
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => onOpenActivity(task.id)}
                          aria-label={`Open activity log for ${task.description}`}
                          sx={{ flexShrink: 0, font: "inherit" }}
                        >
                          Open activity log
                        </Link>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
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

function OwnerCell({ owner }: { owner: TaskOwner }) {
  const { tokens } = useTheme();
  return (
    <Stack>
      <Typography variant="body1">{owner.label}</Typography>
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
        {owner.detail.split(" · ")[0]}
      </Typography>
    </Stack>
  );
}
