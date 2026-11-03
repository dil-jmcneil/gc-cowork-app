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
import { SourceSignalCard } from "@/components/workstreams/SourceSignalCard";
import { PlanMilestones } from "@/components/workstreams/PlanMilestones";
import { RuleTable } from "@/components/workstreams/RuleTable";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import type { WorkstreamDraft } from "@/workstreams/workstream";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { hasPlan } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";
import { SPACE } from "@/lib/layout";
import { RELEVANCE_LABEL } from "@/signals/signal";
import { planEditFromChat } from "@/workstreams/planChat";

export default function CreateWorkstreamPage() {
  const [params] = useSearchParams();
  const signal = SIGNALS.find((c) => c.id === params.get("signal"));
  const existing = useWorkstreamStore((s) =>
    signal ? s.workstreams.find((p) => p.sourceSignalId === signal.id) : undefined,
  );

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
  if (existing) {
    return (
      <Stack gap={SPACE.item} sx={{ p: SPACE.section }} alignItems="flex-start">
        <Typography variant="body1">There's already a workstream for this signal.</Typography>
        <Link component={RouterLink} to={`/workstreams/${existing.id}`}>
          Open {existing.name}
        </Link>
      </Stack>
    );
  }
  return <CreateWorkstreamForm key={signal.id} initialDraft={draftWorkstreamFromSignal(signal)} />;
}

function CreateWorkstreamForm({ initialDraft }: { initialDraft: WorkstreamDraft }) {
  const { tokens, presets } = useTheme();
  const showRules = usePlanRulesStore((s) => s.showRules);
  const navigate = useNavigate();
  const createWorkstream = useWorkstreamStore((s) => s.createWorkstream);
  const [draft, setDraft] = useState(initialDraft);
  const signal = SIGNALS.find((c) => c.id === draft.sourceSignalId)!;
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

  useEffect(() => seedDraftChat(signal), [signal]);

  const setPlan = (patch: Partial<WorkstreamDraft["plan"]>) =>
    setDraft((d) => ({ ...d, plan: { ...d.plan, ...patch } }));

  const handleCreate = () => {
    const workstream = createWorkstream({
      ...draft,
      plan: { ...draft.plan, status: "accepted" },
    });
    navigate(`/workstreams/${workstream.id}`);
  };

  return (
    <SideChatLayout
      chatId={draftChatId(signal.id)}
      onUserMessage={(text) => {
        const edit = planEditFromChat(draft.plan, text);
        if (!edit) return undefined;
        setPlan(edit.plan);
        return edit.reply;
      }}
    >
      <Container maxWidth="xl" sx={{ py: SPACE.section }}>
        <Stack gap={SPACE.section}>
          <Stack gap={SPACE.pair}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
              Create workstream
            </Typography>
            <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
              Cowork drafted this from the signal. Review the plan, then start the workstream.
            </Typography>
          </Stack>

          <Grid {...presets.GridPresets.page}>
            <Grid item sm={4} md={8} lg={5} xl={8}>
              <Stack gap={SPACE.block}>
                <SectionCard title="Workstream Details">
                  <Stack gap={SPACE.block}>
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
                    <Stack gap={SPACE.pair}>
                      <FieldLabel>{RELEVANCE_LABEL}</FieldLabel>
                      <Box component="ul" sx={{ m: 0, pl: SPACE.block }}>
                        {draft.reasonsRelevant.map((reason) => (
                          <Typography component="li" variant="body1" key={reason}>
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
              <SourceSignalCard signal={signal} />
            </Grid>
          </Grid>

          <SectionCard title="Proposed Plan" action={<StatusIndicator color="subtle" label="Draft" />}>
            <Stack gap={SPACE.block}>
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

          <Stack direction="row" justifyContent="flex-end" gap={SPACE.group}>
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
