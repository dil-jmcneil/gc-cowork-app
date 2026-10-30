import { CYBER_RULE_CHANGE } from "@/regulatory/regulatoryChanges";

export type AttentionItem = {
  id: string;
  tag: string;
  badge: string;
  title: string;
  summary: string;
  meta: string;
  relatedPolicy: string;
};

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: CYBER_RULE_CHANGE.id,
    tag: "SEC rule change",
    badge: "New",
    title: CYBER_RULE_CHANGE.title,
    summary: CYBER_RULE_CHANGE.summary,
    meta: "Final rule. Applies from this filing season. Cowork found it today at 6:35 AM.",
    relatedPolicy: "Incident Response Plan §4.2: report a cyber-attack in four business days",
  },
];
