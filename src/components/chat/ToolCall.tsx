import CheckedIcon from "@diligentcorp/atlas-react-bundle/icons/Checked";
import DownloadIcon from "@diligentcorp/atlas-react-bundle/icons/Download";
import EditFileIcon from "@diligentcorp/atlas-react-bundle/icons/EditFile";
import ExpandDownIcon from "@diligentcorp/atlas-react-bundle/icons/ExpandDown";
import LanguageIcon from "@diligentcorp/atlas-react-bundle/icons/Language";
import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import SearchIcon from "@diligentcorp/atlas-react-bundle/icons/Search";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Link,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";

import type { ToolCallStatus, ToolIconKind, ToolDownload } from "@/chat/chatTypes";
import { downloadTextFile } from "@/utils/downloadFile";
import { useThemeVariantStore } from "@/demo/themeVariantStore";
import { DiligentLogo } from "@/components/chat/DiligentLogo";
import { DiligentToolIconMuted } from "@/components/chat/DiligentToolIconMuted";

type IconComponent = ComponentType<{
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}>;

// Maps the abstract tool kind to a concrete Atlas icon. Mirrors the
// `ToolIcon` component set in the Figma file (web_search, file_read, etc.).
// Calls into a core internal Diligent system (Entities) use the branded
// Diligent lens mark rather than a generic glyph.
const TOOL_ICON: Record<ToolIconKind, IconComponent> = {
  entities_jurisdictions: DiligentLogo,
  web_search: SearchIcon,
  web_fetch: LanguageIcon,
  arca: OpenFileIcon,
  entities_person: DiligentLogo,
  fill_document: EditFileIcon,
  present_document: DownloadIcon,
  generic: LanguageIcon,
};

// Refreshed tool rows use the muted, multi-shade gray export of the Diligent
// mark (Figma `tool=diligent_app`) in place of the red branded icon — the
// real designed asset, not an approximation built by forcing the red mark's
// paths to a single flat `currentColor`.
const REFRESHED_TOOL_ICON_OVERRIDES: Partial<Record<ToolIconKind, IconComponent>> = {
  entities_jurisdictions: DiligentToolIconMuted,
  entities_person: DiligentToolIconMuted,
};

export type ToolCallProps = {
  toolName: string;
  toolKind: ToolIconKind;
  status: ToolCallStatus;
  requiresAuthorization?: boolean;
  defaultExpanded?: boolean;
  download?: ToolDownload;
  /** Slot content rendered inside the expanded, bordered details container. */
  children?: ReactNode;
  onApprove?: () => void;
  onDeny?: () => void;
};

/**
 * Custom tool-call row, built to match the Figma "ToolCall" component
 * (PUW-436). Rows are a simple icon + name header that can expand into a
 * bordered result container; the group-level vertical line is owned by
 * `ToolGroup`. States: running (subtle gray shimmer on the name), success
 * (muted name; a check briefly flashes before the caret), failed (error name
 * with "Failed:" prefix), paused (awaiting authorization with Deny/Approve).
 * All spacing/colors come from Atlas tokens.
 */
export function ToolCall({
  toolName,
  toolKind,
  status,
  requiresAuthorization = false,
  defaultExpanded = false,
  download,
  children,
  onApprove,
  onDeny,
}: ToolCallProps) {
  const { tokens } = useTheme();
  const isRefreshed = useThemeVariantStore((s) => s.variant === "refreshed");
  const Icon =
    (isRefreshed ? REFRESHED_TOOL_ICON_OVERRIDES[toolKind] : undefined) ??
    TOOL_ICON[toolKind] ??
    TOOL_ICON.generic;
  const isBranded = Icon === DiligentLogo;

  const showAuth = status === "paused" && requiresAuthorization && Boolean(onApprove || onDeny);
  const forcedOpen = status === "paused" || showAuth;
  const expandable = (Boolean(children) && !(isRefreshed && download)) || forcedOpen;

  const detailsId = useId();
  const [open, setOpen] = useState(defaultExpanded);
  const isOpen = forcedOpen || (expandable && open);

  // The moment a call completes, flash a check, then fall back to the caret.
  const [showCheck, setShowCheck] = useState(false);
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "success" && status === "success") {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 1100);
      prevStatusRef.current = status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
    return undefined;
  }, [status]);

  const spacing = tokens.core.spacing;
  const muted = isRefreshed ? "#6e7182" : tokens.semantic.color.type.muted.value;
  const lighterGray = tokens.semantic.color.type.disabled.value;
  const errorColor = tokens.semantic.color.status.error.text.value;
  const successColor = tokens.semantic.color.status.success.text.value;
  const lineColor = tokens.semantic.color.outline.fixed.value;
  const emphasis = isRefreshed ? 400 : tokens.semantic.fontWeight.emphasis.value;

  const toggle = () => {
    if (!expandable || forcedOpen) return;
    setOpen((prev) => !prev);
  };

  const trailing = (() => {
    if (status === "running") return null;
    if (showCheck) {
      return (
        <CheckedIcon
          aria-hidden
          style={{ width: 16, height: 16, color: isRefreshed ? muted : successColor }}
        />
      );
    }
    if (expandable && !forcedOpen && !isRefreshed) {
      return (
        <Box
          aria-hidden
          sx={{
            display: "flex",
            color: muted,
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 120ms ease",
          }}
        >
          <ExpandDownIcon aria-hidden style={{ width: 16, height: 16 }} />
        </Box>
      );
    }
    return null;
  })();

  return (
    <Box sx={{ width: "100%", minWidth: 0,
      ...(isRefreshed ? { "& .MuiTypography-root": { fontFamily: '"Atlas Refresh Inter", var(--lens-core-font-family-inter), sans-serif', fontSize: "14px", lineHeight: "20px", letterSpacing: 0, overflowWrap: "anywhere" } } : {}),
    }}>
      <Stack
        direction="row"
        alignItems="center"
        role={expandable && !forcedOpen ? "button" : undefined}
        tabIndex={expandable && !forcedOpen ? 0 : undefined}
        aria-expanded={expandable ? isOpen : undefined}
        aria-controls={isOpen ? detailsId : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
        }}
        onClick={toggle}
        sx={{
          gap: isRefreshed ? "8px" : `${spacing[1].value}`,
          minHeight: isRefreshed ? "20px" : undefined,
          "&:focus-visible": { outline: "2px solid #1c4ee4", outlineOffset: "3px", borderRadius: "4px" },
          "&:hover .MuiTypography-root": isRefreshed && expandable ? { color: "#575a67" } : {},
          cursor: expandable && !forcedOpen ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isRefreshed ? 16 : 20,
            height: isRefreshed ? 16 : 20,
            color: muted,
            // Optical nudge: shift all icons 1px right; the gray glyphs render a
            // touch low in their box, so lift them 1px more than the branded mark.
            transform: isRefreshed ? "none" : isBranded
              ? "translate(1px, -1.5px)"
              : "translate(1px, -2.5px)",
          }}
        >
          <Icon aria-hidden style={{ width: isRefreshed ? 16 : 20, height: isRefreshed ? 16 : 20 }} />
        </Box>

        {status === "failed" ? (
          <Stack
            direction="row"
            alignItems="center"
            sx={{ gap: `${spacing["0_25"].value}`, color: errorColor, minWidth: 0 }}
          >
            <Typography
              variant="textMd"
              component="span"
              sx={{ fontWeight: emphasis, color: errorColor }}
            >
              Failed:
            </Typography>
            <Typography
              variant="textMd"
              component="span"
              sx={{ fontWeight: emphasis, color: errorColor }}
            >
              {toolName}
            </Typography>
          </Stack>
        ) : status === "running" ? (
          <Typography
            variant="textMd"
            component="span"
            sx={{
              fontWeight: emphasis,
              backgroundImage: isRefreshed ? "linear-gradient(90deg, #6e7182 0%, #888b9a 14.781%, #dee0e9 34.161%, #888b9a 52.228%, #6e7182 68.323%)" : `linear-gradient(90deg, ${muted} 0%, ${muted} 35%, ${lighterGray} 50%, ${muted} 65%, ${muted} 100%)`,
              backgroundSize: "200% 100%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              animation: "atlasToolCallShimmer 1.6s linear infinite",
              "@keyframes atlasToolCallShimmer": {
                "0%": { backgroundPosition: "200% 0" },
                "100%": { backgroundPosition: "0% 0" },
              },
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
                color: muted,
                WebkitTextFillColor: muted,
              },
            }}
          >
            {toolName}
          </Typography>
        ) : (
          <Typography
            variant="textMd"
            component="span"
            sx={{ fontWeight: emphasis, color: muted }}
          >
            {isRefreshed && download ? (
              <>
                Create file{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={(event) => { event.stopPropagation(); downloadTextFile(download.filename, download.html); }}
                  onKeyDown={(event) => event.stopPropagation()}
                  sx={{ font: "inherit", verticalAlign: "baseline", color: "#1c4ee4", textAlign: "left" }}
                  underline="hover"
                >
                  {download.filename}
                </Link>
              </>
            ) : toolName}
          </Typography>
        )}

        {trailing}
      </Stack>

      {isOpen ? (
        <Stack
          id={detailsId}
          sx={
            isRefreshed && !showAuth
              ? {
                  // Figma DetailsContainer: unboxed content with a 2px inset.
                  mt: "12px",
                  pl: "2px",
                  py: "8px",
                  gap: `${spacing["0_5"].value}`,
                  width: "100%",
                  boxSizing: "border-box",
                }
              : {
                  mt: `${spacing[1].value}`,
                  border: `1px solid ${lineColor}`,
                  borderRadius: tokens.semantic.radius.md.value,
                  bgcolor: tokens.semantic.color.surface.default.value,
                  p: `${spacing["1_5"].value}`,
                  gap: `${spacing[2].value}`,
                  width: "100%",
                  boxSizing: "border-box",
                }
          }
        >
          {children}

          {showAuth ? (
            <Stack direction="row" sx={{ gap: `${spacing[1].value}` }}>
              {onDeny ? (
                <Button variant="outlined" size="xsmall" onClick={onDeny}>
                  Deny
                </Button>
              ) : null}
              {onApprove ? (
                <Button variant="contained" size="xsmall" onClick={onApprove}>
                  Approve
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

export type ToolGroupProps = {
  /** Number of tool calls in the group (for the summary label). */
  count: number;
  activityLabel?: string;
  completeLabel?: string;
  awaitingApproval?: boolean;
  /**
   * True while any tool is still running or paused for approval. The group
   * force-expands while active.
   */
  active: boolean;
  /**
   * When the group is settled, whether it should default to collapsed. True
   * once every tool succeeded; a group with a failure stays expanded.
   */
  autoCollapse?: boolean;
  /** The `ToolCall` rows. */
  children: ReactNode;
};

/**
 * Groups a sequence of tool calls under a single summary header, matching the
 * Figma "Tool Group" component (PUW-436). While active (running/paused) the
 * group is expanded with a single left border line and an animated spinner;
 * once every tool succeeds it collapses with an easing animation to a clickable
 * summary row. All spacing/colors come from Atlas tokens.
 */
export function ToolGroup({
  count,
  activityLabel,
  completeLabel,
  awaitingApproval = false,
  active,
  autoCollapse = true,
  children,
}: ToolGroupProps) {
  const { tokens } = useTheme();
  const isRefreshed = useThemeVariantStore((s) => s.variant === "refreshed");
  const spacing = tokens.core.spacing;
  const muted = isRefreshed ? "#6e7182" : tokens.semantic.color.type.muted.value;
  const lineColor = tokens.semantic.color.outline.fixed.value;
  const emphasis = isRefreshed ? 400 : tokens.semantic.fontWeight.emphasis.value;

  // null = follow the default. Settled all-success groups default to collapsed;
  // groups with a failure stay open. A user toggle overrides the default.
  const contentId = useId();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const expanded = active ? true : (userOpen ?? !autoCollapse);

  const label = isRefreshed
    ? active ? (awaitingApproval ? "Waiting for approval" : activityLabel ?? "Running commands")
      : completeLabel ?? `${count} tool call${count === 1 ? "" : "s"} completed`
    : `${count} tool call${count === 1 ? "" : "s"}`;

  const toggle = () => {
    if (active) return;
    setUserOpen((prev) => !(prev ?? !autoCollapse));
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0,
      ...(isRefreshed ? { "& .MuiTypography-root": { fontFamily: '"Atlas Refresh Inter", var(--lens-core-font-family-inter), sans-serif', fontSize: "14px", lineHeight: "20px", letterSpacing: 0, overflowWrap: "anywhere" } } : {}),
    }}>
      <Stack
        direction="row"
        alignItems="center"
        role={active ? "status" : "button"}
        tabIndex={active ? undefined : 0}
        aria-expanded={expanded}
        aria-controls={contentId}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
        }}
        onClick={toggle}
        sx={{
          gap: `${spacing[1].value}`,
          "&:focus-visible": { outline: "2px solid #1c4ee4", outlineOffset: "3px", borderRadius: "4px" },
          "&:hover .MuiTypography-root": !active && isRefreshed ? { color: "#575a67" } : {},
          cursor: active ? "default" : "pointer",
          userSelect: "none",
        }}
      >
        <Typography
          variant="textMd"
          component="span"
          sx={{ fontWeight: emphasis, color: muted }}
        >
          {label}
        </Typography>

        {active ? (
          isRefreshed ? null : (
            <CircularProgress
              size={12}
              thickness={5}
              aria-label="Running tools"
              sx={{ color: muted }}
            />
          )
        ) : (
          <Box
            aria-hidden
            sx={{
              display: "flex",
              color: muted,
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 120ms ease",
            }}
          >
            <ExpandDownIcon aria-hidden style={{ width: 16, height: 16 }} />
          </Box>
        )}
      </Stack>

      <Collapse
        id={contentId}
        in={expanded}
        timeout={reducedMotion ? 0 : 320}
        easing={{
          enter: "cubic-bezier(0.4, 0, 0.2, 1)",
          exit: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Box sx={{ pt: isRefreshed ? "8px" : `${spacing[2].value}` }}>
          <Box
            sx={{
              borderLeft: isRefreshed ? "none" : `1px solid ${lineColor}`,
              pl: isRefreshed ? 0 : `${spacing[2].value}`,
              display: "flex",
              flexDirection: "column",
              gap: isRefreshed ? "8px" : `${spacing["1_5"].value}`,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {children}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
