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
      label: "Item 1.05 compliance date",
      date: "2026-12-18",
      description:
        "From this date, large accelerated filers must report a material cyber-attack within four business days of deciding it's material.",
    },
    {
      label: "Fiscal 2026 10-K due",
      date: "2027-03-01",
      description: "The annual report must describe the updated incident disclosure process.",
    },
  ],
  reasonsRelevant: [
    "Incident Response Plan §4.2 still says five business days, not four",
    "You file 8-Ks with the SEC",
    "Nobody is named to sign an 8-K cyber filing — that needs settling before an attack",
  ],
  taskTemplates: [
    {
      id: "irp",
      description: "Update Incident Response Plan §4.2 to four business days",
      ownerEmail: "pete.lin@acme.com",
      due: "2026-11-03",
    },
    {
      id: "signoff",
      description: "Confirm who signs an 8-K cyber filing",
      ownerEmail: "pete.lin@acme.com",
      due: "2026-10-30",
    },
    {
      id: "preread",
      description: "Add the updated plan to the Audit Committee pre-read",
      ownerEmail: "alex.kim@acme.com",
      due: "2026-11-13",
    },
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
      {
        label: "Online cancellation required",
        date: "2027-02-15",
        description: "Customers who sign up online must be able to cancel online.",
      },
      { label: "Rule takes effect", date: "2027-03-01" },
    ],
    reasonsRelevant: [
      "Your software products are sold on auto-renewing plans",
      "Customer terms §7 describes a phone-only cancellation path",
    ],
    taskTemplates: [
      {
        id: "gap",
        description: "Compare the rule against our policies and list the gaps",
        ownerEmail: "sam.ortiz@acme.com",
        due: "2027-01-15",
      },
      {
        id: "flow",
        description: "Build the online cancellation flow",
        ownerEmail: "chris.okafor@acme.com",
        due: "2027-02-10",
      },
      {
        id: "terms",
        description: "Update customer terms §7",
        ownerEmail: "jordan.lee@acme.com",
        due: "2027-02-12",
      },
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
    taskTemplates: [
      {
        id: "review",
        description: "Review automated screening tools with HR",
        ownerEmail: "priya.natarajan@acme.com",
        due: "2026-11-10",
      },
      {
        id: "comment",
        description: "Draft our public comment",
        ownerEmail: "jordan.lee@acme.com",
        due: "2026-11-17",
      },
      {
        id: "notice",
        description: "Update the privacy notice for automated decisions",
        ownerEmail: "jordan.lee@acme.com",
        due: "2026-12-15",
      },
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
    taskTemplates: [
      {
        id: "inventory",
        description: "Build the AI model inventory",
        ownerEmail: "chris.okafor@acme.com",
        due: "2027-01-25",
      },
      {
        id: "owner",
        description: "Name an owner for model documentation",
        ownerEmail: "maya.chen@acme.com",
        due: "2027-03-01",
      },
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
    deadlines: [{ label: "Updated procedures in effect", date: "2027-01-15" }],
    reasonsRelevant: [
      "Your broker-dealer subsidiary has registered staff working remotely",
    ],
    taskTemplates: [
      {
        id: "wsp",
        description: "Update written supervisory procedures",
        ownerEmail: "sam.ortiz@acme.com",
        due: "2027-01-08",
      },
    ],
  },
];
