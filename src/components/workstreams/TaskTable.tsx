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
import type { WorkstreamTask, TaskStatus } from "@/workstreams/workstream";
import type { TaskOwner } from "@/workstreams/people";

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
  ariaLabel = "Tasks",
}: {
  tasks: WorkstreamTask[];
  ariaLabel?: string;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  /** Makes each task's description open it, e.g. in the quick view. */
  onOpenTask?: (taskId: string) => void;
}) {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

  return (
    <TableContainer>
      <Table size="small" aria-label={ariaLabel} sx={(theme) => ({ "& .MuiTableCell-body": theme.typography.body1 })}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "38%" }}>Task</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>CC</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell sx={{ whiteSpace: "normal" }}>
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
      <Typography variant="body1">{owner.label}</Typography>
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
        {owner.detail.split(" · ")[0]}
      </Typography>
    </Stack>
  );
}
