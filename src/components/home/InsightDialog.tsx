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
import { InsightTags } from "@/components/insights/InsightTags";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { ISSUED_LABEL, RELEVANCE_LABEL, SOURCE_LINK_LABEL, insightType, type Insight } from "@/insights/insight";
import { workstreamActionForInsight } from "@/insights/insightActions";
import { STATUS_COLOR } from "@/insights/insightStatus";

const SEE_IN_CHAT_PROMPT_PREFIX = "Tell me about";

export function InsightDialog({ insight, onClose }: { insight: Insight | null; onClose: () => void }) {
  const { tokens, presets } = useTheme();
  const navigate = useNavigate();
  const workstream = useWorkstreamStore((s) =>
    insight ? s.workstreams.find((p) => p.sourceInsightId === insight.id) : undefined,
  );
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  if (!insight) return null;
  const action = workstreamActionForInsight(insight.id, workstream);
  const type = insightType(insight);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack gap={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h2">
            {insight.title}
          </Typography>
          <Typography variant="textMd" sx={{ color: muted }}>
            {insight.source}
            {insight.citation ? ` · ${insight.citation}` : ""}
          </Typography>
          {insight.sourceUrl ? (
            <Link
              href={insight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ alignSelf: "flex-start" }}
            >
              <Typography variant="textMd" sx={{ color: "inherit" }}>
                {SOURCE_LINK_LABEL[insightType(insight)]}
              </Typography>
            </Link>
          ) : null}
        </Stack>
        <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ position: "absolute", top: 12, right: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack gap={2.5}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="flex-start" gap={1} sx={{ color: muted, minWidth: 0 }}>
              <CalendarIcon aria-hidden style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
              <Typography variant="textMd" sx={{ color: "inherit" }}>
                {ISSUED_LABEL[type]} {formatDate(insight.issuedDate)}
                {insight.history ? `. ${insight.history}.` : ""}
              </Typography>
            </Stack>
            <Box sx={{ flexShrink: 0 }}>
              <StatusIndicator color={STATUS_COLOR[insight.status]} label={insight.status} />
            </Box>
          </Stack>

          <InsightTags tags={insight.tags} />

          <Box
            sx={{
              bgcolor: tokens.semantic.color.surface.subtle.value,
              borderRadius: tokens.semantic.radius.lg.value,
              p: 2,
            }}
          >
            <Stack gap={0.5}>
              <SectionLabel>Summary</SectionLabel>
              <Typography variant="textMd">{insight.summary}</Typography>
            </Stack>
          </Box>

          <Stack gap={1}>
            <SectionLabel>{RELEVANCE_LABEL[type]}</SectionLabel>
            <Stack gap={0.75}>
              {insight.reasonsRelevant.map((reason) => (
                <Stack key={reason} direction="row" gap={1} alignItems="flex-start">
                  <InfoIcon
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      marginTop: 2,
                      color: muted,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="textMd">{reason}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Stack gap={1}>
            <SectionLabel>Key Deadlines</SectionLabel>
            <Stack gap={1.25}>
              {insight.deadlines.map((deadline) => (
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
              <SectionLabel>Linked Workstreams</SectionLabel>
            </Stack>
            {workstream ? (
              <Link component={RouterLink} to={`/workstreams/${workstream.id}`} onClick={onClose} underline="hover">
                <Typography variant="textMd" sx={{ color: "inherit", fontWeight: emphasis }}>
                  {workstream.name}
                </Typography>
              </Link>
            ) : (
              <Typography variant="textMd" sx={{ color: muted }}>
                No workstream yet.
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
            startChatFromPrompt(`${SEE_IN_CHAT_PROMPT_PREFIX} ${insight.title.toLowerCase()}.`, navigate);
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
          {action.kind === "create" ? "Create workstream" : "View workstream"}
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
