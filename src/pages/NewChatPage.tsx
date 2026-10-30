import { Box, Container, Stack } from "@mui/material";

import { CommandCenterChatHero } from "@/components/CommandCenterChatHero";
import { PrototypeHomeComposer } from "@/components/chat/PrototypeHomeComposer";

export default function NewChatPage() {
  return (
    <Container maxWidth={false} sx={{ maxWidth: 960, py: 5, mx: "auto" }}>
      <Stack gap={4} sx={{ height: "calc(100vh - 160px)" }}>
        <CommandCenterChatHero />

        <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
          <PrototypeHomeComposer />
        </Box>
      </Stack>
    </Container>
  );
}
