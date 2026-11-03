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
import { DETAIL_DIALOG_PAPER, SPACE } from "@/lib/layout";

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
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: DETAIL_DIALOG_PAPER }}>
      {/* 48px right padding leaves room for the close button. */}
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack gap={SPACE.pair} alignItems="flex-start" sx={{ width: "100%", minWidth: 0, textAlign: "left" }}>
          {/* The Atlas dialog title styles any h2 at 22px; keep the 16px h5. */}
          <Typography
            variant="h5"
            component="h2"
            sx={(theme) => ({
              "&.MuiTypography-root": { ...theme.typography.h5, fontWeight: tokens.semantic.fontWeight.emphasis.value },
            })}
          >
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
              <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
                {SOURCE_LINK_LABEL[insightType(insight)]}
              </Typography>
            </Link>
          ) : null}
        </Stack>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: (theme) => theme.spacing(SPACE.group),
            right: (theme) => theme.spacing(SPACE.group),
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack gap={SPACE.block}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={SPACE.block}>
            <Stack direction="row" alignItems="flex-start" gap={SPACE.item} sx={{ color: muted, minWidth: 0 }}>
              <CalendarIcon aria-hidden style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: "inherit" }}>
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
              p: SPACE.block,
            }}
          >
            <Stack gap={SPACE.pair}>
              <SectionLabel>Summary</SectionLabel>
              <Typography variant="body1">{insight.summary}</Typography>
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 3fr) minmax(0, 2fr)" },
              gap: SPACE.section,
            }}
          >
            <Stack gap={SPACE.item}>
              <SectionLabel>{RELEVANCE_LABEL[type]}</SectionLabel>
              <Stack gap={SPACE.item}>
                {insight.reasonsRelevant.map((reason) => (
                  <Stack key={reason} direction="row" gap={SPACE.item} alignItems="flex-start">
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
                    <Typography variant="body1">{reason}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Stack gap={SPACE.block}>
              <Stack gap={SPACE.item}>
                <SectionLabel>Key Deadlines</SectionLabel>
                <Stack gap={SPACE.item}>
                  {insight.deadlines.map((deadline) => (
                    <Stack key={deadline.label} gap={SPACE.pair}>
                      <Typography variant="body1" sx={{ fontWeight: emphasis }}>
                        {deadline.label}
                      </Typography>
                      {deadline.description ? (
                        <Typography variant="textMd" sx={{ color: muted }}>
                          {deadline.description}
                        </Typography>
                      ) : null}
                      <Typography variant="textMd" sx={{ color: muted }}>
                        {formatDate(deadline.date)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              <Stack gap={SPACE.item}>
                <Stack direction="row" alignItems="center" gap={SPACE.item}>
                  <OpenFileIcon aria-hidden style={{ width: 16, height: 16, color: muted }} />
                  <SectionLabel>Linked Workstreams</SectionLabel>
                </Stack>
                {workstream ? (
                  <Link component={RouterLink} to={`/workstreams/${workstream.id}`} onClick={onClose} underline="hover">
                    <Typography variant="body1" sx={{ color: "inherit", fontWeight: emphasis }}>
                      {workstream.name}
                    </Typography>
                  </Link>
                ) : (
                  <Typography variant="body1" sx={{ color: muted }}>
                    No workstream yet.
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>
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
    <Typography variant="h6" component="h3" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
      {children}
    </Typography>
  );
}
