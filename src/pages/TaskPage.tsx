import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  GridLegacy as Grid,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useParams } from "react-router";

import { SideChatLayout } from "@/components/chat/SideChatLayout";
import { OwnerTypeahead } from "@/components/projects/OwnerTypeahead";
import { FieldLabel, SectionCard } from "@/components/projects/SectionCard";
import { PersonLine } from "@/components/tasks/PersonLine";
import { TaskBadges } from "@/components/tasks/TaskBadges";
import { ThreadMessage } from "@/components/tasks/ThreadMessages";
import { formatDate } from "@/lib/dates";
import type { ProjectTask, TaskStatus } from "@/projects/project";
import { useProjectStore } from "@/projects/projectStore";
import { handleTaskChatMessage, seedTaskChat, taskChatId } from "@/projects/taskChat";
import { summarizeTask } from "@/projects/taskStatus";
import { CHANNEL_LABEL } from "@/projects/thread";

const STATUSES: TaskStatus[] = ["Not started", "In progress", "Done"];

export default function TaskPage() {
  const { projectId = "", taskId = "" } = useParams<{ projectId: string; taskId: string }>();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const task = project?.plan.tasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (task) seedTaskChat(task);
    // Seed once per task; later edits to the task shouldn't re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (!project || !task) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">Task not found.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }

  return (
    <SideChatLayout
      chatId={taskChatId(task.id)}
      onUserMessage={(text) => handleTaskChatMessage(project.id, task.id, text, new Date())}
    >
      <TaskDetail projectId={project.id} projectName={project.name} task={task} />
    </SideChatLayout>
  );
}

function TaskDetail({ projectId, projectName, task }: { projectId: string; projectName: string; task: ProjectTask }) {
  const { tokens, presets } = useTheme();
  const location = useLocation();
  const { assignTask, setTaskStatus, nudgeTask, messageDelegate } = useProjectStore.getState();
  const [assigning, setAssigning] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const now = new Date();
  const ownerFirst = task.delegate.label.split(" ")[0];
  const channels = [...new Set(task.thread.map((m) => m.channel))];

  useEffect(() => {
    if (location.hash === "#thread") document.getElementById("thread")?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    messageDelegate(projectId, task.id, text);
    setDraft("");
    setComposing(false);
    setToast(`Message sent to ${task.delegate.label}.`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Stack gap={1}>
          <Link component={RouterLink} to={`/projects/${projectId}`} underline="hover" sx={{ alignSelf: "flex-start" }}>
            <Typography variant="textMd" sx={{ color: "inherit" }}>
              {projectName}
            </Typography>
          </Link>
          <Typography variant="h4" component="h1">
            {task.description}
          </Typography>
          <TaskBadges task={task} now={now} />
        </Stack>

        <Grid {...presets.GridPresets.page}>
          <Grid item sm={4} md={8} lg={5} xl={8}>
            <Stack gap={2}>
              <SectionCard title="Status summary">
                <Typography variant="textMd">{summarizeTask(task, now)}</Typography>
              </SectionCard>

              <Box id="thread" sx={{ scrollMarginTop: 16 }}>
                <SectionCard
                  title={`Communication thread (${task.thread.length})`}
                  action={
                    <Stack direction="row" gap={1}>
                      <Button variant="outlined" size="small" onClick={() => setComposing((v) => !v)}>
                        Message {ownerFirst}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          nudgeTask(projectId, task.id);
                          setToast(`Nudge sent to ${task.delegate.label}.`);
                        }}
                      >
                        Nudge / follow up
                      </Button>
                    </Stack>
                  }
                >
                  <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
                    Cowork records every message between you and {task.delegate.label}, routes it to the right
                    channel, and follows up. Channels: {channels.map((c) => CHANNEL_LABEL[c]).join(", ") || "none yet"}.
                  </Typography>

                  {composing ? (
                    <Stack gap={1}>
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
                      <Stack direction="row" gap={1} justifyContent="flex-end">
                        <Button variant="outlined" size="small" onClick={() => setComposing(false)}>
                          Cancel
                        </Button>
                        <Button variant="contained" size="small" onClick={sendMessage} disabled={!draft.trim()}>
                          Send by email
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}

                  <Stack component="ol" gap={1} sx={{ m: 0, p: 0 }}>
                    {task.thread.map((message) => (
                      <ThreadMessage key={message.id} message={message} />
                    ))}
                  </Stack>
                </SectionCard>
              </Box>
            </Stack>
          </Grid>

          <Grid item sm={4} md={8} lg={3} xl={4}>
            <SectionCard title="Details">
              <Stack gap={0.75}>
                <FieldLabel>Owner</FieldLabel>
                {assigning ? (
                  <OwnerTypeahead
                    value={task.delegate}
                    ariaLabel="Owner"
                    onChange={(owner) => {
                      if (owner.id !== task.delegate.id) {
                        assignTask(projectId, task.id, owner);
                        setToast(`Assigned to ${owner.label}. Cowork emailed them.`);
                      }
                      setAssigning(false);
                    }}
                  />
                ) : (
                  <Stack gap={1} alignItems="flex-start" sx={{ minWidth: 0, width: "100%" }}>
                    <PersonLine name={task.delegate.label} detail={task.delegate.detail} wrap />
                    <Button variant="outlined" size="small" onClick={() => setAssigning(true)}>
                      Assign
                    </Button>
                  </Stack>
                )}
              </Stack>

              <Stack gap={0.5}>
                <FieldLabel>Delegated by</FieldLabel>
                <Typography variant="textMd">{task.delegator}</Typography>
              </Stack>

              <Stack gap={0.5}>
                <FieldLabel>CC</FieldLabel>
                <Typography variant="textMd">
                  {task.ccs.length ? task.ccs.map((c) => c.label).join(", ") : "No one"}
                </Typography>
              </Stack>

              <Stack gap={0.5}>
                <FieldLabel>Deadline</FieldLabel>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography variant="textMd">{formatDate(task.deadline)}</Typography>
                  <Link component={RouterLink} to={`/compliance-calendar?date=${task.deadline}`} underline="hover">
                    <Typography variant="textMd" sx={{ color: "inherit" }}>
                      View on calendar
                    </Typography>
                  </Link>
                </Stack>
              </Stack>

              <FormControl fullWidth>
                <FormLabel id="task-status-label">Status</FormLabel>
                <Select
                  size="small"
                  labelId="task-status-label"
                  value={task.status}
                  onChange={(e) => setTaskStatus(projectId, task.id, e.target.value as TaskStatus)}
                >
                  {STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SectionCard>
          </Grid>
        </Grid>
      </Stack>

      <Snackbar open={toast !== null} autoHideDuration={5000} onClose={() => setToast(null)}>
        <Alert severity="success" aria-live="polite" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  );
}
