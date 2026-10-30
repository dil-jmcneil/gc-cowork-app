import {
  Alert,
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
import { SectionCard } from "@/components/projects/SectionCard";
import { TaskBadges } from "@/components/tasks/TaskBadges";
import { TaskDetailsCard } from "@/components/tasks/TaskDetailsCard";
import { ThreadMessage } from "@/components/tasks/ThreadMessages";
import type { ProjectTask } from "@/projects/project";
import { useProjectStore } from "@/projects/projectStore";
import {
  handleTaskChatMessage,
  seedTaskChat,
  taskChatId,
} from "@/projects/taskChat";
import { summarizeTask } from "@/projects/taskStatus";
import { CHANNEL_LABEL } from "@/projects/thread";

export default function TaskPage() {
  const { projectId = "", taskId = "" } = useParams<{
    projectId: string;
    taskId: string;
  }>();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId),
  );
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
      onUserMessage={(text) =>
        handleTaskChatMessage(project.id, task.id, text, new Date())
      }
    >
      <TaskDetail
        projectId={project.id}
        projectName={project.name}
        task={task}
      />
    </SideChatLayout>
  );
}

function TaskDetail({
  projectId,
  projectName,
  task,
}: {
  projectId: string;
  projectName: string;
  task: ProjectTask;
}) {
  const { tokens } = useTheme();
  const location = useLocation();
  const { assignTask, setTaskStatus, nudgeTask, messageDelegate } =
    useProjectStore.getState();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const now = new Date();
  const ownerFirst = task.delegate.label.split(" ")[0];
  const channels = [...new Set(task.thread.map((m) => m.channel))];

  useEffect(() => {
    if (location.hash === "#thread")
      document.getElementById("thread")?.scrollIntoView({ block: "start" });
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
          <Link
            component={RouterLink}
            to={`/projects/${projectId}`}
            underline="hover"
            sx={{ alignSelf: "flex-start" }}
          >
            <Typography variant="textMd" sx={{ color: "inherit" }}>
              {projectName}
            </Typography>
          </Link>
          <Typography variant="h4" component="h1">
            {task.description}
          </Typography>
          <TaskBadges task={task} now={now} />
        </Stack>

        <Stack gap={2}>
          <SectionCard title="Status Summary">
            <Typography variant="textMd">{summarizeTask(task, now)}</Typography>
          </SectionCard>

          <TaskDetailsCard
            task={task}
            onAssign={(owner) => {
              assignTask(projectId, task.id, owner);
              setToast(`Assigned to ${owner.label}. Cowork emailed them.`);
            }}
            onStatusChange={(status) =>
              setTaskStatus(projectId, task.id, status)
            }
          />

          <Box id="thread" sx={{ scrollMarginTop: 16 }}>
            <SectionCard
              title={`Communication Thread (${task.thread.length})`}
              action={
                <Stack direction="row" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setComposing((v) => !v)}
                  >
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
              <Typography
                variant="textMd"
                sx={{ color: tokens.semantic.color.type.muted.value }}
              >
                Cowork records every message between you and{" "}
                {task.delegate.label}, routes it to the right channel, and
                follows up. Channels:{" "}
                {channels.map((c) => CHANNEL_LABEL[c]).join(", ") || "none yet"}
                .
              </Typography>

              {composing ? (
                <Stack gap={1}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="message-owner">
                      Message to {task.delegate.label}
                    </FormLabel>
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
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setComposing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={sendMessage}
                      disabled={!draft.trim()}
                    >
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
      </Stack>

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
      >
        <Alert
          severity="success"
          aria-live="polite"
          onClose={() => setToast(null)}
        >
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  );
}
