import {
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

import { formatDate } from "@/lib/dates";
import type { ProjectTask, TaskStatus } from "@/projects/project";
import type { TaskOwner } from "@/projects/people";

import { OwnerTypeahead } from "./OwnerTypeahead";

const STATUS_COLOR: Record<TaskStatus, "subtle" | "information" | "success"> = {
  "Not started": "subtle",
  "In progress": "information",
  Done: "success",
};

/** Compact task list. Pass `onOwnerChange` to make the owner editable. */
export function TaskTable({
  tasks,
  onOwnerChange,
  onOpenTask,
}: {
  tasks: ProjectTask[];
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  /** Makes each task's description open it, e.g. in the quick view. */
  onOpenTask?: (taskId: string) => void;
}) {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

  return (
    <TableContainer>
      <Table size="small" aria-label="Tasks">
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>CC</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                {onOpenTask ? (
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => onOpenTask(task.id)}
                    sx={{ textAlign: "left", font: "inherit" }}
                  >
                    {task.description}
                  </Link>
                ) : (
                  task.description
                )}
              </TableCell>
              <TableCell sx={{ minWidth: 220 }}>
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
              <TableCell>{task.ccs.map((cc) => cc.label).join(", ")}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(task.deadline)}</TableCell>
              <TableCell>
                <StatusIndicator color={STATUS_COLOR[task.status]} label={task.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function OwnerCell({ owner }: { owner: TaskOwner }) {
  const { tokens } = useTheme();
  return (
    <Stack>
      <Typography variant="textMd">{owner.label}</Typography>
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
        {owner.kind === "directory" ? owner.detail.split(" · ")[0] : owner.detail}
      </Typography>
    </Stack>
  );
}
