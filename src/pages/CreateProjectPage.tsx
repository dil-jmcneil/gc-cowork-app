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
import { FieldLabel, SectionCard } from "@/components/projects/SectionCard";
import { SourceChangeCard } from "@/components/projects/SourceChangeCard";
import { TaskTable } from "@/components/projects/TaskTable";
import { draftChatId, seedDraftChat } from "@/projects/draftChat";
import type { ProjectDraft } from "@/projects/project";
import { draftProjectFromChange } from "@/projects/projectDraft";
import { useProjectStore } from "@/projects/projectStore";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

export default function CreateProjectPage() {
  const [params] = useSearchParams();
  const change = REGULATORY_CHANGES.find((c) => c.id === params.get("change"));
  const existing = useProjectStore((s) =>
    change ? s.projects.find((p) => p.sourceChangeId === change.id) : undefined,
  );

  if (!change) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">We couldn't find that regulatory change.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }
  if (existing) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">There's already a project for this change.</Typography>
        <Link component={RouterLink} to={`/projects/${existing.id}`}>
          Open {existing.name}
        </Link>
      </Stack>
    );
  }
  return <CreateProjectForm key={change.id} initialDraft={draftProjectFromChange(change)} />;
}

function CreateProjectForm({ initialDraft }: { initialDraft: ProjectDraft }) {
  const { tokens, presets } = useTheme();
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [draft, setDraft] = useState(initialDraft);
  const change = REGULATORY_CHANGES.find((c) => c.id === draft.sourceChangeId)!;
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

  useEffect(() => seedDraftChat(change), [change]);

  const setPlan = (patch: Partial<ProjectDraft["plan"]>) =>
    setDraft((d) => ({ ...d, plan: { ...d.plan, ...patch } }));

  const handleCreate = () => {
    const project = createProject({ ...draft, plan: { ...draft.plan, status: "accepted" } });
    navigate(`/projects/${project.id}`);
  };

  return (
    <SideChatLayout chatId={draftChatId(change.id)}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack gap={3}>
          <Stack gap={0.5}>
            <Typography variant="h4" component="h1">
              Create project
            </Typography>
            <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
              Cowork drafted this from the regulatory change. Review it, then create the project.
            </Typography>
          </Stack>

          <Grid {...presets.GridPresets.page}>
            <Grid item sm={4} md={8} lg={5} xl={8}>
              <Stack gap={2}>
                <SectionCard title="Project details">
                  <Stack gap={2}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="project-name">Name</FormLabel>
                      <TextField
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        slotProps={{ input: { id: "project-name" } }}
                      />
                    </FormControl>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="project-description">Description of change</FormLabel>
                      <TextField
                        multiline
                        minRows={2}
                        value={draft.description}
                        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                        slotProps={{ input: { id: "project-description" } }}
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
              <SourceChangeCard change={change} />
            </Grid>
          </Grid>

          <SectionCard
            title="Proposed plan"
            action={<StatusIndicator color="subtle" label="Draft" />}
          >
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
              <Stack gap={0.5}>
                <FieldLabel>Tasks</FieldLabel>
                <TaskTable
                  tasks={draft.plan.tasks}
                  onOwnerChange={(taskId, owner) =>
                    setPlan({
                      tasks: draft.plan.tasks.map((t) => (t.id === taskId ? { ...t, delegate: owner } : t)),
                    })
                  }
                />
              </Stack>
            </Stack>
          </SectionCard>

          <Stack direction="row" justifyContent="flex-end" gap={1.5}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate}>
              Accept plan and start project
            </Button>
          </Stack>
        </Stack>
      </Container>
    </SideChatLayout>
  );
}
