import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";

import { DETAIL_DIALOG_PAPER, SPACE } from "@/lib/layout";
import { orderedTasks } from "@/workstreams/taskStatus";
import type { WorkstreamTask } from "@/workstreams/workstream";

import { TimelineList } from "./Timeline";

const ALL_TASKS = "all";

/** A task's label in the filter and on its entries: its number and name, as the plan shows them. */
function taskLabel(number: number, task: WorkstreamTask): string {
  return `${number} · ${task.description}`;
}

/**
 * The workstream's activity log: every message, Cowork action and file on its
 * tasks, newest first. A dropdown narrows it from all tasks to one, by number
 * and name.
 */
export function ActivityLogDialog({
  open,
  tasks,
  now,
  onClose,
}: {
  open: boolean;
  tasks: WorkstreamTask[];
  now: Date;
  onClose: () => void;
}) {
  const { tokens } = useTheme();
  const [taskId, setTaskId] = useState<string>(ALL_TASKS);
  if (!open) return null;

  const numbered = orderedTasks(tasks).map((task, i) => ({ task, label: taskLabel(i + 1, task) }));
  const shown = taskId === ALL_TASKS ? numbered : numbered.filter(({ task }) => task.id === taskId);
  // With every task shown, each entry says which task it's on.
  const items = shown.flatMap(({ task, label }) =>
    task.history.map((entry) => ({ entry, context: taskId === ALL_TASKS ? label : undefined })),
  );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: DETAIL_DIALOG_PAPER }}>
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          gap={SPACE.block}
          sx={{ width: "100%" }}
        >
          {/* The Atlas dialog title styles any h2 at 22px; keep the 18px h4. */}
          <Typography
            variant="h4"
            component="h2"
            sx={(theme) => ({
              "&.MuiTypography-root": { ...theme.typography.h4, fontWeight: tokens.semantic.fontWeight.emphasis.value },
            })}
          >
            Activity log
          </Typography>
          <Select
            size="small"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            inputProps={{ "aria-label": "Show activity for" }}
            sx={{ minWidth: 320 }}
          >
            <MenuItem value={ALL_TASKS}>All tasks</MenuItem>
            {numbered.map(({ task, label }) => (
              <MenuItem key={task.id} value={task.id}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: (theme) => theme.spacing(SPACE.group),
            right: (theme) => theme.spacing(SPACE.group),
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* A fresh list per filter, so it starts again on the latest 10. */}
        <TimelineList key={taskId} items={items} ariaLabel="Activity log" now={now} initialStep="ten" />
      </DialogContent>
    </Dialog>
  );
}
