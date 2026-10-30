import {
  Avatar,
  Box,
  Button,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { OwnerTypeahead } from "@/components/projects/OwnerTypeahead";
import { formatDate } from "@/lib/dates";
import type { TaskOwner } from "@/projects/people";
import type { ProjectTask, TaskStatus } from "@/projects/project";

const STATUSES: TaskStatus[] = ["Not started", "In progress", "Done"];

function initials(name: string): string {
  const parts = name
    .replace(/^@/, "")
    .split(/[\s.@]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Horizontal task details, laid out like the Figma attention-pane card: the
 * owner on top with Assign at the right, then the other details in a row with
 * the status control at the right.
 */
export function TaskDetailsCard({
  task,
  onAssign,
  onStatusChange,
}: {
  task: ProjectTask;
  onAssign: (owner: TaskOwner) => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const { tokens } = useTheme();
  const [assigning, setAssigning] = useState(false);
  const muted = tokens.semantic.color.type.muted.value;

  return (
    <Box
      component="section"
      aria-label="Task details"
      sx={{
        bgcolor: tokens.semantic.color.surface.default.value,
        border: `1px solid ${tokens.semantic.color.action.secondary.outlineDisabled.value}`,
        borderRadius: tokens.semantic.radius.lg.value,
        p: 3,
      }}
    >
      <Stack gap={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
          flexWrap="wrap"
          sx={{ minHeight: 32 }}
        >
          {assigning ? (
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ flex: 1, maxWidth: 420 }}
            >
              <OwnerTypeahead
                value={task.delegate}
                ariaLabel="Owner"
                onChange={(owner) => {
                  if (owner.id !== task.delegate.id) onAssign(owner);
                  setAssigning(false);
                }}
              />
              <Button
                variant="text"
                size="small"
                onClick={() => setAssigning(false)}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
              sx={{ color: muted, minWidth: 0 }}
            >
              <Avatar sx={{ width: 24, height: 24, fontSize: 11 }} aria-hidden>
                {initials(task.delegate.label)}
              </Avatar>
              <Typography
                variant="body1"
                sx={{
                  color: "inherit",
                  fontWeight: tokens.semantic.fontWeight.bold.value,
                }}
              >
                {task.delegate.label}
              </Typography>
              <Typography variant="body1" aria-hidden sx={{ color: "inherit" }}>
                ·
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "inherit", overflowWrap: "anywhere" }}
              >
                {task.delegate.detail}
              </Typography>
            </Stack>
          )}
          {assigning ? null : (
            <Button
              variant="text"
              size="small"
              onClick={() => setAssigning(true)}
            >
              Assign
            </Button>
          )}
        </Stack>

        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          gap={5}
          flexWrap="wrap"
        >
          <Stack direction="row" gap={5} flexWrap="wrap" sx={{ rowGap: 2 }}>
            <Field label="Delegated By">{task.delegator}</Field>
            <Field label="CC">
              {task.ccs.length
                ? task.ccs.map((c) => c.label).join(", ")
                : "No one"}
            </Field>
            <Field label="Deadline">
              <Stack direction="row" alignItems="baseline" gap={1.5}>
                <span>{formatDate(task.deadline)}</span>
                <Link
                  component={RouterLink}
                  to={`/compliance-calendar?date=${task.deadline}`}
                  underline="hover"
                >
                  View on calendar
                </Link>
              </Stack>
            </Field>
          </Stack>
          <Stack gap={0.5} sx={{ minWidth: 180 }}>
            <FieldLabel id="task-status-label">Status</FieldLabel>
            <Select
              size="small"
              labelId="task-status-label"
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            >
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={0.5} sx={{ minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <Typography
        variant="body1"
        component="div"
        sx={{ color: tokens.semantic.color.type.default.value }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

function FieldLabel({ id, children }: { id?: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Typography
      id={id}
      variant="textMd"
      sx={{
        color: tokens.semantic.color.type.muted.value,
        fontWeight: tokens.semantic.fontWeight.emphasis.value,
      }}
    >
      {children}
    </Typography>
  );
}
