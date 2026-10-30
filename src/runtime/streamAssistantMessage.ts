import { makeMessageId } from "@/chat/chatMessageUtils";
import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import type {
  ChatPart,
  ChatStreamChunk,
  ChatToolPart,
} from "@/chat/chatTypes";

/**
 * Consumes an adapter stream and folds the chunks into a single assistant
 * message's parts (reasoning, tool calls, text), updating the message in the
 * store as each chunk arrives. Tool chunks are folded by `id`, so a tool can
 * transition through running -> success/failed/paused in place.
 */
export async function streamAssistantMessage(
  chatId: string,
  assistantId: string,
  stream: AsyncGenerator<ChatStreamChunk>,
  _signal: AbortSignal,
): Promise<void> {
  const store = useChatMessagesStore.getState();

  // Parts are kept in arrival order so reasoning, tool groups, and text render
  // in the real agent sequence (e.g. reason -> tool fails -> re-reason -> next
  // tool). Consecutive reasoning/text deltas fold into the trailing part of the
  // same type; a new run starts whenever the part type changes.
  const parts: ChatPart[] = [];

  const appendDelta = (type: "reasoning" | "text", delta: string) => {
    const last = parts[parts.length - 1];
    if (
      last &&
      (last.type === "reasoning" || last.type === "text") &&
      last.type === type
    ) {
      last.text += delta;
      return;
    }
    parts.push(
      type === "reasoning"
        ? { type: "reasoning", text: delta }
        : { type: "text", text: delta },
    );
  };

  const upsertTool = (id: string, patch: Partial<ChatToolPart>) => {
    const tool = parts.find(
      (part): part is ChatToolPart => part.type === "tool" && part.id === id,
    );
    if (tool) Object.assign(tool, patch);
  };

  // Fresh references on every flush so the store change triggers a re-render.
  const flush = () => {
    store.updateMessage(chatId, assistantId, (message) => ({
      ...message,
      parts: parts.map((part) => ({ ...part })),
    }));
  };

  try {
    for await (const chunk of stream) {
      switch (chunk.type) {
        case "reasoning-summary": {
          const last = parts[parts.length - 1];
          if (last?.type === "reasoning") last.summary = chunk.summary;
          else parts.push({ type: "reasoning", text: "", summary: chunk.summary });
          flush();
          break;
        }
        case "reasoning-delta":
          appendDelta("reasoning", chunk.delta);
          flush();
          break;
        case "tool":
          parts.push({
            type: "tool",
            id: makeMessageId(),
            toolName: chunk.toolName,
            toolKind: "generic",
            status: "success",
            input: chunk.input,
            output: chunk.output,
          });
          flush();
          break;
        case "tool-start":
          parts.push({
            type: "tool",
            id: chunk.id,
            toolName: chunk.toolName,
            toolKind: chunk.toolKind,
            status: "running",
            requiresAuthorization: chunk.requiresAuthorization,
            detail: chunk.detail,
          });
          flush();
          break;
        case "tool-update":
          upsertTool(chunk.id, {
            status: chunk.status,
            ...(chunk.detail !== undefined ? { detail: chunk.detail } : {}),
            ...(chunk.output !== undefined ? { output: chunk.output } : {}),
            ...(chunk.download !== undefined
              ? { download: chunk.download }
              : {}),
          });
          flush();
          break;
        case "text-delta":
          appendDelta("text", chunk.delta);
          flush();
          break;
        case "regulatory-change-list":
          parts.push({ type: "regulatory-change-list", items: chunk.items });
          flush();
          break;
        case "source":
        case "finish":
        case "abort":
          break;
      }
    }
  } finally {
    store.updateMessage(chatId, assistantId, (message) => ({
      ...message,
      parts: parts.map((part) => ({ ...part })),
      status: "done",
    }));
  }
}
