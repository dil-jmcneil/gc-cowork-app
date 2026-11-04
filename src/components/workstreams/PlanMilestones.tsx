import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";
import CaretRightIcon from "@diligentcorp/atlas-react-bundle/icons/CaretRight";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonBase,
  Card,
  Collapse,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";

import { usePlanRulesStore } from "@/demo/planRulesStore";
import { SPACE } from "@/lib/layout";
import { milestoneProgress, type MilestoneProgress } from "@/workstreams/milestones";
import type { TaskOwner } from "@/workstreams/people";
import type { Milestone, WorkstreamPlan } from "@/workstreams/workstream";

import { RuleTable } from "./RuleTable";
import { FieldLabel } from "./SectionCard";
import { TaskTable } from "./TaskTable";
import { TimelineList } from "./Timeline";

const STATUS_COLOR: Record<MilestoneProgress["status"], "success" | "information" | "error" | "subtle"> = {
  Done: "success",
  "In progress": "information",
  Blocked: "error",
  "Not started": "subtle",
};

/** Element id a workstream link scrolls to, for `?milestone=`. */
export function milestoneAnchorId(milestoneId: string): string {
  return `milestone-card-${milestoneId}`;
}

/**
 * The plan's spine, simplified: one row per milestone with its status, who
 * owns the open work, and whether it needs you, with the action that clears
 * it. A row expands to its contract, its tasks and its own timeline.
 */
export function PlanMilestones({
  plan,
  now = new Date(),
  onOwnerChange,
  onOpenTask,
  onConfirmTask,
  highlightTaskId,
  focusMilestoneId,
  showTimeline = false,
}: {
  plan: WorkstreamPlan;
  now?: Date;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  onOpenTask?: (taskId: string) => void;
  /** Confirms a task that waits on your review, from its milestone's row. */
  onConfirmTask?: (taskId: string) => void;
  /** The task a link opened the page on. */
  highlightTaskId?: string;
  /** The milestone a link opened the page on; it starts expanded. */
  focusMilestoneId?: string;
  /** Show each milestone's activity; off for a draft, which has none. */
  showTimeline?: boolean;
}) {
  return (
    <Stack component="ol" gap={SPACE.item} aria-label="Milestones" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {plan.milestones.map((milestone, index) => (
        <Box component="li" key={milestone.id}>
          <MilestoneRow
            milestone={milestone}
            number={index + 1}
            plan={plan}
            now={now}
            onOwnerChange={onOwnerChange}
            onOpenTask={onOpenTask}
            onConfirmTask={onConfirmTask}
            highlightTaskId={highlightTaskId}
            focused={milestone.id === focusMilestoneId}
            showTimeline={showTimeline}
          />
        </Box>
      ))}
    </Stack>
  );
}

function MilestoneRow({
  milestone,
  number,
  plan,
  now,
  onOwnerChange,
  onOpenTask,
  onConfirmTask,
  highlightTaskId,
  focused,
  showTimeline,
}: {
  milestone: Milestone;
  number: number;
  plan: WorkstreamPlan;
  now: Date;
  onOwnerChange?: (taskId: string, owner: TaskOwner) => void;
  onOpenTask?: (taskId: string) => void;
  onConfirmTask?: (taskId: string) => void;
  highlightTaskId?: string;
  focused: boolean;
  showTimeline: boolean;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const AccordionHeader = presets.AccordionPresets.components.Header;
  const showRules = usePlanRulesStore((s) => s.showRules);
  const muted = tokens.semantic.color.type.muted.value;
  const tasks = plan.tasks.filter((t) => t.milestoneId === milestone.id);
  const progress = milestoneProgress(milestone, plan.tasks, now, plan.milestones);
  const awaiting = tasks.find((t) => t.awaitingReview);
  // A milestone that needs you, or that a link pointed at, opens on its details.
  const [expanded, setExpanded] = useState(focused || progress.needsYou);
  const headingId = `milestone-${milestone.id}`;
  const detailsId = `${headingId}-details`;
  const Caret = expanded ? CaretDownIcon : CaretRightIcon;

  return (
    <Card
      component="section"
      id={milestoneAnchorId(milestone.id)}
      variant="outlined"
      aria-labelledby={headingId}
      sx={{ p: 0 }}
    >
      <Stack direction="row" alignItems="flex-start" gap={SPACE.group} sx={{ p: SPACE.block }}>
        <ButtonBase
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((v) => !v)}
          sx={{ flex: 1, minWidth: 0, justifyContent: "flex-start", textAlign: "left", borderRadius: 1 }}
        >
          <Stack direction="row" alignItems="flex-start" gap={SPACE.item} sx={{ minWidth: 0 }}>
            <Caret aria-hidden style={{ width: 20, height: 20, flexShrink: 0, marginTop: 18, color: muted }} />
            <Stack gap={SPACE.pair} sx={{ minWidth: 0 }}>
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
              <Typography variant="body1" sx={{ color: muted }}>
                <Box component="span" sx={{ color: tokens.semantic.color.type.default.value }}>
                  {progress.owner}
                </Box>
                {progress.blockedBy && !progress.needsYou ? ` · Waiting on ${progress.blockedBy}` : null}
              </Typography>
            </Stack>
          </Stack>
        </ButtonBase>

        <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ flexShrink: 0 }}>
          {progress.needsYou ? (
            <>
              <StatusIndicator color="warning" label="Needs you" />
              {awaiting && onConfirmTask ? (
                <Button
                  variant="contained"
                  size="xsmall"
                  onClick={() => onConfirmTask(awaiting.id)}
                  aria-label={`Confirm and close ${awaiting.description}`}
                >
                  Confirm and close
                </Button>
              ) : null}
            </>
          ) : (
            <StatusIndicator
              // Blocked on you reads as a warning, like "Needs you"; blocked on someone else as an error.
              color={progress.blockedBy === "you" ? "warning" : STATUS_COLOR[progress.status]}
              label={progress.status}
            />
          )}
        </Stack>
      </Stack>

      <Collapse in={expanded} id={detailsId}>
        <Stack gap={SPACE.block} sx={{ px: SPACE.block, pb: SPACE.block }}>
          <Stack gap={SPACE.pair}>
            <Contract label="Starts when">{milestone.startsWhen}</Contract>
            <Contract label="Done when">{milestone.doneWhen}</Contract>
            <Contract label="Approval">{milestone.approver}</Contract>
          </Stack>

          <TaskTable
            tasks={tasks}
            onOwnerChange={onOwnerChange}
            onOpenTask={onOpenTask}
            highlightTaskId={highlightTaskId}
            ariaLabel={`Tasks in ${milestone.title}`}
          />

          {showTimeline ? (
            <Stack gap={SPACE.item}>
              <FieldLabel>Timeline</FieldLabel>
              <TimelineList
                items={tasks.flatMap((task) => task.history.map((entry) => ({ entry, context: task.description })))}
                ariaLabel={`Timeline for ${milestone.title}`}
                now={now}
              />
            </Stack>
          ) : null}

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
      </Collapse>
    </Card>
  );
}

/** One line of the milestone's contract: a muted label, then the condition. */
function Contract({ label, children }: { label: string; children: string }) {
  const { tokens } = useTheme();
  return (
    <Typography variant="body1">
      <Box component="span" sx={{ color: tokens.semantic.color.type.muted.value }}>
        {label}:{" "}
      </Box>
      {children}
    </Typography>
  );
}
