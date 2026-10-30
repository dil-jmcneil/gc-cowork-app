import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { SHOW_REGULATORY_CHANGES_PROMPT } from "@/home/quickActionPrompts";

export default function IndexPage() {
  const navigate = useNavigate();
  return (
    <Stack gap={2} sx={{ p: 4 }} alignItems="flex-start">
      <Typography variant="h3">Home</Typography>
      <Button
        variant="contained"
        onClick={() => startChatFromPrompt(SHOW_REGULATORY_CHANGES_PROMPT, navigate)}
      >
        Try regulatory changes
      </Button>
    </Stack>
  );
}
