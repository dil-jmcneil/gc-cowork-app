// Accordion, AccordionDetails and AccordionSummary are for the hidden "How Cowork Handles This" section below.
import { Box, Stack, Typography, useTheme } from "@mui/material";

import { milestoneStatuses, type MilestoneStatus } from "@/projects/milestones";
import type { TaskOwner } from "@/projects/people";
import type { Milestone, ProjectPlan } from "@/projects/project";

// import { RuleTable } from "./RuleTable";
import { FieldLabel } from "./SectionCard";
import { TaskTable } from "./TaskTable";

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
  plan: ProjectPlan;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const statuses = milestoneStatuses(plan.milestones, plan.tasks);
  return (
    <Stack component="ol" gap={2} aria-label="Milestones" sx={{ listStyle: "none", m: 0, p: 0 }}>
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
  plan: ProjectPlan;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  // const AccordionHeader = presets.AccordionPresets.components.Header;
  const muted = tokens.semantic.color.type.muted.value;
  const tasks = plan.tasks.filter((t) => t.milestoneId === milestone.id);
  const headingId = `milestone-${milestone.id}`;

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{
        border: `1px solid ${tokens.semantic.color.action.secondary.outlineDisabled.value}`,
        borderRadius: tokens.semantic.radius.lg.value,
        p: 2,
      }}
    >
      <Stack gap={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} flexWrap="wrap">
          <Stack gap={0.25}>
            <Typography variant="textMd" sx={{ color: muted }}>
              Milestone {number}
            </Typography>
            <Typography
              id={headingId}
              variant="h5"
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
            gap: 2,
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

        {/* Hidden for now; we may bring it back. The milestone's rules still drive the story.
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
        */}
      </Stack>
    </Box>
  );
}

function Contract({ label, children }: { label: string; children: string }) {
  return (
    <Stack gap={0.5}>
      <FieldLabel>{label}</FieldLabel>
      <Typography variant="textMd">{children}</Typography>
    </Stack>
  );
}
