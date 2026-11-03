import {
  Alert,
  Breadcrumbs,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Link,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useParams } from "react-router";

import { SideChatLayout } from "@/components/chat/SideChatLayout";
import { SectionCard } from "@/components/workstreams/SectionCard";
import { TaskBadges } from "@/components/tasks/TaskBadges";
import { TaskDetailsCard } from "@/components/tasks/TaskDetailsCard";
import { HistoryList } from "@/components/tasks/History";
import type { WorkstreamTask } from "@/workstreams/workstream";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { handleTaskChatMessage, seedTaskChat, taskChatId } from "@/workstreams/taskChat";
import { summarizeTask } from "@/workstreams/taskStatus";
import { CHANNEL_LABEL, isMessage } from "@/workstreams/thread";
import { SPACE } from "@/lib/layout";

export default function TaskPage() {
  const { workstreamId = "", taskId = "" } = useParams<{
    workstreamId: string;
    taskId: string;
  }>();
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.id === workstreamId));
  const task = workstream?.plan.tasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (task) seedTaskChat(task);
    // Seed once per task; later edits to the task shouldn't re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (!workstream || !task) {
    return (
      <Stack gap={SPACE.item} sx={{ p: SPACE.section }} alignItems="flex-start">
        <Typography variant="body1">Task not found.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }

  return (
    <SideChatLayout
      chatId={taskChatId(task.id)}
      onUserMessage={(text) => handleTaskChatMessage(workstream.id, task.id, text, new Date())}
    >
      <TaskDetail workstreamId={workstream.id} workstreamName={workstream.name} task={task} />
    </SideChatLayout>
  );
}

function TaskDetail({
  workstreamId,
  workstreamName,
  task,
}: {
  workstreamId: string;
  workstreamName: string;
  task: WorkstreamTask;
}) {
  const { tokens } = useTheme();
  const location = useLocation();
  const { assignTask, setTaskStatus, nudgeTask, messageDelegate, confirmTaskDone } = useWorkstreamStore.getState();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const now = new Date();
  const ownerFirst = task.delegate.label.split(" ")[0];
  const channels = [...new Set(task.history.filter(isMessage).map((m) => m.channel))];

  useEffect(() => {
    if (location.hash === "#history") document.getElementById("history")?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    messageDelegate(workstreamId, task.id, text);
    setDraft("");
    setComposing(false);
    setToast(`Message sent to ${task.delegate.label}.`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: SPACE.section }}>
      <Stack gap={SPACE.section}>
        <Stack gap={SPACE.item}>
          <Breadcrumbs aria-label="Breadcrumbs">
            <Link component={RouterLink} to={`/workstreams/${workstreamId}`} underline="hover">
              {workstreamName}
            </Link>
            <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
              Task
            </Typography>
          </Breadcrumbs>
          <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {task.description}
          </Typography>
          <TaskBadges task={task} now={now} />
        </Stack>

        <Stack gap={SPACE.block}>
          {task.awaitingReview ? (
            <Alert
              severity="warning"
              action={
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    confirmTaskDone(workstreamId, task.id);
                    setToast("Task closed. Cowork recorded your confirmation.");
                  }}
                >
                  Confirm and close
                </Button>
              }
            >
              {task.delegate.label} says this is done. Review what was sent to you, then confirm to close the task.
            </Alert>
          ) : null}

          <SectionCard title="Status Summary">
            <Typography variant="body1">{summarizeTask(task, now)}</Typography>
          </SectionCard>

          <TaskDetailsCard
            task={task}
            onAssign={(owner) => {
              assignTask(workstreamId, task.id, owner);
              setToast(`Assigned to ${owner.label}. Cowork emailed them.`);
            }}
            onStatusChange={(status) => setTaskStatus(workstreamId, task.id, status)}
          />

          <Box id="history" sx={{ scrollMarginTop: (theme) => theme.spacing(SPACE.block) }}>
            <SectionCard
              title={`History (${task.history.length})`}
              action={
                <Stack direction="row" gap={SPACE.item}>
                  <Button variant="outlined" size="small" onClick={() => setComposing((v) => !v)}>
                    Message {ownerFirst}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      nudgeTask(workstreamId, task.id);
                      setToast(`Nudge sent to ${task.delegate.label}.`);
                    }}
                  >
                    Nudge / follow up
                  </Button>
                </Stack>
              }
            >
              <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
                Every message with {task.delegate.label}, every action Cowork took, and every file added. Channels:{" "}
                {channels.map((c) => CHANNEL_LABEL[c]).join(", ") || "none yet"}.
              </Typography>

              {composing ? (
                <Stack gap={SPACE.item}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="message-owner">Message to {task.delegate.label}</FormLabel>
                    <TextField
                      multiline
                      minRows={2}
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      slotProps={{ input: { id: "message-owner" } }}
                    />
                  </FormControl>
                  <Stack direction="row" gap={SPACE.item} justifyContent="flex-end">
                    <Button variant="outlined" size="small" onClick={() => setComposing(false)}>
                      Cancel
                    </Button>
                    <Button variant="contained" size="small" onClick={sendMessage} disabled={!draft.trim()}>
                      Send by email
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              <HistoryList items={task.history.map((entry) => ({ entry }))} ariaLabel="Task history" />
            </SectionCard>
          </Box>
        </Stack>
      </Stack>

      <Snackbar open={toast !== null} autoHideDuration={5000} onClose={() => setToast(null)}>
        <Alert severity="success" aria-live="polite" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  );
}
