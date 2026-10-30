import type { RegulatoryChange } from "./regulatoryChange";

/** Illustrative mock data, not legal advice and not necessarily current. */
export const CYBER_RULE_CHANGE: RegulatoryChange = {
  id: "sec-cyber-8k-105",
  title: "New cyber-attack reporting rule",
  summary:
    "The SEC tightened its cyber rule. A company must now report a material cyber-attack on Form 8-K, under Item 1.05, within four business days after it decides that the attack is material.",
  regulatoryBody: "SEC",
  effectiveDate: "2026-12-18",
  status: "New",
  deadlines: [
    {
      label: "Update Incident Response Plan §4.2 to a four-business-day window",
      date: "2026-10-30",
      description:
        "Section 4.2 still says five business days. Bring it in line with the rule before the next filing.",
    },
    {
      label: "File Form 8-K, Item 1.05",
      date: "2026-11-06",
      description:
        "Report a material cyber-attack within four business days of deciding it's material.",
    },
  ],
  reasonsRelevant: [
    "Incident Response Plan §4.2 sets the same four-business-day window",
    "You file 8-Ks with the SEC",
    "Nobody is named to sign an 8-K cyber filing — that needs settling before an attack",
  ],
};

export const REGULATORY_CHANGES: RegulatoryChange[] = [
  CYBER_RULE_CHANGE,
  {
    id: "ftc-click-to-cancel",
    title: "Easier cancellation for subscriptions",
    summary:
      "The FTC now requires that customers can cancel a subscription as easily as they signed up, with clear consent before any renewal charge.",
    regulatoryBody: "FTC",
    effectiveDate: "2027-03-01",
    status: "Upcoming",
    deadlines: [
      { label: "Update online cancellation flow", date: "2027-02-15" },
      { label: "Rule takes effect", date: "2027-03-01" },
    ],
    reasonsRelevant: [
      "Your software products are sold on auto-renewing plans",
      "Customer terms §7 describes a phone-only cancellation path",
    ],
  },
  {
    id: "cppa-automated-decisions",
    title: "New rules for automated decision-making",
    summary:
      "California's privacy agency proposed rules that require notice, an opt-out, and a risk assessment before using automated tools to make significant decisions about people.",
    regulatoryBody: "California Privacy Protection Agency",
    effectiveDate: "2027-01-01",
    status: "In review",
    deadlines: [{ label: "Public comment closes", date: "2026-11-20" }],
    reasonsRelevant: [
      "HR uses automated screening for job applicants in California",
      "Your privacy notice doesn't cover automated decisions yet",
    ],
  },
  {
    id: "eu-ai-act-gpai",
    title: "AI Act duties for general-purpose AI",
    summary:
      "The EU Commission published guidance on duties for companies that build or deploy general-purpose AI models, including technical documentation and copyright policies.",
    regulatoryBody: "EU Commission",
    effectiveDate: "2027-08-02",
    status: "Upcoming",
    deadlines: [
      { label: "Inventory AI models in use", date: "2027-02-01" },
      { label: "Obligations apply", date: "2027-08-02" },
    ],
    reasonsRelevant: [
      "Your EU subsidiaries deploy AI features in customer products",
      "AI Use Policy §2 doesn't yet assign an owner for model documentation",
    ],
  },
  {
    id: "finra-remote-supervision",
    title: "Updated rules for supervising remote work",
    summary:
      "FINRA updated how firms must inspect and supervise people who work from home, replacing temporary pandemic relief with a permanent framework.",
    regulatoryBody: "FINRA",
    effectiveDate: "2027-01-15",
    status: "In review",
    deadlines: [{ label: "Update written supervisory procedures", date: "2027-01-15" }],
    reasonsRelevant: [
      "Your broker-dealer subsidiary has registered staff working remotely",
    ],
  },
];
