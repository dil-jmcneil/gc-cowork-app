import { signalType } from "@/signals/signal";
import { ATG_RULING } from "@/signals/signals";

export type AttentionItem = {
  id: string;
  /** Where the item came from, shown first in the card's header row. */
  source: string;
  /** When Cowork surfaced it, as shown. */
  receivedAt: string;
  badge: string;
  title: string;
  summary: string;
  relatedPolicy: string;
  /** Why Cowork surfaced it to this user, shown in the title's info tooltip. */
  whySurfaced: string;
};

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: ATG_RULING.id,
    source: signalType(ATG_RULING),
    receivedAt: "Today 6:40 am",
    badge: "New",
    title: ATG_RULING.title,
    summary: ATG_RULING.summary,
    relatedPolicy: "Bylaws Article II, Section 8: advance notice of director nominations",
    whySurfaced:
      "Surfaced because Acme is a Delaware company, your advance notice bylaw predates the ruling, and you own the bylaws.",
  },
];
