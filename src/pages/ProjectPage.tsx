import {
  Box,
  Button,
  Container,
  GridLegacy as Grid,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { FieldLabel, SectionCard } from "@/components/projects/SectionCard";
import { SourceChangeCard } from "@/components/projects/SourceChangeCard";
import { TaskTable } from "@/components/projects/TaskTable";
import { TaskQuickView } from "@/components/tasks/TaskQuickView";
import { useProjectStore } from "@/projects/projectStore";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { tokens, presets } = useTheme();
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const acceptPlan = useProjectStore((s) => s.acceptPlan);
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  if (!project) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">Project not found.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }

  const change = REGULATORY_CHANGES.find((c) => c.id === project.sourceChangeId);
  const muted = tokens.semantic.color.type.muted.value;
  const planAccepted = project.plan.status === "accepted";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Stack gap={0.5}>
          <Typography variant="textSm" sx={{ color: muted, fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            Project
          </Typography>
          <Typography variant="h4" component="h1">
            {project.name}
          </Typography>
        </Stack>

        <Grid {...presets.GridPresets.page}>
          <Grid item sm={4} md={8} lg={5} xl={8}>
            <Stack gap={2}>
              <SectionCard title="Status Summary">
                <Typography variant="textMd">{project.statusSummary}</Typography>
              </SectionCard>
              <SectionCard title="About This Change">
                <Typography variant="textMd">{project.description}</Typography>
                <Stack gap={0.5}>
                  <FieldLabel>Why it's relevant</FieldLabel>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {project.reasonsRelevant.map((reason) => (
                      <Typography component="li" variant="textMd" key={reason}>
                        {reason}
                      </Typography>
                    ))}
                  </Box>
                </Stack>
              </SectionCard>

            </Stack>
          </Grid>

          <Grid item sm={4} md={8} lg={3} xl={4}>
            <Stack gap={2}>
              {change ? <SourceChangeCard change={change} /> : null}
            </Stack>
          </Grid>
        </Grid>

        <SectionCard
          title="Plan"
          action={
            <StatusIndicator
              color={planAccepted ? "success" : "subtle"}
              label={planAccepted ? "Accepted" : "Draft"}
            />
          }
        >
          <Stack gap={0.5}>
            <FieldLabel>Proposed approach</FieldLabel>
            <Typography variant="textMd">{project.plan.proposedApproach}</Typography>
          </Stack>
          <Stack gap={0.5}>
            <FieldLabel>Tasks</FieldLabel>
            <TaskTable tasks={project.plan.tasks} onOpenTask={setOpenTaskId} />
          </Stack>
          <Stack direction="row" gap={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => startChatFromPrompt(`Help me revise the plan for "${project.name}".`, navigate)}
            >
              Revise via chat
            </Button>
            {planAccepted ? null : (
              <Button variant="contained" onClick={() => acceptPlan(project.id)}>
                Accept plan
              </Button>
            )}
          </Stack>
        </SectionCard>
      </Stack>
      <TaskQuickView
        taskRef={openTaskId ? { projectId: project.id, taskId: openTaskId } : null}
        onClose={() => setOpenTaskId(null)}
      />
    </Container>
  );
}
