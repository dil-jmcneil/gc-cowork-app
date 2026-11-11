import { createContext, useContext } from "react";

import type { A2uiActionEvent, A2uiDataModel } from "@/chat/a2ui";

/** What interactive message parts can do: send a message, or fire an A2UI surface's action. */
export type ChatActions = {
  /** Send text as the user, as if they'd typed it. */
  send: (text: string) => void;
  /** Record what the surface submitted, and hand its action to the page. */
  submitSurface: (messageId: string, data: A2uiDataModel, event: A2uiActionEvent) => void;
};

export const ChatActionsContext = createContext<ChatActions | null>(null);

export function useChatActions(): ChatActions | null {
  return useContext(ChatActionsContext);
}
