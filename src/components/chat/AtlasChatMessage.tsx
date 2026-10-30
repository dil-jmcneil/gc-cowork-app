import {
  AIChatAIMessage,
  AIChatMessageAvatar,
  AIChatMessageFooter,
  AIChatMessageHeader,
  AIChatMessageTextBlock,
  AIChatReasoningBlock,
  AIChatSystemMessage,
  AIChatUserMessage,
} from "@diligentcorp/atlas-react-bundle";
import CopyIcon from "@diligentcorp/atlas-react-bundle/icons/Copy";
import DownloadIcon from "@diligentcorp/atlas-react-bundle/icons/Download";
import ExpandDownIcon from "@diligentcorp/atlas-react-bundle/icons/ExpandDown";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useId, useState } from "react";

import { extractTextFromParts } from "@/chat/chatMessageUtils";
import type {
  ChatMessage,
  ChatPart,
  ChatReasoningPart,
  ChatToolPart,
  ChatRegulatoryChangeListPart,
} from "@/chat/chatTypes";
import { ToolCall, ToolGroup } from "@/components/chat/ToolCall";
import { RegulatoryChangeList } from "@/components/chat/RegulatoryChangeList";
import { chatBodyTypography } from "./chatTypography";
import { BrandSpinner } from "@/components/chat/BrandSpinner";
import { useThemeVariantStore } from "@/demo/themeVariantStore";
import { LOGGED_IN_USER } from "@/user";
import { downloadTextFile } from "@/utils/downloadFile";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function ReasoningBlock({
  reasoning,
  isActive,
}: {
  reasoning: ChatReasoningPart[];
  /** True while this is the still-streaming tail segment of the message. */
  isActive: boolean;
}) {
  const { tokens } = useTheme();
  const variant = useThemeVariantStore((s) => s.variant);

  const text = reasoning
    .map((part) => part.text)
    .join("\n\n")
    .trim();

  if (variant === "refreshed") {
    const summary = reasoning.map((part) => part.summary?.trim()).filter(Boolean).join(" ");
    if (!summary && !isActive) return null;
    return (
      <Stack direction="row" alignItems="flex-start" gap={1} role={isActive ? "status" : undefined} data-brand-activity={isActive ? "working" : undefined}>
        {isActive ? <BrandSpinner size={16} /> : null}
        <Typography variant="body1" sx={(theme) => ({ ...chatBodyTypography(theme), color: "var(--refresh-type-default)" })}>
          {summary || "Working…"}
        </Typography>
      </Stack>
    );
  }

  if (!text) return null;

  // The released AIChatReasoningBlock ships oversized (its label/description
  // render at 16px). Pin both back to the related 14px token (Semantic/Font/
  // Text/Md). The component spreads slotProps `sx` after its own token styles,
  // so a plain object override wins.
  const textMd = tokens.semantic.font.text.md;
  const sizeMd = {
    fontSize: textMd.fontSize.value,
    lineHeight: textMd.lineHeight.value,
    letterSpacing: textMd.letterSpacing.value,
  };

  // The Atlas reasoning block renders the narrative through its `description`
  // slot. It owns the "Reasoning" header and expand toggle, so we don't nest
  // our own accordion inside it.
  return (
    <AIChatReasoningBlock
      label="Reasoning"
      description={text}
      slotProps={{ label: { sx: sizeMd }, description: { sx: sizeMd } }}
    >
      {null}
    </AIChatReasoningBlock>
  );
}

function ToolSlot({ tool }: { tool: ChatToolPart }) {
  const { tokens } = useTheme();

  if (!tool.detail) return null;

  return (
    <Typography
      variant="textMd"
      sx={{ color: tokens.semantic.color.type.muted.value }}
    >
      {tool.detail}
    </Typography>
  );
}

function ToolCallList({ tools }: { tools: ChatToolPart[] }) {
  // The group force-expands while any tool is still running or awaiting an
  // approval gate. Once settled, it only auto-collapses when every call
  // succeeded — a group containing a failure stays open so the error is visible.
  const active = tools.some(
    (tool) => tool.status === "running" || tool.status === "paused",
  );
  const autoCollapse =
    !active && tools.every((tool) => tool.status === "success");

  return (
    <ToolGroup count={tools.length} active={active} autoCollapse={autoCollapse}
      awaitingApproval={tools.some((tool) => tool.status === "paused")}
      activityLabel={tools.find((tool) => tool.status === "running")?.toolName}
      completeLabel={tools.some((tool) => tool.status === "failed") ? "Some tools need attention" : `${tools.length} ${tools.length === 1 ? "task" : "tasks"} completed`}
    >
      {tools.map((tool) => {
        const hasSlot = Boolean(tool.detail);

        return (
          <ToolCall
            key={tool.id}
            toolName={tool.toolName}
            toolKind={tool.toolKind}
            status={tool.status}
            requiresAuthorization={tool.requiresAuthorization}
            defaultExpanded={Boolean(tool.download)}
            download={tool.download}
          >
            {hasSlot ? <ToolSlot tool={tool} /> : undefined}
          </ToolCall>
        );
      })}
    </ToolGroup>
  );
}

type MessageSegment =
  | { kind: "reasoning"; key: string; reasoning: ChatReasoningPart[] }
  | { kind: "tools"; key: string; tools: ChatToolPart[] }
  | { kind: "text"; key: string; text: string }
  | { kind: "regulatory-change-list"; key: string; part: ChatRegulatoryChangeListPart };

/**
 * Collapses the flat parts list into ordered, render-ready segments: runs of
 * consecutive reasoning or tool parts group together, and text parts merge into
 * a single body. Order is preserved so a real agent loop (reason -> tool ->
 * re-reason -> tool) renders as alternating blocks.
 */
function buildSegments(parts: ChatPart[]): MessageSegment[] {
  const segments: MessageSegment[] = [];
  parts.forEach((part, index) => {
    const last = segments[segments.length - 1];
    if (part.type === "reasoning") {
      if (last?.kind === "reasoning") last.reasoning.push(part);
      else
        segments.push({ kind: "reasoning", key: `r-${index}`, reasoning: [part] });
    } else if (part.type === "tool") {
      if (last?.kind === "tools") last.tools.push(part);
      else segments.push({ kind: "tools", key: `t-${index}`, tools: [part] });
    } else if (part.type === "text") {
      if (last?.kind === "text") last.text += part.text;
      else segments.push({ kind: "text", key: `x-${index}`, text: part.text });
    } else if (part.type === "regulatory-change-list") {
      segments.push({ kind: "regulatory-change-list", key: `l-${index}`, part });
    }
  });
  return segments;
}

/**
 * Refreshed-only. Wraps the leading run of reasoning/tool segments (the
 * "work" that happens before the final output) as one collapsible unit:
 *
 *   - While genuinely streaming (`isActiveNow`): renders live, exactly like
 *     the flat per-segment loop below — the tail reasoning/tool gets the
 *     active treatment, same as always.
 *   - Once settled: collapses to a single "Worked for Ns" row (elapsed time
 *     captured the moment work finishes, from the message's own createdAt),
 *     click/Enter to expand back to the same summaries + tool groups —
 *     still no raw reasoning trace, just what was already shown.
 *   - `keepExpanded` overrides the collapse when a tool is paused awaiting
 *     the user's approval: the message is "done" streaming at that point, but the
 *     Approve/Deny controls must stay visible rather than hiding behind a
 *     "Worked for Ns" row the user hasn't chosen to expand.
 */
function WorkGroup({
  segments,
  isActiveNow,
  keepExpanded,
  showWorkingIndicator,
  startedAt,
}: {
  segments: MessageSegment[];
  isActiveNow: boolean;
  keepExpanded: boolean;
  showWorkingIndicator: boolean;
  startedAt: string;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const [finishedAtMs, setFinishedAtMs] = useState<number | null>(null);
  const contentId = useId();

  useEffect(() => {
    if (!isActiveNow && finishedAtMs === null) setFinishedAtMs(Date.now());
  }, [isActiveNow, finishedAtMs]);

  const renderSegments = (active: boolean) => (
    <Stack sx={{ gap: "24px" }}>
      {segments.map((segment, index) => (
        <Box key={segment.key}>
          {segment.kind === "reasoning" ? (
            <ReasoningBlock
              reasoning={segment.reasoning}
              isActive={active && showWorkingIndicator && index === segments.length - 1}
            />
          ) : segment.kind === "tools" ? (
            <ToolCallList tools={segment.tools} />
          ) : null}
        </Box>
      ))}
    </Stack>
  );

  if (keepExpanded) {
    return renderSegments(isActiveNow);
  }

  const elapsedSeconds =
    finishedAtMs !== null
      ? Math.max(1, Math.round((finishedAtMs - new Date(startedAt).getTime()) / 1000))
      : null;
  const expanded = userOpen ?? false;
  const toggle = () => setUserOpen((prev) => !(prev ?? false));

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap="4px"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={contentId}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        onClick={toggle}
        sx={{
          cursor: "pointer",
          userSelect: "none",
          "&:hover .MuiTypography-root": { color: "#575a67" },
        }}
      >
        <Typography
          variant="body1"
          sx={(theme) => ({ ...chatBodyTypography(theme), color: "var(--refresh-type-muted)" })}
        >
          {elapsedSeconds !== null ? `Worked for ${elapsedSeconds}s` : "Worked"}
        </Typography>
        <Box
          aria-hidden
          sx={{
            display: "flex",
            color: "var(--refresh-type-muted)",
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 120ms ease",
          }}
        >
          <ExpandDownIcon aria-hidden style={{ width: 16, height: 16 }} />
        </Box>
      </Stack>
      <Collapse id={contentId} in={expanded} timeout={reducedMotion ? 0 : 320}>
        <Box sx={{ mt: "12px" }}>{renderSegments(false)}</Box>
      </Collapse>
    </Box>
  );
}

function MessageTextSegment({ text }: { text: string }) {
  if (!text) return null;

  return (
    <Box
      sx={(theme) => ({
        // Body everywhere; emphasis changes weight, not size or font family.
        ...chatBodyTypography(theme),
        "& p, & ul, & ol, & li, & a, & .MuiTypography-root": chatBodyTypography(theme),
        "& strong, & b, & h1, & h2, & h3, & h4, & h5, & h6": {
          ...chatBodyTypography(theme),
          fontWeight: theme.tokens.semantic.fontWeight.emphasis.value,
        },
      })}
    >
      <AIChatMessageTextBlock>{text}</AIChatMessageTextBlock>
    </Box>
  );
}

function CopyMessageAction({ text }: { text: string }) {
  const { tokens } = useTheme();

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore clipboard failures in prototype */
    }
  };

  return (
    <Tooltip title="Copy">
      <IconButton
        size="small"
        aria-label="Copy message"
        onClick={() => void handleCopy()}
        sx={{ color: tokens.semantic.color.type.muted.value }}
      >
        <CopyIcon aria-hidden style={{ width: 16, height: 16 }} />
      </IconButton>
    </Tooltip>
  );
}

export function AtlasChatMessage({
  message,
  showWorkingIndicator = false,
}: {
  message: ChatMessage;
  /** The conversation owns which single Working/Thinking block gets the mark. */
  showWorkingIndicator?: boolean;
}) {
  const time = formatTime(message.createdAt);
  const variant = useThemeVariantStore((s) => s.variant);

  if (message.role === "user") {
    const name = LOGGED_IN_USER.fullName;
    const text = extractTextFromParts(message.parts);

    if (variant === "refreshed") {
      // No name/avatar/timestamp by default; hover reveals the timestamp and
      // a copy action, and the bubble tints slightly deeper.
      return (
        <Box
          sx={{
            "&:hover .refreshed-user-message-meta, &:focus-within .refreshed-user-message-meta": { opacity: 1 },
            "&:hover .AtlasAIChatUserMessage > .MuiStack-root, &:focus-within .AtlasAIChatUserMessage > .MuiStack-root": {
              backgroundColor: "var(--refresh-bubble-hover)", borderColor: "var(--refresh-bubble-border-hover)",
              color: "#1a1a1e",
            },
            "@media (hover: none)": { "& .refreshed-user-message-meta": { opacity: 1 } },
          }}
        >
          <AIChatUserMessage alignment="end" message={text} header={null} slotProps={{ root: { sx: (theme) => ({
            "& > .MuiStack-root": {
              bgcolor: "var(--refresh-bubble)", border: "1px solid var(--refresh-bubble-border)",
              borderRadius: "8px", px: "20px", py: "12px", maxWidth: "min(600px, 100%)",
              boxShadow: "none", color: "var(--refresh-type-default)",
              "& .MuiTypography-root": { ...chatBodyTypography(theme), color: "inherit", overflowWrap: "anywhere" },
            },
          }) } }} />
          <Stack className="refreshed-user-message-meta" direction="row" justifyContent="flex-end"
            alignItems="center" gap={1} sx={{ opacity: 0, transition: "opacity 120ms ease", mt: "8px", minHeight: "24px", "& button": { width: "24px", height: "24px", padding: "4px" } }}>
            <Typography variant="body1" sx={(theme) => ({ ...chatBodyTypography(theme), color: "var(--refresh-type-muted)" })}>
              {time}
            </Typography>
            <CopyMessageAction text={text} />
          </Stack>
        </Box>
      );
    }

    return (
      <AIChatUserMessage
        alignment="end"
        message={text}
        header={
          <AIChatMessageHeader
            name={name}
            time={time}
            avatar={
              <AIChatMessageAvatar
                uniqueId="local-user"
                initials={getInitials(name)}
              />
            }
          />
        }
      />
    );
  }

  if (message.role === "system") {
    return (
      <AIChatSystemMessage description={extractTextFromParts(message.parts)} />
    );
  }

  const segments = buildSegments(message.parts);
  const text = extractTextFromParts(message.parts);
  const download = message.parts.find(
    (part): part is ChatToolPart => part.type === "tool" && Boolean(part.download),
  )?.download;
  const isStreaming = message.status === "streaming";

  // The leading run of reasoning/tool segments — everything before the first
  // text or regulatory-change-list segment — is the "work" `WorkGroup` collapses.
  // `workEndIndex === segments.length` means the final output hasn't started
  // yet (there's no non-work segment at all), which is also how we tell
  // "still working" from "done working, now writing the answer".
  const workEndIndex = (() => {
    const idx = segments.findIndex(
      (segment) => segment.kind === "text" || segment.kind === "regulatory-change-list",
    );
    return idx === -1 ? segments.length : idx;
  })();
  const workSegments = segments.slice(0, workEndIndex);
  const hasPendingApproval = workSegments.some(
    (segment) =>
      segment.kind === "tools" &&
      segment.tools.some((tool) => tool.status === "paused"),
  );
  const isWorkActiveNow =
    isStreaming && workEndIndex === segments.length && workSegments.length > 0;
  const keepWorkExpanded = isWorkActiveNow || hasPendingApproval;

  return (
    <AIChatAIMessage
      header={variant === "refreshed" ? null : (
        <AIChatMessageHeader
          name="Assistant"
          time={time}
          avatar={<AIChatMessageAvatar uniqueId="assistant" initials="AI" />}
        />
      )}
      footer={
        !isStreaming && text ? (
          variant === "refreshed" ? <Stack alignItems="flex-end"><CopyMessageAction text={text} /></Stack> :
          <AIChatMessageFooter trailingActions={<CopyMessageAction text={text} />} />
        ) : undefined
      }
    >
      {segments.map((segment, index) => {
        // Refreshed collapses the leading reasoning/tool run into one
        // WorkGroup, rendered once at the first work segment's position;
        // the rest of that run is already inside it, so skip re-rendering.
        if (variant === "refreshed" && index < workEndIndex) {
          if (index !== 0) return null;
          return (
            <Box key="work-group">
              <WorkGroup
                segments={workSegments}
                isActiveNow={isWorkActiveNow}
                keepExpanded={keepWorkExpanded}
                showWorkingIndicator={showWorkingIndicator}
                startedAt={message.createdAt}
              />
            </Box>
          );
        }
        return (
          <Box
            key={segment.key}
            sx={(theme) => ({
              // Uniform 24px between every reasoning/tool/text segment.
              mt: index > 0 ? `${theme.tokens.core.spacing[3].value}` : 0,
            })}
          >
            {segment.kind === "reasoning" ? (
              <ReasoningBlock
                reasoning={segment.reasoning}
                isActive={showWorkingIndicator && isStreaming && index === segments.length - 1}
              />
            ) : segment.kind === "tools" ? (
              <ToolCallList tools={segment.tools} />
            ) : segment.kind === "regulatory-change-list" ? (
              <RegulatoryChangeList items={segment.part.items} />
            ) : (
              <MessageTextSegment text={segment.text} />
            )}
          </Box>
        );
      })}
      {download ? (
        <Box sx={(theme) => ({ mt: `${theme.tokens.core.spacing[2].value}` })}>
          <Button
            variant="outlined"
            size="xsmall"
            startIcon={<DownloadIcon aria-hidden />}
            onClick={() => downloadTextFile(download.filename, download.html)}
          >
            {download.label ?? "Download"}
          </Button>
        </Box>
      ) : null}
    </AIChatAIMessage>
  );
}
