import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import { usePlanRulesStore } from "@/demo/planRulesStore";

import { milestoneStatuses, type MilestoneStatus } from "@/workstreams/milestones";
import type { TaskOwner } from "@/workstreams/people";
import type { Milestone, WorkstreamPlan } from "@/workstreams/workstream";

import { RuleTable } from "./RuleTable";
import { FieldLabel } from "./SectionCard";
import { TaskTable } from "./TaskTable";
import { SPACE } from "@/lib/layout";

const STATUS_COLOR: Record<MilestoneStatus, "success" | "information" | "subtle"> = {
  Done: "success",
  Current: "information",
  Upcoming: "subtle",
};

/**
 * The plan's spine: milestones in order, each judged by its contract (what
 * starts it, what finishes it, who approves the handover), with its tasks and
 * the rules Cowork follows inside it.
 */
export function PlanMilestones({
  plan,
  onOwnerChange,
  onOpenTask,
}: {
  plan: WorkstreamPlan;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const statuses = milestoneStatuses(plan.milestones, plan.tasks);
  return (
    <Stack component="ol" gap={SPACE.block} aria-label="Milestones" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {plan.milestones.map((milestone, index) => (
        <Box component="li" key={milestone.id}>
          <MilestoneCard
            milestone={milestone}
            number={index + 1}
            status={statuses[milestone.id]}
            plan={plan}
            onOwnerChange={onOwnerChange}
            onOpenTask={onOpenTask}
          />
        </Box>
      ))}
    </Stack>
  );
}

function MilestoneCard({
  milestone,
  number,
  status,
  plan,
  onOwnerChange,
  onOpenTask,
}: {
  milestone: Milestone;
  number: number;
  status: MilestoneStatus;
  plan: WorkstreamPlan;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const AccordionHeader = presets.AccordionPresets.components.Header;
  const showRules = usePlanRulesStore((s) => s.showRules);
  const muted = tokens.semantic.color.type.muted.value;
  const tasks = plan.tasks.filter((t) => t.milestoneId === milestone.id);
  const headingId = `milestone-${milestone.id}`;

  return (
    <Card component="section" variant="outlined" aria-labelledby={headingId} sx={{ p: 0 }}>
      <CardContent sx={{ p: SPACE.block, "&:last-child": { pb: SPACE.block } }}>
        <Stack gap={SPACE.group}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={SPACE.group} flexWrap="wrap">
            <Stack gap={SPACE.pair}>
              <Typography variant="textMd" sx={{ color: muted }}>
                Milestone {number}
              </Typography>
              <Typography
                id={headingId}
                variant="h6"
                component="h3"
                sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}
              >
                {milestone.title}
              </Typography>
            </Stack>
            <StatusIndicator color={STATUS_COLOR[status]} label={status} />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: SPACE.block,
            }}
          >
            <Contract label="Starts when">{milestone.startsWhen}</Contract>
            <Contract label="Done when">{milestone.doneWhen}</Contract>
            <Contract label="Approval">{milestone.approver}</Contract>
          </Box>

          <TaskTable
            tasks={tasks}
            onOwnerChange={onOwnerChange}
            onOpenTask={onOpenTask}
            ariaLabel={`Tasks in ${milestone.title}`}
          />

          {/* Hidden unless the Demo settings toggle is on. */}
          {showRules ? (
            <Accordion disableGutters data-atlas-alignment="start">
              <AccordionSummary aria-controls={`${headingId}-rules`} id={`${headingId}-rules-header`}>
                <AccordionHeader
                  titleTextProps={{
                    text: "How Cowork Handles This",
                    variant: "body1",
                    component: "h4",
                  }}
                  subtitleText={`${milestone.rules.length} rules, plus the rules for every milestone`}
                />
              </AccordionSummary>
              <AccordionDetails id={`${headingId}-rules`}>
                <RuleTable rules={milestone.rules} ariaLabel={`Rules in ${milestone.title}`} />
              </AccordionDetails>
            </Accordion>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Contract({ label, children }: { label: string; children: string }) {
  return (
    <Stack gap={SPACE.pair}>
      <FieldLabel>{label}</FieldLabel>
      <Typography variant="body1">{children}</Typography>
    </Stack>
  );
}
