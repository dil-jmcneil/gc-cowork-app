import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";
import FolderIcon from "@diligentcorp/atlas-react-bundle/icons/Folder";
import HistoryIcon from "@diligentcorp/atlas-react-bundle/icons/History";
import CaretRightIcon from "@diligentcorp/atlas-react-bundle/icons/CaretRight";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Collapse,
  Container,
  Link,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { scrollContentTo, scrollContentToTop, SideChatLayout } from "@/components/chat/SideChatLayout";
import { AllFilesDialog, workstreamFiles } from "@/components/workstreams/AllFilesDialog";
import { FileView } from "@/components/workstreams/FileView";
import { KeyDatesCard } from "@/components/workstreams/KeyDates";
import { SectionCard } from "@/components/workstreams/SectionCard";
import { SourceSignalCard } from "@/components/workstreams/SourceSignalCard";
import { StatusSummary } from "@/components/workstreams/StatusSummary";
import { RuleTable } from "@/components/workstreams/RuleTable";
import { ActivityLogDialog } from "@/components/workstreams/ActivityLogDialog";
import { taskAnchorId, TaskTable } from "@/components/workstreams/TaskTable";
import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import { workstreamFocusFromSearch, workstreamHref } from "@/workstreams/links";
import { planEditFromChat } from "@/workstreams/planChat";
import { orderedTasks, summarizeTask } from "@/workstreams/taskStatus";
import type { HistoryFile } from "@/workstreams/thread";
import type { CannedReply } from "@/chat/chatTypes";
import {
  ADD_OWNERS,
  ASSIGN_OWNERS_EVENT,
  asksToAddOwners,
  asksToChangePlan,
  assignOwners,
  MAKE_CHANGES,
  ownerFormSurface,
  ownersFromContext,
  START_WORKSTREAM_ACTION,
  unassignedCount,
} from "@/workstreams/ownerForm";
import { isOutsideOwner, isUnassigned, type TaskOwner } from "@/workstreams/people";
import type { PlanRule, Workstream, WorkstreamDraft, WorkstreamTask } from "@/workstreams/workstream";
import { handleWorkstreamChatMessage, seedWorkstreamChat, workstreamChatId } from "@/workstreams/workstreamChat";
import { workstreamAttention, workstreamStatus } from "@/workstreams/workstreamAttention";
import { asksToStart, startWorkstream } from "@/workstreams/startWorkstream";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { sendUserMessage } from "@/runtime/assistantReply";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { hasPlan, RELEVANCE_LABEL, shownRelevance, type PlannedSignal, type Signal } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";
import { SPACE } from "@/lib/layout";

/**
 * A started workstream (the View layout): the status summary across the top,
 * then the tasks, each with its owner, status line, files and activity log
 * (with "All files" for every file at once), then the signal's relevance,
 * key dates and source, collapsed. Cowork's chat is
 * always open on the right. A link can open it on a task.
 */
export default function WorkstreamPage() {
  const { workstreamId } = useParams<{ workstreamId: string }>();
  const { search } = useLocation();
  const navigate = useNavigate();
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.id === workstreamId));
  const acceptPlan = useWorkstreamStore((s) => s.acceptPlan);
  const assignTask = useWorkstreamStore((s) => s.assignTask);
  const setTaskStatus = useWorkstreamStore((s) => s.setTaskStatus);
  const confirmTaskDone = useWorkstreamStore((s) => s.confirmTaskDone);
  const nudgeTask = useWorkstreamStore((s) => s.nudgeTask);
  const [nudged, setNudged] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
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
            <PageHeader
              eyebrow="Workstream"
              title={workstream.name}
              action={<WorkstreamStatusBadge workstream={workstream} now={now} />}
            />

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

            <ContextSection reasonsRelevant={workstream.reasonsRelevant} signal={signal} defaultOpen={false} />

            <SectionCard
              title="Tasks"
              titleSize="large"
              action={
                <Stack direction="row" alignItems="center" gap={SPACE.item}>
                  {/* Each task shows its own files; this lists every file in one place. */}
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<FolderIcon aria-hidden />}
                    onClick={() => setShowAllFiles(true)}
                  >
                    All files ({workstreamFiles(tasks).length})
                  </Button>
                  {/* One activity log for every task, filterable to a single task. */}
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<HistoryIcon aria-hidden />}
                    onClick={() => setShowActivity(true)}
                  >
                    Activity log
                  </Button>
                  {/* Post-MVP: the side chat replaces "Revise via chat". */}
                  {showPostMvpViews ? (
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
                  ) : null}
                </Stack>
              }
            >
              <TaskTable
                tasks={tasks}
                detail="status"
                summarize={(task) => summarizeTask(task, now)}
                highlightTaskId={focus.taskId}
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

            <RulesCard rules={workstream.plan.rules} />
          </Stack>
        </Container>
      )}

      <AllFilesDialog open={showAllFiles} tasks={tasks} onClose={() => setShowAllFiles(false)} onOpenFile={openFile} />
      <ActivityLogDialog open={showActivity} tasks={tasks} now={now} onClose={() => setShowActivity(false)} />
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
  // Cowork doesn't know who should own each task: you add owners in chat.
  const [draft, setDraft] = useState<WorkstreamDraft>(() =>
    draftWorkstreamFromSignal(signal, { owners: "unassigned" }),
  );
  const chatId = draftChatId(signal.id);
  const missingOwners = unassignedCount(draft.plan.tasks);
  // Demo: the owners the story is written for pre-fill the owner form.
  const demoOwners = useMemo(
    () => Object.fromEntries(draftWorkstreamFromSignal(signal).plan.tasks.map((t) => [t.id, t.delegate])),
    [signal],
  );

  useEffect(() => seedDraftChat(signal, signal.plan.tasks.length), [signal]);

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
        if (asksToStart(text)) return missingOwners ? ownersFirstReply(missingOwners) : start();
        if (asksToAddOwners(text)) return ownerFormReply(draft.plan.tasks, demoOwners);
        if (asksToChangePlan(text)) return CHANGE_PLAN_REPLY;
        const edit = planEditFromChat(draft.plan, text);
        if (!edit) return undefined;
        setDraft((d) => ({ ...d, plan: edit.plan }));
        return unassignedCount(edit.plan.tasks)
          ? { text: edit.reply, parts: [{ type: "suggested-actions", actions: [ADD_OWNERS] }] }
          : edit.reply;
      }}
      onSurfaceAction={(event) => {
        if (event.name !== ASSIGN_OWNERS_EVENT) return undefined;
        const tasks = assignOwners(draft.plan.tasks, ownersFromContext(event.context));
        setDraft((d) => ({ ...d, plan: { ...d.plan, tasks } }));
        return { userText: "Here are the owners.", reply: ownersAddedReply(tasks) };
      }}
    >
      <Container maxWidth="xl" sx={{ py: SPACE.section }}>
        <Stack gap={SPACE.section}>
          <PageHeader
            eyebrow="Create workstream"
            title={signal.title}
            action={
              // The button sends the same message you could type, so the chat shows how to work this page.
              // Held until every task has an owner: Cowork needs someone to email.
              <Button
                variant="contained"
                disabled={missingOwners > 0}
                onClick={() => sendUserMessage(chatId, START_WORKSTREAM, start())}
              >
                Start workstream
              </Button>
            }
          />

          <StatusSummary label="Summary" summary={signal.plan.brief} />

          <ContextSection reasonsRelevant={draft.reasonsRelevant} signal={signal} defaultOpen />

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
            {missingOwners ? (
              <Alert severity="warning">
                {missingOwners === draft.plan.tasks.length
                  ? "No tasks have owners yet."
                  : `${missingOwners} of ${draft.plan.tasks.length} tasks don't have an owner yet.`}{" "}
                Add owners in the chat, then start. Cowork emails each owner their task, deadline and what done looks
                like.
              </Alert>
            ) : (
              <Alert severity="info">
                When you start, Cowork emails each owner their task, its deadline and what done looks like, then
                follows up until it's done. Nothing goes out before you start.
              </Alert>
            )}
          </SectionCard>

          <RulesCard rules={draft.plan.rules} />
        </Stack>
      </Container>
    </SideChatLayout>
  );
}

const CHANGE_PLAN_REPLY =
  'Tell me what to change, by task number. For example, "remove task 4", or "remove task 4 and move its closing step to task 3".';

/** Cowork's reply to "Add owners to tasks": the A2UI owner form, one card per task. */
function ownerFormReply(tasks: WorkstreamTask[], prefill: Record<string, TaskOwner>): CannedReply {
  return {
    text: "**Add an owner for each task.**\n\nI'll email each owner their task when you start.",
    parts: [{ type: "a2ui", surface: ownerFormSurface(tasks, prefill) }],
  };
}

function ownersFirstReply(missing: number): CannedReply {
  return {
    text: `**Add owners first.** ${missing === 1 ? "One task doesn't" : `${missing} tasks don't`} have an owner, so there's no one to email yet.`,
    parts: [{ type: "suggested-actions", actions: [ADD_OWNERS] }],
  };
}

function ownersAddedReply(tasks: WorkstreamTask[]): CannedReply {
  const lines = orderedTasks(tasks).map(
    (task, i) =>
      `${i + 1}. ${task.description}: ${isUnassigned(task.delegate) ? "no owner yet" : task.delegate.label}${isOutsideOwner(task.delegate) && !isUnassigned(task.delegate) ? " (outside Acme: you'll see my first email before it goes)" : ""}`,
  );
  return {
    text: [`**Owners added.** Start the workstream when the plan looks right.`, lines.join("\n")].join("\n\n"),
    parts: [{ type: "suggested-actions", actions: [START_WORKSTREAM_ACTION, MAKE_CHANGES] }],
  };
}

/** What the Start workstream button posts in chat, as if you'd typed it. */
const START_WORKSTREAM = "Accept the plan and start the workstream.";

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

/** The eyebrow, then the title with its action (Start workstream, or the status badge) on the title's baseline. */
function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair}>
      <Typography
        variant="textMd"
        sx={{ color: tokens.semantic.color.type.muted.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {eyebrow}
      </Typography>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={SPACE.block}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
          {title}
        </Typography>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
    </Stack>
  );
}

/** The whole workstream's status, in the same color as its summary. */
function WorkstreamStatusBadge({ workstream, now }: { workstream: Workstream; now: Date }) {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const status = workstreamStatus(workstream, now);
  return <StatusIndicator color={status.color} label={status.label} />;
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

/**
 * Context: the Source strip, then Relevance and Key Dates side by side, inside
 * one accordion in the same spot on both layouts. Open on Create, where you're
 * deciding; closed once the workstream has started, since you know them.
 */
function ContextSection({
  reasonsRelevant,
  signal,
  defaultOpen,
}: {
  reasonsRelevant: string[];
  signal?: Signal;
  defaultOpen: boolean;
}) {
  const { tokens } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const muted = tokens.semantic.color.type.muted.value;
  const Caret = open ? CaretDownIcon : CaretRightIcon;
  return (
    <Stack component="section" aria-labelledby="context-heading" gap={SPACE.block}>
      {/* A header outside the cards; opening it shows the cards. */}
      <ButtonBase
        aria-expanded={open}
        aria-controls="context-details"
        onClick={() => setOpen((v) => !v)}
        sx={{
          alignSelf: "flex-start",
          gap: SPACE.item,
          borderRadius: tokens.semantic.radius.sm.value,
          textAlign: "left",
        }}
      >
        <Caret aria-hidden style={{ width: 20, height: 20, flexShrink: 0, color: muted }} />
        <Typography
          id="context-heading"
          variant="h6"
          component="h2"
          sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}
        >
          Context
        </Typography>
      </ButtonBase>
      <Collapse in={open} id="context-details" unmountOnExit>
        <Stack gap={SPACE.block}>
          {signal ? <SourceSignalCard signal={signal} /> : null}
          <PeerCards>
            <RelevanceCard reasonsRelevant={reasonsRelevant} />
            <KeyDatesCard deadlines={signal?.deadlines ?? []} />
          </PeerCards>
        </Stack>
      </Collapse>
    </Stack>
  );
}
