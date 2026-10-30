import { CYBER_RULE_CHANGE } from "@/regulatory/regulatoryChanges";

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
};

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: CYBER_RULE_CHANGE.id,
    source: "SEC rule change",
    receivedAt: "Today 6:35 am",
    badge: "New",
    title: CYBER_RULE_CHANGE.title,
    summary: CYBER_RULE_CHANGE.summary,
    relatedPolicy: "Incident Response Plan §4.2: report a cyber-attack in four business days",
  },
];
