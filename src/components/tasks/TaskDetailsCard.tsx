import { Button, Card, CardContent, Link, MenuItem, Select, Stack, Typography, useTheme } from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { OwnerTypeahead } from "@/components/workstreams/OwnerTypeahead";
import { FieldLabel } from "@/components/workstreams/SectionCard";
import { formatDate } from "@/lib/dates";
import type { TaskOwner } from "@/workstreams/people";
import type { WorkstreamTask, TaskStatus } from "@/workstreams/workstream";
import { SPACE } from "@/lib/layout";

import { PersonLine } from "./PersonLine";

const STATUSES: TaskStatus[] = ["Not started", "In progress", "Done"];

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
  task: WorkstreamTask;
  onAssign: (owner: TaskOwner) => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const [assigning, setAssigning] = useState(false);

  return (
    <Card component="section" aria-label="Task details" sx={{ p: 0 }}>
      <CardContent sx={{ p: SPACE.block, "&:last-child": { pb: SPACE.block } }}>
        <Stack gap={SPACE.group}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={SPACE.group}
            flexWrap="wrap"
            sx={{ minHeight: 32 }}
          >
            {assigning ? (
              <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ flex: 1, maxWidth: 420 }}>
                <OwnerTypeahead
                  value={task.delegate}
                  ariaLabel="Owner"
                  onChange={(owner) => {
                    if (owner.id !== task.delegate.id) onAssign(owner);
                    setAssigning(false);
                  }}
                />
                <Button variant="text" size="small" onClick={() => setAssigning(false)}>
                  Cancel
                </Button>
              </Stack>
            ) : (
              <PersonLine name={task.delegate.label} detail={task.delegate.detail} wrap />
            )}
            {assigning ? null : (
              <Button variant="text" size="small" onClick={() => setAssigning(true)}>
                Assign
              </Button>
            )}
          </Stack>

          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            gap={SPACE.section}
            flexWrap="wrap"
          >
            <Stack direction="row" gap={SPACE.section} flexWrap="wrap" sx={{ rowGap: SPACE.group }}>
              <Field label="Delegated By">{task.delegator}</Field>
              <Field label="CC">{task.ccs.length ? task.ccs.map((c) => c.label).join(", ") : "No one"}</Field>
              <Field label="Deadline">
                <Stack direction="row" alignItems="baseline" gap={SPACE.item}>
                  <span>{formatDate(task.deadline)}</span>
                  <Link component={RouterLink} to={`/compliance-calendar?date=${task.deadline}`} underline="hover">
                    View on calendar
                  </Link>
                </Stack>
              </Field>
            </Stack>
            <Stack gap={SPACE.pair} sx={{ minWidth: 180 }}>
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
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair} sx={{ minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <Typography variant="body1" component="div" sx={{ color: tokens.semantic.color.type.default.value }}>
        {children}
      </Typography>
    </Stack>
  );
}
