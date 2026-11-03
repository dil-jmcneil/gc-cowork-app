import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  GridLegacy as Grid,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import { SideChatLayout } from "@/components/chat/SideChatLayout";
import { FieldLabel, SectionCard } from "@/components/workstreams/SectionCard";
import { SourceInsightCard } from "@/components/workstreams/SourceInsightCard";
import { PlanMilestones } from "@/components/workstreams/PlanMilestones";
import { RuleTable } from "@/components/workstreams/RuleTable";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import type { WorkstreamDraft } from "@/workstreams/workstream";
import { draftWorkstreamFromInsight } from "@/workstreams/workstreamDraft";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { INSIGHTS } from "@/insights/insights";

export default function CreateWorkstreamPage() {
  const [params] = useSearchParams();
  const insight = INSIGHTS.find((c) => c.id === params.get("insight"));
  const existing = useWorkstreamStore((s) =>
    insight ? s.workstreams.find((p) => p.sourceInsightId === insight.id) : undefined,
  );

  if (!insight) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">We couldn't find that insight.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }
  if (existing) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">There's already a workstream for this insight.</Typography>
        <Link component={RouterLink} to={`/workstreams/${existing.id}`}>
          Open {existing.name}
        </Link>
      </Stack>
    );
  }
  return <CreateWorkstreamForm key={insight.id} initialDraft={draftWorkstreamFromInsight(insight)} />;
}

function CreateWorkstreamForm({ initialDraft }: { initialDraft: WorkstreamDraft }) {
  const { tokens, presets } = useTheme();
  const showRules = usePlanRulesStore((s) => s.showRules);
  const navigate = useNavigate();
  const createWorkstream = useWorkstreamStore((s) => s.createWorkstream);
  const [draft, setDraft] = useState(initialDraft);
  const insight = INSIGHTS.find((c) => c.id === draft.sourceInsightId)!;
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

  useEffect(() => seedDraftChat(insight), [insight]);

  const setPlan = (patch: Partial<WorkstreamDraft["plan"]>) => setDraft((d) => ({ ...d, plan: { ...d.plan, ...patch } }));

  const handleCreate = () => {
    const workstream = createWorkstream({
      ...draft,
      plan: { ...draft.plan, status: "accepted" },
    });
    navigate(`/workstreams/${workstream.id}`);
  };

  return (
    <SideChatLayout chatId={draftChatId(insight.id)}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack gap={3}>
          <Stack gap={0.5}>
            <Typography variant="h4" component="h1">
              Create workstream
            </Typography>
            <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
              Cowork drafted this from the insight. Review the plan, then start the workstream.
            </Typography>
          </Stack>

          <Grid {...presets.GridPresets.page}>
            <Grid item sm={4} md={8} lg={5} xl={8}>
              <Stack gap={2}>
                <SectionCard title="Workstream Details">
                  <Stack gap={2}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="workstream-name">Name</FormLabel>
                      <TextField
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        slotProps={{ input: { id: "workstream-name" } }}
                      />
                    </FormControl>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="workstream-description">Description</FormLabel>
                      <TextField
                        multiline
                        minRows={2}
                        value={draft.description}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        slotProps={{ input: { id: "workstream-description" } }}
                      />
                    </FormControl>
                    <Stack gap={0.5}>
                      <FieldLabel>Why it's relevant</FieldLabel>
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {draft.reasonsRelevant.map((reason) => (
                          <Typography component="li" variant="textMd" key={reason}>
                            {reason}
                          </Typography>
                        ))}
                      </Box>
                    </Stack>
                  </Stack>
                </SectionCard>
              </Stack>
            </Grid>
            <Grid item sm={4} md={8} lg={3} xl={4}>
              <SourceInsightCard insight={insight} />
            </Grid>
          </Grid>

          <SectionCard title="Proposed Plan" action={<StatusIndicator color="subtle" label="Draft" />}>
            <Stack gap={2}>
              <FormControl fullWidth>
                <FormLabel htmlFor="plan-approach">Proposed approach</FormLabel>
                <TextField
                  multiline
                  minRows={2}
                  value={draft.plan.proposedApproach}
                  onChange={(e) => setPlan({ proposedApproach: e.target.value })}
                  slotProps={{ input: { id: "plan-approach" } }}
                />
              </FormControl>
              <PlanMilestones
                plan={draft.plan}
                onOwnerChange={(taskId, owner) =>
                  setPlan({
                    tasks: draft.plan.tasks.map((t) => (t.id === taskId ? { ...t, delegate: owner } : t)),
                  })
                }
              />
            </Stack>
          </SectionCard>

          {showRules ? (
            <SectionCard title="Rules for Every Milestone">
              <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
                Cowork checks where the work stands after every reply and applies the rule that fits. When no rule fits,
                it stops and asks you.
              </Typography>
              <RuleTable rules={draft.plan.rules} ariaLabel="Rules for every milestone" />
            </SectionCard>
          ) : null}

          <Stack direction="row" justifyContent="flex-end" gap={1.5}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate}>
              Accept plan and start workstream
            </Button>
          </Stack>
        </Stack>
      </Container>
    </SideChatLayout>
  );
}
