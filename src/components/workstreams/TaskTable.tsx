import {
  Box,
  Link,
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
import { Fragment } from "react";

import { formatDate } from "@/lib/dates";
import { SPACE } from "@/lib/layout";
import { taskDisplayStatus, type TaskDisplayLabel } from "@/workstreams/taskStatus";
import type { WorkstreamTask } from "@/workstreams/workstream";
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
  summarize,
  highlightTaskId,
  ariaLabel = "Tasks",
}: {
  tasks: WorkstreamTask[];
  /** "done-when" for a draft; "status" once it's started. */
  detail: "done-when" | "status";
  ariaLabel?: string;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  /** Opens the task's activity log. */
  onOpenActivity?: (taskId: string) => void;
  /** The status line for a task, for the "status" detail. */
  summarize?: (task: WorkstreamTask) => string;
  /** The task a link opened the page on; its rows are tinted. */
  highlightTaskId?: string;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const highlight = tokens.component.statusIndicator.colors.information.backgroundColor.value;
  const muted = tokens.semantic.color.type.muted.value;
  const ordered = [...tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));

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
            <TableCell sx={{ width: "32%" }}>Task</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>CC</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordered.map((task) => {
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
                  <TableCell sx={{ whiteSpace: "normal" }}>{task.ccs.map((cc) => cc.label).join(", ")}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(task.deadline)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <StatusIndicator color={STATUS_COLOR[status.label]} label={status.label} />
                  </TableCell>
                </TableRow>
                <TableRow className="task-detail" sx={rowSx}>
                  <TableCell colSpan={5} sx={{ pt: 0, whiteSpace: "normal" }}>
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
                          (summarize?.(task) ?? "")
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
