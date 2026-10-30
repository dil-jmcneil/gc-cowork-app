/** Communication thread for a task, per the OOUX model: Cowork records, routes and facilitates it. */
export type MessageChannel = "email" | "chat" | "slack" | "teams";

/** Who wrote a message, relative to the task. */
export type MessageAuthorRole = "cowork" | "delegator" | "delegate" | "cc";

export type TaskMessage = {
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
