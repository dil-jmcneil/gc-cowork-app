import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  Container,
  GridLegacy as Grid,
  Link,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { scrollContentTo, scrollContentToTop, SideChatLayout } from "@/components/chat/SideChatLayout";
import { ArtifactsCard } from "@/components/workstreams/ArtifactsCard";
import { FileView } from "@/components/workstreams/FileView";
import { KeyDatesCard, KeyDatesList } from "@/components/workstreams/KeyDates";
import { FieldLabel, SectionCard } from "@/components/workstreams/SectionCard";
import { SourceSignalCard, SourceStrip } from "@/components/workstreams/SourceSignalCard";
import { StatusSummary } from "@/components/workstreams/StatusSummary";
import { RuleTable } from "@/components/workstreams/RuleTable";
import { TaskActivityDialog } from "@/components/workstreams/TaskActivityDialog";
import { taskAnchorId, TaskTable } from "@/components/workstreams/TaskTable";
import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import { workstreamFocusFromSearch, workstreamHref } from "@/workstreams/links";
import { planEditFromChat } from "@/workstreams/planChat";
import { summarizeTask } from "@/workstreams/taskStatus";
import type { HistoryFile } from "@/workstreams/thread";
import type { PlanRule, WorkstreamDraft } from "@/workstreams/workstream";
import { handleWorkstreamChatMessage, seedWorkstreamChat, workstreamChatId } from "@/workstreams/workstreamChat";
import { workstreamAttention } from "@/workstreams/workstreamAttention";
import { asksToStart, startWorkstream } from "@/workstreams/startWorkstream";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { sendUserMessage } from "@/runtime/assistantReply";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { hasPlan, RELEVANCE_LABEL, shownRelevance, type PlannedSignal, type Signal } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";
import { SPACE } from "@/lib/layout";

/**
 * A started workstream (the View layout): the status summary beside its
 * artifacts, then the tasks, each with its owner, status line and activity
 * log, then the signal's relevance and sources, collapsed. Cowork's chat is
 * always open on the right. A link can open it on a task.
 */
export default function WorkstreamPage() {
  const { workstreamId } = useParams<{ workstreamId: string }>();
  const { search } = useLocation();
  const navigate = useNavigate();
  const { presets } = useTheme();
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.id === workstreamId));
  const acceptPlan = useWorkstreamStore((s) => s.acceptPlan);
  const assignTask = useWorkstreamStore((s) => s.assignTask);
  const setTaskStatus = useWorkstreamStore((s) => s.setTaskStatus);
  const confirmTaskDone = useWorkstreamStore((s) => s.confirmTaskDone);
  const nudgeTask = useWorkstreamStore((s) => s.nudgeTask);
  const [nudged, setNudged] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [activityTaskId, setActivityTaskId] = useState<string | null>(null);
  const now = new Date();
  const focus = workstreamFocusFromSearch(search);

  useEffect(() => {
    if (workstream) seedWorkstreamChat(workstream, now);
    // Seed once per workstream; later edits shouldn't re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workstream?.id]);
  useScrollToTask(focus.taskId);
  // Opening or closing a file swaps the page content, so start it at the top.
  useEffect(() => scrollContentToTop(), [focus.fileId]);

  if (!workstream) {
    return (
      <Stack gap={SPACE.item} sx={{ p: SPACE.section }} alignItems="flex-start">
        <Typography variant="body1">Workstream not found.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }

  const { tasks } = workstream.plan;
  const signal = SIGNALS.find((c) => c.id === workstream.sourceSignalId);
  const openFile = (fileId: string) => navigate(workstreamHref(workstream.id, { fileId }));
  // A file opened from the workstream replaces the page content; the chat stays.
  const opened = focus.fileId
    ? tasks.flatMap((task) =>
        task.history
          .filter((e): e is HistoryFile => e.kind === "file" && e.id === focus.fileId)
          .map((file) => ({ file, task })),
      )[0]
    : undefined;
  const confirm = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    confirmTaskDone(workstream.id, taskId);
    if (task) setToast(`Closed "${task.description}".`);
  };

  return (
    <SideChatLayout
      // A fresh layout per workstream, so one workstream doesn't open at another's scroll position.
      key={workstream.id}
      chatId={workstreamChatId(workstream)}
      onUserMessage={(text) => handleWorkstreamChatMessage(workstream.id, text, new Date())}
    >
      {opened ? (
        <FileView
          file={opened.file}
          taskName={opened.task.description}
          backLabel={`Back to ${workstream.name}`}
          onBack={() => navigate(workstreamHref(workstream.id))}
        />
      ) : (
        <Container maxWidth="xl" sx={{ py: SPACE.section }}>
          <Stack gap={SPACE.section}>
            <PageHeader eyebrow="Workstream" title={workstream.name} />

            <Grid {...presets.GridPresets.page}>
              <Grid item sm={4} md={8} lg={5} xl={8}>
                <StatusSummary
                  {...workstreamAttention(workstream, now)}
                  nudged={nudged}
                  onConfirm={({ task }) => confirm(task.id)}
                  onNudge={({ task }) => {
                    nudgeTask(workstream.id, task.id);
                    setNudged((prev) => new Set(prev).add(task.id));
                    setToast(`Nudge sent to ${task.delegate.label}.`);
                  }}
                />
              </Grid>
              <Grid item sm={4} md={8} lg={3} xl={4}>
                <ArtifactsCard tasks={tasks} hrefFor={(fileId) => workstreamHref(workstream.id, { fileId })} />
              </Grid>
            </Grid>

            <SectionCard
              title="Tasks"
              action={
                // Post-MVP: the side chat replaces "Revise via chat".
                showPostMvpViews ? (
                  <Stack direction="row" gap={SPACE.item}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        startChatFromPrompt(`Help me revise the plan for "${workstream.name}".`, navigate, {
                          workstreamId: workstream.id,
                        })
                      }
                    >
                      Revise via chat
                    </Button>
                    {workstream.plan.status === "accepted" ? null : (
                      <Button variant="contained" size="small" onClick={() => acceptPlan(workstream.id)}>
                        Accept plan
                      </Button>
                    )}
                  </Stack>
                ) : null
              }
            >
              <TaskTable
                tasks={tasks}
                detail="status"
                summarize={(task) => summarizeTask(task, now)}
                highlightTaskId={focus.taskId}
                onOpenActivity={setActivityTaskId}
                onOpenFile={openFile}
                onStatusChange={(taskId, status) => {
                  const task = tasks.find((t) => t.id === taskId);
                  setTaskStatus(workstream.id, taskId, status);
                  if (task) setToast(`"${task.description}" is now ${status.toLowerCase()}.`);
                }}
                showCc={showPostMvpViews}
                // Post-MVP: owners are editable. The MVP shows them as text.
                onOwnerChange={
                  showPostMvpViews
                    ? (taskId, owner) => {
                        assignTask(workstream.id, taskId, owner);
                        setToast(`Reassigned to ${owner.label}. Cowork emailed them the task.`);
                      }
                    : undefined
                }
              />
            </SectionCard>

            <RelevanceAndSources
              description={workstream.description}
              reasonsRelevant={workstream.reasonsRelevant}
              signal={signal}
            />
            <RulesCard rules={workstream.plan.rules} />
          </Stack>
        </Container>
      )}

      <TaskActivityDialog
        task={tasks.find((t) => t.id === activityTaskId)}
        now={now}
        onClose={() => setActivityTaskId(null)}
      />
      <Snackbar open={toast !== null} autoHideDuration={5000} onClose={() => setToast(null)}>
        <Alert severity="success" aria-live="polite" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </SideChatLayout>
  );
}

/**
 * MVP: a signal with no workstream opens Cowork's draft (the Create layout),
 * with the chat beside it for changes. "Accept and start" creates it. The
 * older create page comes back with post-MVP views on.
 */
export function DraftWorkstreamPage() {
  const [params] = useSearchParams();
  const signal = SIGNALS.find((c) => c.id === params.get("signal"));
  const existing = useWorkstreamStore((s) =>
    signal ? s.workstreams.find((p) => p.sourceSignalId === signal.id) : undefined,
  );

  if (existing) return <Navigate replace to={workstreamHref(existing.id)} />;
  if (!signal || !hasPlan(signal)) {
    return (
      <Stack gap={SPACE.item} sx={{ p: SPACE.section }} alignItems="flex-start">
        <Typography variant="body1">We couldn't find a plan for that signal.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }
  return <DraftWorkstream key={signal.id} signal={signal} />;
}

/**
 * The Create layout: what the signal is, why it matters and what Cowork
 * suggests; Relevance, Key Dates and Source side by side; then the plan's
 * tasks, each with an owner you can change and what done looks like.
 */
function DraftWorkstream({ signal }: { signal: PlannedSignal }) {
  const navigate = useNavigate();
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const [draft, setDraft] = useState<WorkstreamDraft>(() => draftWorkstreamFromSignal(signal));
  const chatId = draftChatId(signal.id);

  useEffect(() => seedDraftChat(signal), [signal]);

  /** Start the workstream and open it; Cowork's reply in chat says what it's sending. */
  const start = () => {
    const { workstream, reply } = startWorkstream(draft);
    navigate(workstreamHref(workstream.id));
    return reply;
  };

  return (
    <SideChatLayout
      chatId={chatId}
      onUserMessage={(text) => {
        // Typing "Start" here does the same as the button: the chat is how you work this page.
        if (asksToStart(text)) return start();
        const edit = planEditFromChat(draft.plan, text);
        if (!edit) return undefined;
        setDraft((d) => ({ ...d, plan: edit.plan }));
        return edit.reply;
      }}
    >
      <Container maxWidth="xl" sx={{ py: SPACE.section }}>
        <Stack gap={SPACE.section}>
          <PageHeader eyebrow={signal.title} title="Create workstream" />

          <StatusSummary label="Summary" summary={signal.plan.brief} />

          <SourceSignalCard signal={signal} />

          <PeerCards>
            <RelevanceCard reasonsRelevant={draft.reasonsRelevant} />
            <KeyDatesCard deadlines={signal.deadlines} />
          </PeerCards>

          <SectionCard title="Plan">
            <Typography variant="body1">{draft.plan.proposedApproach}</Typography>
            <TaskTable
              tasks={draft.plan.tasks}
              detail="done-when"
              showCc={showPostMvpViews}
              // Post-MVP: owners are editable. The MVP shows them as text.
              onOwnerChange={
                showPostMvpViews
                  ? (taskId, owner) =>
                      setDraft((d) => ({
                        ...d,
                        plan: {
                          ...d.plan,
                          tasks: d.plan.tasks.map((t) => (t.id === taskId ? { ...t, delegate: owner } : t)),
                        },
                      }))
                  : undefined
              }
            />
            <Alert severity="info">
              When you start, Cowork emails each owner their task, its deadline and what done looks like, then follows
              up until it's done. Nothing goes out before you start.
            </Alert>
          </SectionCard>

          <RulesCard rules={draft.plan.rules} />

          <Stack direction="row" justifyContent="flex-end">
            {/* The button sends the same message you could type, so the chat shows how to work this page. */}
            <Button variant="contained" onClick={() => sendUserMessage(chatId, ACCEPT_AND_START, start())}>
              Accept and start
            </Button>
          </Stack>
        </Stack>
      </Container>
    </SideChatLayout>
  );
}

/** What the Accept and start button posts in chat, as if you'd typed it. */
const ACCEPT_AND_START = "Accept the plan and start the workstream.";

/** A link to `?task=` scrolls the page to that task once it has laid out. */
function useScrollToTask(taskId: string | undefined) {
  useEffect(() => {
    if (!taskId) return;
    const frame = requestAnimationFrame(() => {
      const row = document.getElementById(taskAnchorId(taskId));
      if (row) scrollContentTo(row, 96);
    });
    return () => cancelAnimationFrame(frame);
  }, [taskId]);
}

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair}>
      <Typography
        variant="textMd"
        sx={{ color: tokens.semantic.color.type.muted.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {eyebrow}
      </Typography>
      <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
        {title}
      </Typography>
    </Stack>
  );
}

/** Hidden unless the Demo settings toggle is on. */
function RulesCard({ rules }: { rules: PlanRule[] }) {
  const { tokens } = useTheme();
  const showRules = usePlanRulesStore((s) => s.showRules);
  if (!showRules) return null;
  return (
    <SectionCard title="Rules Cowork Follows">
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
        Cowork checks where the work stands after every reply and applies the rule that fits. When no rule fits, it
        stops and asks you.
      </Typography>
      <RuleTable rules={rules} ariaLabel="Rules Cowork follows" />
    </SectionCard>
  );
}

/** Relevance never shows more than two reasons. */
function RelevanceList({ reasonsRelevant }: { reasonsRelevant: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: SPACE.block }}>
      {shownRelevance(reasonsRelevant).map((reason) => (
        <Typography component="li" variant="body1" key={reason}>
          {reason}
        </Typography>
      ))}
    </Box>
  );
}

function RelevanceCard({ reasonsRelevant }: { reasonsRelevant: string[] }) {
  return (
    <SectionCard title={RELEVANCE_LABEL}>
      <RelevanceList reasonsRelevant={reasonsRelevant} />
    </SectionCard>
  );
}

/** Relevance and Key Dates side by side, under the Source strip; stacked on narrow screens. */
function PeerCards({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: SPACE.block,
        alignItems: "stretch",
      }}
    >
      {children}
    </Box>
  );
}

/** The signal, why it matters, its key dates and its source, collapsed: once the workstream has started, you know them. */
function RelevanceAndSources({
  description,
  reasonsRelevant,
  signal,
}: {
  description: string;
  reasonsRelevant: string[];
  signal?: Signal;
}) {
  const { presets } = useTheme();
  const AccordionHeader = presets.AccordionPresets.components.Header;
  return (
    <Card component="section" aria-label="Relevance, Key Dates and Source" sx={{ p: 0 }}>
      <Accordion disableGutters data-atlas-alignment="start">
        <AccordionSummary aria-controls="relevance-sources-details" id="relevance-sources-header">
          <AccordionHeader
            titleTextProps={{ text: "Relevance, Key Dates and Source", variant: "body1", component: "h2" }}
            subtitleText={signal ? `${signal.title} · ${signal.source}` : undefined}
          />
        </AccordionSummary>
        <AccordionDetails id="relevance-sources-details">
          <Stack gap={SPACE.block}>
            {signal ? (
              <Stack gap={SPACE.group}>
                <FieldLabel>Source</FieldLabel>
                <SourceStrip signal={signal} />
              </Stack>
            ) : null}
            <PeerCards>
              <Stack gap={SPACE.group}>
                <FieldLabel>{RELEVANCE_LABEL}</FieldLabel>
                <Typography variant="body1">{description}</Typography>
                <RelevanceList reasonsRelevant={reasonsRelevant} />
              </Stack>
              <Stack gap={SPACE.group}>
                <FieldLabel>Key Dates</FieldLabel>
                <KeyDatesList deadlines={signal?.deadlines ?? []} />
              </Stack>
            </PeerCards>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}
