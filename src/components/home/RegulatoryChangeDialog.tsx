import CalendarIcon from "@diligentcorp/atlas-react-bundle/icons/Calendar";
import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import InfoIcon from "@diligentcorp/atlas-react-bundle/icons/Info";
import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { formatDate } from "@/lib/dates";
import { useProjectStore } from "@/projects/projectStore";
import type { RegulatoryChange } from "@/regulatory/regulatoryChange";
import { projectActionForChange } from "@/regulatory/regulatoryChangeActions";
import { STATUS_COLOR } from "@/regulatory/regulatoryStatus";

const SEE_IN_CHAT_PROMPT_PREFIX = "Tell me about";

export function RegulatoryChangeDialog({
  change,
  onClose,
}: {
  change: RegulatoryChange | null;
  onClose: () => void;
}) {
  const { tokens, presets } = useTheme();
  const navigate = useNavigate();
  const project = useProjectStore((s) =>
    change ? s.projects.find((p) => p.sourceChangeId === change.id) : undefined,
  );
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  if (!change) return null;
  const action = projectActionForChange(change.id, project);

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack gap={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h2">
            {change.title}
          </Typography>
          <Typography variant="textMd" sx={{ color: muted }}>
            {change.regulatoryBody}
          </Typography>
        </Stack>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack gap={2.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack direction="row" alignItems="center" gap={1} sx={{ color: muted }}>
              <CalendarIcon aria-hidden style={{ width: 16, height: 16 }} />
              <Typography variant="textMd" sx={{ color: "inherit" }}>
                Effective: {formatDate(change.effectiveDate)}
              </Typography>
            </Stack>
            <StatusIndicator color={STATUS_COLOR[change.status]} label={change.status} />
          </Stack>

          <Box
            sx={{
              bgcolor: tokens.semantic.color.surface.subtle.value,
              borderRadius: tokens.semantic.radius.lg.value,
              p: 2,
            }}
          >
            <Stack gap={0.5}>
              <SectionLabel>Summary</SectionLabel>
              <Typography variant="textMd">{change.summary}</Typography>
            </Stack>
          </Box>

          <Stack gap={1}>
            <SectionLabel>Reasons Relevant</SectionLabel>
            <Stack gap={0.75}>
              {change.reasonsRelevant.map((reason) => (
                <Stack key={reason} direction="row" gap={1} alignItems="flex-start">
                  <InfoIcon
                    aria-hidden
                    style={{ width: 16, height: 16, marginTop: 2, color: muted, flexShrink: 0 }}
                  />
                  <Typography variant="textMd">{reason}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Stack gap={1}>
            <SectionLabel>Key Deadlines</SectionLabel>
            <Stack gap={1.25}>
              {change.deadlines.map((deadline) => (
                <Stack key={deadline.label} gap={0.25}>
                  <Typography variant="textMd" sx={{ fontWeight: emphasis }}>
                    {deadline.label}
                  </Typography>
                  {deadline.description ? (
                    <Typography variant="textMd" sx={{ color: muted }}>
                      {deadline.description}
                    </Typography>
                  ) : null}
                  <Typography variant="textSm" sx={{ color: muted }}>
                    {formatDate(deadline.date)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Stack gap={1}>
            <Stack direction="row" alignItems="center" gap={1}>
              <OpenFileIcon aria-hidden style={{ width: 16, height: 16, color: muted }} />
              <SectionLabel>Linked Projects</SectionLabel>
            </Stack>
            {project ? (
              <Link component={RouterLink} to={`/projects/${project.id}`} onClick={onClose} underline="hover">
                <Typography variant="textMd" sx={{ color: "inherit", fontWeight: emphasis }}>
                  {project.name}
                </Typography>
              </Link>
            ) : (
              <Typography variant="textMd" sx={{ color: muted }}>
                No project yet.
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            onClose();
            startChatFromPrompt(`${SEE_IN_CHAT_PROMPT_PREFIX} ${change.title.toLowerCase()}.`, navigate);
          }}
        >
          See in chat
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            onClose();
            navigate(action.href);
          }}
        >
          {action.kind === "create" ? "Create project" : `View project`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Typography
      variant="textSm"
      sx={{
        color: tokens.semantic.color.type.muted.value,
        fontWeight: tokens.semantic.fontWeight.emphasis.value,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}
