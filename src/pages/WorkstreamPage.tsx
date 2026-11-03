import { Box, Button, Container, GridLegacy as Grid, Link, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { FieldLabel, SectionCard } from "@/components/workstreams/SectionCard";
import { SourceSignalCard } from "@/components/workstreams/SourceSignalCard";
import { PlanMilestones } from "@/components/workstreams/PlanMilestones";
import { RuleTable } from "@/components/workstreams/RuleTable";
import { HistoryList } from "@/components/tasks/History";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { SIGNALS } from "@/signals/signals";
import { SPACE } from "@/lib/layout";
import { RELEVANCE_LABEL } from "@/signals/signal";

export default function WorkstreamPage() {
  const { workstreamId } = useParams<{ workstreamId: string }>();
  const { tokens, presets } = useTheme();
  const showRules = usePlanRulesStore((s) => s.showRules);
  const navigate = useNavigate();
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.id === workstreamId));
  const acceptPlan = useWorkstreamStore((s) => s.acceptPlan);
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

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

  const signal = SIGNALS.find((c) => c.id === workstream.sourceSignalId);
  const muted = tokens.semantic.color.type.muted.value;
  const planAccepted = workstream.plan.status === "accepted";
  const history = workstream.plan.tasks.flatMap((task) =>
    task.history.map((entry) => ({ entry, context: task.description })),
  );

  return (
    <Container maxWidth="xl" sx={{ py: SPACE.section }}>
      <Stack gap={SPACE.section}>
        <Stack gap={SPACE.pair}>
          <Typography
            variant="textMd"
            sx={{
              color: muted,
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
            }}
          >
            Workstream
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {workstream.name}
          </Typography>
        </Stack>

        <Grid {...presets.GridPresets.page}>
          <Grid item sm={4} md={8} lg={5} xl={8}>
            <Stack gap={SPACE.block}>
              <SectionCard title="Status Summary">
                <Typography variant="body1">{workstream.statusSummary}</Typography>
              </SectionCard>
              <SectionCard title="About This Signal">
                <Typography variant="body1">{workstream.description}</Typography>
                <Stack gap={SPACE.pair}>
                  <FieldLabel>{RELEVANCE_LABEL}</FieldLabel>
                  <Box component="ul" sx={{ m: 0, pl: SPACE.block }}>
                    {workstream.reasonsRelevant.map((reason) => (
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
            <Typography variant="body1">{workstream.plan.proposedApproach}</Typography>
          </Stack>
          <PlanMilestones plan={workstream.plan} onOpenTask={(taskId) => navigate(`/workstreams/${workstream.id}/tasks/${taskId}`)} />
          <Stack direction="row" gap={SPACE.group} justifyContent="flex-end">
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
            {planAccepted ? null : (
              <Button variant="contained" onClick={() => acceptPlan(workstream.id)}>
                Accept plan
              </Button>
            )}
          </Stack>
        </SectionCard>

        <SectionCard title="History">
          <Typography variant="textMd" sx={{ color: muted }}>
            Messages, Cowork's actions, and files across every task, newest first.
          </Typography>
          <HistoryList items={history} ariaLabel="Workstream history" limit={8} />
        </SectionCard>

        {showRules ? (
          <SectionCard title="Rules for Every Milestone">
            <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
              Cowork checks where the work stands after every reply and applies the rule that fits. When no rule fits,
              it stops and asks you.
            </Typography>
            <RuleTable rules={workstream.plan.rules} ariaLabel="Rules for every milestone" />
          </SectionCard>
        ) : null}
      </Stack>
    </Container>
  );
}
