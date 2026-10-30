import { Stack, useTheme } from "@mui/material";

import type { ProjectTask, TaskStatus } from "@/projects/project";
import { taskAttention } from "@/projects/taskStatus";

const STATUS_COLOR: Record<TaskStatus, "subtle" | "information" | "success"> = {
  "Not started": "subtle",
  "In progress": "information",
  Done: "success",
};

/** Status plus, when it needs the GC, an Overdue or New status badge. */
export function TaskBadges({ task, now }: { task: ProjectTask; now: Date }) {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const attention = taskAttention(task, now);
  return (
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
      <StatusIndicator color={STATUS_COLOR[task.status]} label={task.status} />
      {attention === "overdue" ? <StatusIndicator color="error" label="Overdue" /> : null}
      {attention === "new-status" ? <StatusIndicator color="information" label="New status" /> : null}
    </Stack>
  );
}
