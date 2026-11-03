/**
 * A task's history, per the OOUX model: every message Cowork records and
 * routes, every action Cowork or the GC takes, and every file added.
 */
export type MessageChannel = "email" | "chat" | "slack" | "teams";

/** Who wrote a message, relative to the task. */
export type MessageAuthorRole = "cowork" | "delegator" | "delegate" | "cc";

export type TaskMessage = {
  kind: "message";
  id: string;
  channel: MessageChannel;
  authorRole: MessageAuthorRole;
  authorName: string;
  /** Recipients by name, for emails. */
  to?: string[];
  subject?: string;
  body: string;
  /** ISO date-time. */
  sentAt: string;
  attachments?: string[];
};

/** Something Cowork or the GC did that isn't a message, e.g. holding follow-ups or changing a status. */
export type HistoryAction = {
  kind: "action";
  id: string;
  /** "Cowork", or the GC's name. */
  actor: string;
  summary: string;
  detail?: string;
  /** The plan rule Cowork applied, in the rule's own words. */
  rule?: string;
  sentAt: string;
};

/** A file or artifact added to the task, by an owner or by Cowork. */
export type HistoryFile = {
  kind: "file";
  id: string;
  name: string;
  addedBy: string;
  /** Where it came from, e.g. "Attached to Dana's email". */
  note?: string;
  sentAt: string;
};

export type HistoryEntry = TaskMessage | HistoryAction | HistoryFile;

export type HistoryKind = HistoryEntry["kind"];

export const isMessage = (entry: HistoryEntry): entry is TaskMessage => entry.kind === "message";

export const CHANNEL_LABEL: Record<MessageChannel, string> = {
  email: "Email",
  chat: "Chat",
  slack: "Slack",
  teams: "Teams",
};

let counter = 0;
export function makeMessageId(): string {
  counter += 1;
  return `msg-${Date.now().toString(36)}-${counter}`;
}
