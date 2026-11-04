import { Box, Button, Container, GridLegacy as Grid, Link, Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { scrollContentTo, SideChatLayout } from "@/components/chat/SideChatLayout";
import { FieldLabel, SectionCard } from "@/components/workstreams/SectionCard";
import { SourceSignalCard } from "@/components/workstreams/SourceSignalCard";
import { milestoneAnchorId, PlanMilestones } from "@/components/workstreams/PlanMilestones";
import { RuleTable } from "@/components/workstreams/RuleTable";
import { HistoryList, type HistoryItem } from "@/components/tasks/History";
import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import { workstreamFocusFromSearch, workstreamHref, type WorkstreamFocus } from "@/workstreams/links";
import { planEditFromChat } from "@/workstreams/planChat";
import type { WorkstreamDraft, WorkstreamPlan } from "@/workstreams/workstream";
import { handleWorkstreamChatMessage, seedWorkstreamChat, workstreamChatId } from "@/workstreams/workstreamChat";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { hasPlan, RELEVANCE_LABEL, type PlannedSignal, type Signal } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";
import { SPACE } from "@/lib/layout";

/** The one workstream page, with Cowork's chat always open beside it. Links can open it on a milestone and task. */
export default function WorkstreamPage() {
  const { workstreamId } = useParams<{ workstreamId: string }>();
  const { search } = useLocation();
  const navigate = useNavigate();
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.id === workstreamId));
  const acceptPlan = useWorkstreamStore((s) => s.acceptPlan);

  useEffect(() => {
    if (workstream) seedWorkstreamChat(workstream);
    // Seed once per workstream; later edits shouldn't re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workstream?.id]);

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

  const planAccepted = workstream.plan.status === "accepted";
  const history = workstream.plan.tasks.flatMap((task) =>
    task.history.map((entry) => ({ entry, context: task.description })),
  );

  return (
    <SideChatLayout
      // A fresh layout per workstream, so one workstream doesn't open at another's scroll position.
      key={workstream.id}
      chatId={workstreamChatId(workstream.id)}
      onUserMessage={(text) => handleWorkstreamChatMessage(workstream.id, text)}
    >
      <WorkstreamView
        eyebrow="Workstream"
        name={workstream.name}
        description={workstream.description}
        reasonsRelevant={workstream.reasonsRelevant}
        plan={workstream.plan}
        signal={SIGNALS.find((c) => c.id === workstream.sourceSignalId)}
        statusSummary={workstream.statusSummary}
        history={history}
        focus={workstreamFocusFromSearch(search)}
        // Post-MVP: task titles open the task page. In the MVP they stay on this page.
        onOpenTask={
          showPostMvpViews ? (taskId) => navigate(`/workstreams/${workstream.id}/tasks/${taskId}`) : undefined
        }
        planActions={
          <>
            {/* Post-MVP: the side chat replaces "Revise via chat". */}
            {showPostMvpViews ? (
              <Button
                variant="outlined"
                onClick={() =>
                  startChatFromPrompt(`Help me revise the plan for "${workstream.name}".`, navigate, {
                    workstreamId: workstream.id,
                  })
                }
              >
                Revise via chat
              </Button>
            ) : null}
            {planAccepted ? null : (
              <Button variant="contained" onClick={() => acceptPlan(workstream.id)}>
                Accept plan
              </Button>
            )}
          </>
        }
      />
    </SideChatLayout>
  );
}

/**
 * MVP: a signal with no workstream opens Cowork's draft on the same page,
 * with the chat beside it for changes. "Start workstream" creates it. The
 * separate create page comes back with post-MVP views on.
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

function DraftWorkstream({ signal }: { signal: PlannedSignal }) {
  const navigate = useNavigate();
  const createWorkstream = useWorkstreamStore((s) => s.createWorkstream);
  const [draft, setDraft] = useState<WorkstreamDraft>(() => draftWorkstreamFromSignal(signal));

  useEffect(() => seedDraftChat(signal), [signal]);

  const start = () => {
    const workstream = createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } });
    navigate(workstreamHref(workstream.id));
  };

  return (
    <SideChatLayout
      chatId={draftChatId(signal.id)}
      onUserMessage={(text) => {
        const edit = planEditFromChat(draft.plan, text);
        if (!edit) return undefined;
        setDraft((d) => ({ ...d, plan: edit.plan }));
        return edit.reply;
      }}
    >
      <WorkstreamView
        eyebrow="Draft workstream"
        name={draft.name}
        description={draft.description}
        reasonsRelevant={draft.reasonsRelevant}
        plan={draft.plan}
        signal={signal}
        statusSummary="Cowork drafted this plan from the signal. Review it, ask for changes in the chat, then start the workstream."
        focus={{}}
        headerAction={
          <Button variant="contained" onClick={start}>
            Start workstream
          </Button>
        }
      />
    </SideChatLayout>
  );
}

/** The workstream page's content, shared by a draft and a started workstream. */
function WorkstreamView({
  eyebrow,
  name,
  description,
  reasonsRelevant,
  plan,
  signal,
  statusSummary,
  history,
  focus,
  headerAction,
  planActions,
  onOpenTask,
}: {
  eyebrow: string;
  name: string;
  description: string;
  reasonsRelevant: string[];
  plan: WorkstreamPlan;
  signal?: Signal;
  statusSummary: string;
  /** Omitted for a draft, which has no activity yet. */
  history?: HistoryItem[];
  focus: WorkstreamFocus;
  headerAction?: ReactNode;
  planActions?: ReactNode;
  onOpenTask?: (taskId: string) => void;
}) {
  const { tokens, presets } = useTheme();
  const showRules = usePlanRulesStore((s) => s.showRules);
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const planAccepted = plan.status === "accepted";

  // A link to a milestone scrolls to it once the page has laid out.
  useEffect(() => {
    if (!focus.milestoneId) return;
    const frame = requestAnimationFrame(() => {
      const milestone = document.getElementById(milestoneAnchorId(focus.milestoneId!));
      if (milestone) scrollContentTo(milestone);
    });
    return () => cancelAnimationFrame(frame);
  }, [focus.milestoneId, focus.taskId]);

  return (
    <Container maxWidth="xl" sx={{ py: SPACE.section }}>
      <Stack gap={SPACE.section}>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={SPACE.block}>
          <Stack gap={SPACE.pair}>
            <Typography variant="textMd" sx={{ color: muted, fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
              {eyebrow}
            </Typography>
            <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
              {name}
            </Typography>
          </Stack>
          {headerAction}
        </Stack>

        <Grid {...presets.GridPresets.page}>
          <Grid item sm={4} md={8} lg={5} xl={8}>
            <Stack gap={SPACE.block}>
              <SectionCard title="Status Summary">
                <Typography variant="body1">{statusSummary}</Typography>
              </SectionCard>
              <SectionCard title="About This Signal">
                <Typography variant="body1">{description}</Typography>
                <Stack gap={SPACE.pair}>
                  <FieldLabel>{RELEVANCE_LABEL}</FieldLabel>
                  <Box component="ul" sx={{ m: 0, pl: SPACE.block }}>
                    {reasonsRelevant.map((reason) => (
                      <Typography component="li" variant="body1" key={reason}>
                        {reason}
                      </Typography>
                    ))}
                  </Box>
                </Stack>
              </SectionCard>
            </Stack>
          </Grid>

          <Grid item sm={4} md={8} lg={3} xl={4}>
            <Stack gap={SPACE.block}>{signal ? <SourceSignalCard signal={signal} /> : null}</Stack>
          </Grid>
        </Grid>

        <SectionCard
          title="Plan"
          action={
            <StatusIndicator color={planAccepted ? "success" : "subtle"} label={planAccepted ? "Accepted" : "Draft"} />
          }
        >
          <Stack gap={SPACE.pair}>
            <FieldLabel>Proposed approach</FieldLabel>
            <Typography variant="body1">{plan.proposedApproach}</Typography>
          </Stack>
          <PlanMilestones plan={plan} onOpenTask={onOpenTask} highlightTaskId={focus.taskId} />
          {planActions ? (
            <Stack direction="row" gap={SPACE.group} justifyContent="flex-end">
              {planActions}
            </Stack>
          ) : null}
        </SectionCard>

        {history ? (
          <SectionCard title="History">
            <Typography variant="textMd" sx={{ color: muted }}>
              Messages, Cowork's actions, and files across every task, newest first.
            </Typography>
            <HistoryList items={history} ariaLabel="Workstream history" limit={8} />
          </SectionCard>
        ) : null}

        {showRules ? (
          <SectionCard title="Rules for Every Milestone">
            <Typography variant="textMd" sx={{ color: muted }}>
              Cowork checks where the work stands after every reply and applies the rule that fits. When no rule fits,
              it stops and asks you.
            </Typography>
            <RuleTable rules={plan.rules} ariaLabel="Rules for every milestone" />
          </SectionCard>
        ) : null}
      </Stack>
    </Container>
  );
}
