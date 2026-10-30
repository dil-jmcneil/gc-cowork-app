import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import {
  DUE_SOON_PROMPT,
  RESEARCH_REGULATION_PROMPT,
  SHOW_REGULATORY_CHANGES_PROMPT,
} from "@/home/quickActionPrompts";

/** Three quick action cards under the home composer; each starts a prompted chat. */

type QuickAction = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

const ACTIONS: QuickAction[] = [
  {
    id: "regulatory-changes",
    title: "Show recent regulatory changes",
    description: "See what's changed in the rules that affect us, and why each one matters.",
    prompt: SHOW_REGULATORY_CHANGES_PROMPT,
  },
  {
    id: "due-soon",
    title: "See what's due in the next two weeks",
    description: "Check upcoming filing and compliance deadlines across your obligations.",
    prompt: DUE_SOON_PROMPT,
  },
  {
    id: "research-regulation",
    title: "Research a regulation",
    description: "Pull the current text of a rule and trace its recent amendments.",
    prompt: RESEARCH_REGULATION_PROMPT,
  },
];

export function HomeQuickActions() {
  const { tokens } = useTheme();
  const navigate = useNavigate();

  return (
    <Stack gap={1}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1.25}
        role="list"
        aria-label="Quick actions"
      >
        {ACTIONS.map((action) => (
          <Box
            key={action.id}
            role="listitem"
            component="button"
            type="button"
            onClick={() => startChatFromPrompt(action.prompt, navigate)}
            sx={{
              flex: 1,
              minWidth: 0,
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              px: 1.75,
              py: 1.5,
              borderRadius: tokens.semantic.radius.lg.value,
              border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
              bgcolor: tokens.semantic.color.surface.default.value,
              transition:
                "border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease",
              "&:hover": {
                borderColor: tokens.semantic.color.outline.default.value,
                bgcolor: tokens.semantic.color.surface.subtle.value,
              },
              "&:focus-visible": {
                outline: `${tokens.semantic.borderWidth.focusWidth.value} solid ${tokens.semantic.color.ui.focusRing.value}`,
                outlineOffset: 2,
              },
            }}
          >
            <Typography
              component="span"
              variant="textMd"
              sx={{
                fontWeight: tokens.semantic.fontWeight.emphasis.value,
                color: tokens.semantic.color.type.default.value,
              }}
            >
              {action.title}
            </Typography>
            <Typography
              component="span"
              variant="textSm"
              sx={{ color: tokens.semantic.color.type.muted.value }}
            >
              {action.description}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Typography
        variant="textSm"
        align="center"
        sx={{ color: tokens.semantic.color.type.muted.value, pt: 0.5 }}
      >
        AI-generated content may have inaccuracies.
      </Typography>
    </Stack>
  );
}
