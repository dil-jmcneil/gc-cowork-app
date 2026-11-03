import { ClickableCard } from "@diligentcorp/atlas-react-bundle";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { DUE_SOON_PROMPT, RESEARCH_REGULATION_PROMPT, SHOW_INSIGHTS_PROMPT } from "@/home/quickActionPrompts";
import { SPACE } from "@/lib/layout";

/** Three quick action cards under the home composer; each starts a prompted chat. */

type QuickAction = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

const ACTIONS: QuickAction[] = [
  {
    id: "insights",
    title: "Show recent insights",
    description: "See new rulings and rule changes that affect us, and why each one matters.",
    prompt: SHOW_INSIGHTS_PROMPT,
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
    <Stack gap={SPACE.item}>
      <Stack direction={{ xs: "column", sm: "row" }} gap={SPACE.item} role="list" aria-label="Quick actions">
        {ACTIONS.map((action) => (
          <Box key={action.id} role="listitem" sx={{ flex: 1, minWidth: 0, display: "flex" }}>
            <ClickableCard
              onClick={() => startChatFromPrompt(action.prompt, navigate)}
              sx={{
                flex: 1,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                gap: SPACE.pair,
                px: SPACE.group,
                py: SPACE.group,
              }}
            >
              <Typography
                component="span"
                variant="body1"
                sx={{
                  fontWeight: tokens.semantic.fontWeight.emphasis.value,
                  color: tokens.semantic.color.type.default.value,
                }}
              >
                {action.title}
              </Typography>
              <Typography component="span" variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
                {action.description}
              </Typography>
            </ClickableCard>
          </Box>
        ))}
      </Stack>
      <Typography
        variant="textMd"
        align="center"
        sx={{ color: tokens.semantic.color.type.muted.value, pt: SPACE.pair }}
      >
        AI-generated content may have inaccuracies.
      </Typography>
    </Stack>
  );
}
