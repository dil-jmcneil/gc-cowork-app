import { Box, Tooltip, useTheme } from "@mui/material";
import LightbulbIcon from "@diligentcorp/atlas-react-bundle/icons/Lightbulb";
import { useState } from "react";

import { DemoSettingsDialog } from "./DemoSettingsDialog";

/**
 * Fixed bottom-right control that opens the Demo settings dialog.
 * Only intended for the prototype's Command Center home page.
 */
export function DemoSettingsFab() {
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Demo settings" placement="left">
        <Box
          component="button"
          type="button"
          aria-label="Demo settings"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: (theme) => theme.zIndex.fab,
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              tokens.semantic.color.status.success.background.value,
            color: tokens.semantic.color.status.success.text.value,
            boxShadow: tokens.core.shadow.medium.value.stringValue,
            transition: "transform 120ms ease, box-shadow 120ms ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: tokens.core.shadow.high.value.stringValue,
            },
            "&:focus-visible": {
              outline: `${tokens.semantic.borderWidth.focusWidth.value} solid ${tokens.semantic.color.ui.focusRing.value}`,
              outlineOffset: tokens.semantic.borderWidth.focusOffset.value,
            },
          }}
        >
          <LightbulbIcon style={{ width: 24, height: 24 }} />
        </Box>
      </Tooltip>
      <DemoSettingsDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
