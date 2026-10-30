import type { RegulatoryChange } from "@/regulatory/regulatoryChange";

/**
 * Our own chat model + streaming chunk types. These replace the
 * `@mui/x-chat-headless` types so the chat experience is driven entirely by our
 * runtime + store + mock adapter and rendered with native Atlas AI components.
 */

export type ChatRole = "user" | "assistant" | "system";

export type ChatTextPart = {
  type: "text";
  text: string;
};

export type ChatReasoningPart = {
  type: "reasoning";
  text: string;
  /** Curated activity summary intended for display, separate from reasoning text. */
  summary?: string;
};

/** Lifecycle of a single tool call, mirrors the Figma ToolCall component. */
export type ToolCallStatus = "running" | "success" | "failed" | "paused";

/**
 * Which icon a tool call renders. Maps to a concrete Atlas icon in the
 * `ToolCall` component's icon table.
 */
export type ToolIconKind =
  | "entities_jurisdictions"
  | "web_search"
  | "web_fetch"
  | "arca"
  | "entities_person"
  | "fill_document"
  | "present_document"
  | "generic";

/** Optional payload that lets a tool render a downloadable artifact. */
export type ToolDownload = {
  filename: string;
  /** HTML content of the generated document. */
  html: string;
  /** Human label for the download control. */
  label?: string;
};

export type ChatToolPart = {
  type: "tool";
  id: string;
  /** Display label shown in the tool-call header. */
  toolName: string;
  toolKind: ToolIconKind;
  status: ToolCallStatus;
  /** When true, the tool is awaiting a Deny/Approve decision. */
  requiresAuthorization?: boolean;
  /** Slot text shown in the expanded details area. */
  detail?: string;
  input?: unknown;
  output?: unknown;
  /** When present, the tool renders a download control in its slot. */
  download?: ToolDownload;
};

export type ChatSourcePart = {
  type: "source";
  sourceId: string;
  url: string;
  title: string;
};

export type ChatRegulatoryChangeListPart = {
  type: "regulatory-change-list";
  items: RegulatoryChange[];
};

export type ChatPart =
  | ChatTextPart
  | ChatReasoningPart
  | ChatToolPart
  | ChatSourcePart
  | ChatRegulatoryChangeListPart;

export type ChatMessageStatus = "streaming" | "done";

export type ChatMessage = {
  id: string;
  conversationId?: string;
  role: ChatRole;
  parts: ChatPart[];
  status: ChatMessageStatus;
  createdAt: string;
};

/**
 * Chunks emitted by the mock adapter stream and folded into an assistant
 * message's parts by the runtime.
 */
export type ChatStreamChunk =
  | { type: "reasoning-delta"; delta: string }
  | { type: "reasoning-summary"; summary: string }
  // Legacy one-shot tool chunk (treated as start + success).
  | { type: "tool"; toolName: string; input?: unknown; output?: unknown }
  | {
      type: "tool-start";
      id: string;
      toolName: string;
      toolKind: ToolIconKind;
      requiresAuthorization?: boolean;
      detail?: string;
    }
  | {
      type: "tool-update";
      id: string;
      status: ToolCallStatus;
      detail?: string;
      output?: unknown;
      download?: ToolDownload;
    }
  | { type: "source"; sourceId: string; url: string; title: string }
  | { type: "text-delta"; delta: string }
  | { type: "regulatory-change-list"; items: RegulatoryChange[] }
  | { type: "finish" }
  | { type: "abort" };
