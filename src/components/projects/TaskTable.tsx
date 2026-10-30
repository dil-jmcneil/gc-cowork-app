import {
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";

import { formatDate } from "@/lib/dates";
import type { ProjectTask, TaskStatus } from "@/projects/project";
import { TASK_OWNERS } from "@/projects/projectDraft";

const STATUS_COLOR: Record<TaskStatus, "subtle" | "information" | "success"> = {
  "Not started": "subtle",
  "In progress": "information",
  Done: "success",
};

/** Compact task list. Pass `onOwnerChange` to make the owner editable. */
export function TaskTable({
  tasks,
  onOwnerChange,
}: {
  tasks: ProjectTask[];
  onOwnerChange?: (taskId: string, owner: string) => void;
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
              <TableCell>{task.description}</TableCell>
              <TableCell sx={{ minWidth: 200 }}>
                {onOwnerChange ? (
                  <Select
                    size="small"
                    fullWidth
                    value={task.delegate}
                    onChange={(event) => onOwnerChange(task.id, event.target.value)}
                    inputProps={{ "aria-label": `Owner of ${task.description}` }}
                  >
                    {TASK_OWNERS.map((owner) => (
                      <MenuItem key={owner} value={owner}>
                        {owner}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  task.delegate
                )}
              </TableCell>
              <TableCell>{task.ccs.join(", ")}</TableCell>
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
