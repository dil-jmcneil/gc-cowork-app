import { Stack } from "@mui/material";
import { useNavigate } from "react-router";

import { startChatFromPrompt } from "@/chat/startChat";
import { AtlasChatBoxComposer } from "@/components/chat/AtlasChatBoxComposer";

export function PrototypeHomeComposer() {
  const navigate = useNavigate();

  return (
    <Stack gap={1.5} sx={{ width: "100%" }}>
      <AtlasChatBoxComposer
        onSubmit={(prompt) => {
          startChatFromPrompt(prompt, navigate);
          return false;
        }}
      />
    </Stack>
  );
}
