import {
  AIChatBox,
  AIChatContextProvider,
  useAIChatContext,
  type AIChatBoxProps,
} from "@diligentcorp/atlas-react-bundle";
import { Box, useTheme } from "@mui/material";
import { useEffect, type ReactNode } from "react";

import { useThemeVariantStore } from "@/demo/themeVariantStore";
import bottomEdge from "@/assets/refreshed/composer-bottom.svg";
import rightEdge from "@/assets/refreshed/composer-right.svg";
import leftEdge from "@/assets/refreshed/composer-left.svg";

import { chatBodyTypography } from "./chatTypography";
import { RefreshedVoiceInput } from "./RefreshedVoiceInput";

const CHAT_BOX_DISCLAIMER = {
  text: "AI-generated content may have inaccuracies.",
  linkText: "Learn more.",
  href: "#",
} as const;

const HIDDEN_CHAT_BOX_DISCLAIMER = {
  text: "",
  linkText: "",
  href: "",
  stackProps: {
    sx: { display: "none" },
  },
} as const;

type AtlasChatBoxComposerProps = {
  onSubmit: NonNullable<AIChatBoxProps["onSubmit"]>;
  onStop?: AIChatBoxProps["onStop"];
  contentBelow?: ReactNode;
  /** Sync Atlas generating state with an external streaming flag. */
  isStreaming?: boolean;
  /** Show the default AI disclaimer beneath the composer. */
  showDisclaimer?: boolean;
  slotProps?: AIChatBoxProps["slotProps"];
};

export function AtlasChatBoxComposerInner({
  onSubmit,
  onStop,
  contentBelow,
  isStreaming,
  showDisclaimer = false,
  slotProps,
}: AtlasChatBoxComposerProps) {
  const theme = useTheme();
  const refreshed = useThemeVariantStore((s) => s.variant === "refreshed");
  const { setIsGenerating } = useAIChatContext();

  useEffect(() => {
    if (isStreaming === undefined) return;
    setIsGenerating(isStreaming);
  }, [isStreaming, setIsGenerating]);

  return (
    <AIChatBox
      onSubmit={onSubmit}
      onStop={(event) => {
        setIsGenerating(false);
        onStop?.(event);
      }}
      trailingActions={refreshed ? <RefreshedVoiceInput /> : undefined}
      contentBelow={contentBelow}
      slotProps={{
        ...slotProps,
        root: {
          ...slotProps?.root,
          sx: {
            maxWidth: "100%",
            "& .AtlasAIGlow-root, & .AtlasAIChatBox-gradient-border": { display: "none" },
            ...(refreshed ? {
              "& .AtlasAIChatBox-container": {
                backgroundColor: "#e6e6e6", borderRadius: "12px",
                boxShadow: "-1px 4px 8px #00000014, -2px 9px 12px #0000000f, -12px 38px 24px #00000005, -12px 40px 20px #00000003",
                "&:hover": { backgroundColor: "var(--lens-core-color-concrete-80)" },
                "&::before": { content: '""', position: "absolute", pointerEvents: "none", left: 0, bottom: "-1px", width: "26.5px", height: "22px", zIndex: 1, background: `url(${leftEdge}) no-repeat`, transform: "scaleX(-1)" },
                "&::after": { content: '\"\"', position: "absolute", pointerEvents: "none", bottom: "-1px", left: "-1px", right: "-1px", height: "22px",
                  backgroundImage: `url(${rightEdge}), url(${bottomEdge})`,
                  backgroundPosition: "right bottom, center bottom",
                  backgroundRepeat: "no-repeat", backgroundSize: "26.5px 22px, calc(100% - 1px) 12.5px",
                },
              },
              "& .AtlasAIChatBox-text-field": { padding: 0 },
              "& .AtlasAIChatBox-text-field .MuiInputBase-input.MuiInputBase-inputMultiline": { padding: "20px 24px 0px", ...chatBodyTypography(theme) },
              "& .AtlasAIChatBox-actions": { padding: "8px 20px 20px", "& .MuiButton-root": { minHeight: "32px", height: "32px", padding: "4px 8px", borderRadius: "8px" }, "& .AtlasAIChatBox-upload-button, & .AtlasAIChatBox-submit-button": { width: "32px", minWidth: "32px", padding: "4px" } },
            } : {}),
            ...slotProps?.root?.sx,
          },
        },
        submitButton: { ...(refreshed ? { variant: "contained" as const, size: "small" as const } : {}), ...slotProps?.submitButton },
        textField: {
          placeholder: "Ask the assistant anything…",
          ...slotProps?.textField,
        },
        disclaimer: showDisclaimer
          ? {
              ...CHAT_BOX_DISCLAIMER,
              ...slotProps?.disclaimer,
            }
          : {
              ...HIDDEN_CHAT_BOX_DISCLAIMER,
              ...slotProps?.disclaimer,
              stackProps: {
                ...HIDDEN_CHAT_BOX_DISCLAIMER.stackProps,
                ...slotProps?.disclaimer?.stackProps,
                sx: {
                  ...HIDDEN_CHAT_BOX_DISCLAIMER.stackProps.sx,
                  ...slotProps?.disclaimer?.stackProps?.sx,
                },
              },
            },
      }}
    />
  );
}

export function AtlasChatBoxComposer(props: AtlasChatBoxComposerProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <AIChatContextProvider>
        <AtlasChatBoxComposerInner {...props} />
      </AIChatContextProvider>
    </Box>
  );
}
