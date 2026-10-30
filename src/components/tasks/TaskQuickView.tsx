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
import { useProjectStore } from "@/projects/projectStore";
import { summarizeTask, taskAttention } from "@/projects/taskStatus";
import { CHANNEL_LABEL } from "@/projects/thread";

import { PersonLine } from "./PersonLine";
import { TaskBadges } from "./TaskBadges";

export type TaskRef = { projectId: string; taskId: string };

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
  const project = useProjectStore((s) => (taskRef ? s.projects.find((p) => p.id === taskRef.projectId) : undefined));
  const task = project?.plan.tasks.find((t) => t.id === taskRef?.taskId);
  const nudgeTask = useProjectStore((s) => s.nudgeTask);

  if (!taskRef || !project || !task) return null;

  const now = new Date();
  const latest = task.thread[task.thread.length - 1];
  const taskHref = `/projects/${project.id}/tasks/${task.id}`;
  const muted = tokens.semantic.color.type.muted.value;
  const overdue = taskAttention(task, now) === "overdue";

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack gap={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h2">
            {task.description}
          </Typography>
          <Link
            component={RouterLink}
            to={`/projects/${project.id}`}
            onClick={onClose}
            underline="hover"
            sx={{ alignSelf: "flex-start" }}
          >
            <Typography variant="textMd" sx={{ color: "inherit" }}>
              {project.name}
            </Typography>
          </Link>
        </Stack>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack gap={2.5}>
          <TaskBadges task={task} now={now} />

          <Box
            sx={{
              bgcolor: tokens.semantic.color.surface.subtle.value,
              borderRadius: tokens.semantic.radius.lg.value,
              p: 2,
            }}
          >
            <Stack gap={0.5}>
              <SectionLabel>Status Summary</SectionLabel>
              <Typography variant="textMd">{summarizeTask(task, now)}</Typography>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Field label="Owner">
              <PersonLine name={task.delegate.label} detail={task.delegate.detail} />
            </Field>
            <Field label="Due">
              <Typography variant="textMd">{formatDate(task.deadline)}</Typography>
            </Field>
            <Field label="Delegated by">
              <Typography variant="textMd">{task.delegator}</Typography>
            </Field>
            <Field label="CC">
              <Typography variant="textMd">
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
                variant="textMd"
                sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {latest.body}
              </Typography>
              <Link component={RouterLink} to={`${taskHref}#thread`} onClick={onClose} underline="hover">
                <Typography variant="textMd" sx={{ color: "inherit" }}>
                  View thread ({task.thread.length})
                </Typography>
              </Link>
            </Field>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        {overdue ? (
          <Button
            variant="outlined"
            onClick={() => {
              nudgeTask(project.id, task.id);
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
    <Stack gap={0.5} sx={{ minWidth: 0 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </Stack>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Typography
      variant="textSm"
      sx={{
        color: tokens.semantic.color.type.muted.value,
        fontWeight: tokens.semantic.fontWeight.emphasis.value,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}
