import {
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  Switch,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import type { ReactNode } from "react";

import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { usePlanRulesStore } from "@/demo/planRulesStore";
import { useThemeVariantStore, type ThemeVariant } from "@/demo/themeVariantStore";

import { DemoSettingsCardOption } from "./DemoSettingsCardOption";

type DemoSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

/** Demo settings panel: switches between the Default and Refreshed themes, shows or hides plan rules, and brings back post-MVP views. */
export function DemoSettingsDialog({ open, onClose }: DemoSettingsDialogProps) {
  const { tokens } = useTheme();
  const themeVariant = useThemeVariantStore((s) => s.variant);
  const setThemeVariant = useThemeVariantStore((s) => s.setVariant);
  const showRules = usePlanRulesStore((s) => s.showRules);
  const setShowRules = usePlanRulesStore((s) => s.setShowRules);
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const setShowPostMvpViews = useMvpScopeStore((s) => s.setShowPostMvpViews);

  const selectThemeVariant = (next: ThemeVariant) => {
    setThemeVariant(next);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: tokens.semantic.radius.lg.value,
            maxWidth: 440,
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1.5,
        }}
      >
        <Typography
          component="h2"
          variant="textMd"
          sx={{
            flex: 1,
            fontWeight: tokens.semantic.fontWeight.emphasis.value,
            color: tokens.semantic.color.type.default.value,
          }}
        >
          Demo Settings
        </Typography>
        <IconButton size="small" aria-label="Close demo settings" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <DialogContent sx={{ pt: 0, pb: 3 }}>
        <Stack gap={3}>
          <DemoSettingsSection label="Theme">
            <DemoSettingsCardOption
              title="Default"
              description="Today's shipped Atlas surface, unchanged."
              selected={themeVariant === "current"}
              onSelect={() => selectThemeVariant("current")}
            />
            <DemoSettingsCardOption
              title="Refreshed"
              description="Lighter muted text and primary color, summarized reasoning, and a simplified tool-call presentation."
              selected={themeVariant === "refreshed"}
              onSelect={() => selectThemeVariant("refreshed")}
            />
          </DemoSettingsSection>
          <DemoSettingsSection label="Plans">
            <FormControlLabel
              control={
                <Switch
                  checked={showRules}
                  onChange={(e) => setShowRules(e.target.checked)}
                  slotProps={{ input: { "aria-label": "Show Cowork's rules on plans" } }}
                />
              }
              label="Show Cowork's rules on plans"
            />
          </DemoSettingsSection>
          <DemoSettingsSection label="Workstreams">
            <FormControlLabel
              control={
                <Switch
                  checked={showPostMvpViews}
                  onChange={(e) => setShowPostMvpViews(e.target.checked)}
                  slotProps={{ input: { "aria-label": "Show post-MVP views" } }}
                />
              }
              label="Show post-MVP views: task pages, the task dialog, and the older create page"
            />
          </DemoSettingsSection>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function DemoSettingsSection({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={1.25}>
      <Typography
        variant="textSm"
        sx={{
          fontWeight: tokens.semantic.fontWeight.emphasis.value,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          color: tokens.semantic.color.type.muted.value,
        }}
      >
        {label}
      </Typography>
      <Stack gap={1.5}>{children}</Stack>
    </Stack>
  );
}
