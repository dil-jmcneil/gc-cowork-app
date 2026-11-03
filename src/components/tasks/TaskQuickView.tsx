import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router";

import { formatDate } from "@/lib/dates";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { summarizeTask, taskAttention } from "@/workstreams/taskStatus";
import { CHANNEL_LABEL, isMessage } from "@/workstreams/thread";

import { FieldLabel } from "@/components/workstreams/SectionCard";

import { PersonLine } from "./PersonLine";
import { TaskBadges } from "./TaskBadges";
import { DETAIL_DIALOG_PAPER, SPACE } from "@/lib/layout";

export type TaskRef = { workstreamId: string; taskId: string };

const WHEN = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/** Quick look at a task: status summary, badges, owner, and the headline details. */
export function TaskQuickView({
  taskRef,
  onClose,
  onNudge,
}: {
  taskRef: TaskRef | null;
  onClose: () => void;
  /** Called after the owner is nudged, e.g. to show a toast. */
  onNudge?: (ownerName: string) => void;
}) {
  const { tokens } = useTheme();
  const navigate = useNavigate();
  const workstream = useWorkstreamStore((s) =>
    taskRef ? s.workstreams.find((p) => p.id === taskRef.workstreamId) : undefined,
  );
  const task = workstream?.plan.tasks.find((t) => t.id === taskRef?.taskId);
  const nudgeTask = useWorkstreamStore((s) => s.nudgeTask);
  const confirmTaskDone = useWorkstreamStore((s) => s.confirmTaskDone);

  if (!taskRef || !workstream || !task) return null;

  const now = new Date();
  const messages = task.history.filter(isMessage);
  const latest = messages[messages.length - 1];
  const taskHref = `/workstreams/${workstream.id}/tasks/${task.id}`;
  const muted = tokens.semantic.color.type.muted.value;
  const overdue = taskAttention(task, now) === "overdue";

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: DETAIL_DIALOG_PAPER }}>
      {/* 48px right padding leaves room for the close button. */}
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack gap={SPACE.pair} alignItems="flex-start" sx={{ width: "100%", minWidth: 0, textAlign: "left" }}>
          {/* The Atlas dialog title styles any h2 at 22px; keep the 18px h4. */}
          <Typography
            variant="h4"
            component="h2"
            sx={(theme) => ({
              "&.MuiTypography-root": { ...theme.typography.h4, fontWeight: tokens.semantic.fontWeight.emphasis.value },
            })}
          >
            {task.description}
          </Typography>
          <Link
            component={RouterLink}
            to={`/workstreams/${workstream.id}`}
            onClick={onClose}
            underline="hover"
            sx={{ alignSelf: "flex-start" }}
          >
            <Typography variant="body1" sx={{ color: "inherit" }}>
              {workstream.name}
            </Typography>
          </Link>
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
        <Stack gap={SPACE.block}>
          <TaskBadges task={task} now={now} />

          <Box
            sx={{
              bgcolor: tokens.semantic.color.surface.subtle.value,
              borderRadius: tokens.semantic.radius.lg.value,
              p: SPACE.block,
            }}
          >
            <Stack gap={SPACE.pair}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                Status Summary
              </Typography>
              <Typography variant="body1">{summarizeTask(task, now)}</Typography>
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr" },
              gap: SPACE.block,
            }}
          >
            <Field label="Owner">
              <PersonLine name={task.delegate.label} detail={task.delegate.detail} wrap />
            </Field>
            <Field label="Due">
              <Typography variant="body1">{formatDate(task.deadline)}</Typography>
            </Field>
            <Field label="Delegated by">
              <Typography variant="body1">{task.delegator}</Typography>
            </Field>
            <Field label="CC">
              <Typography variant="body1">
                {task.ccs.length ? task.ccs.map((c) => c.label).join(", ") : "No one"}
              </Typography>
            </Field>
          </Box>

          {latest ? (
            <Field label="Latest Message">
              <Typography variant="textMd" sx={{ color: muted }}>
                {latest.authorName} · {CHANNEL_LABEL[latest.channel]} · {WHEN.format(new Date(latest.sentAt))}
              </Typography>
              <Typography
                variant="body1"
                sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {latest.body}
              </Typography>
              <Link component={RouterLink} to={`${taskHref}#history`} onClick={onClose} underline="hover">
                <Typography variant="body1" sx={{ color: "inherit" }}>
                  View history ({task.history.length})
                </Typography>
              </Link>
            </Field>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        {task.awaitingReview ? (
          <Button variant="outlined" onClick={() => confirmTaskDone(workstream.id, task.id)}>
            Confirm and close
          </Button>
        ) : null}
        {overdue && !task.awaitingReview ? (
          <Button
            variant="outlined"
            onClick={() => {
              nudgeTask(workstream.id, task.id);
              onNudge?.(task.delegate.label);
            }}
          >
            Nudge {task.delegate.label.split(" ")[0]}
          </Button>
        ) : null}
        <Button
          variant="contained"
          onClick={() => {
            onClose();
            navigate(taskHref);
          }}
        >
          Open task
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={SPACE.pair} sx={{ minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Stack>
  );
}
