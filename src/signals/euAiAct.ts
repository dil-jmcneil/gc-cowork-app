import type { Signal } from "./signal";

/**
 * The EU AI Act marking rule, from the discovery draft for Coursera
 * (gc-cowork-discovery/email-writing/evals/coursera), refit for Acme: its
 * software has an AI assistant that writes text and makes images for
 * customers. The workstream is already under way when the app loads
 * (`src/workstreams/euAiActWorkstream.ts`). Illustrative, not legal advice.
 */
export const EU_AI_ACT: Signal = {
  id: "eu-ai-act-marking",
  title: "EU rule on marking AI-generated content",
  summary:
    "The EU AI Act requires companies that provide AI tools that create text, images, audio or video to mark that content as AI-generated in a way software can detect. Tools launched before August 2026 have until Dec 2, 2026.",
  source: "European Union",
  citation: "Regulation (EU) 2024/1689, Article 50(2), as amended by Regulation (EU) 2026/1744",
  tags: [
    { kind: "type", label: "Regulatory change" },
    { kind: "jurisdiction", label: "European Union" },
    { kind: "topic", label: "AI-generated content" },
  ],
  issuedDate: "2026-07-27",
  status: "In progress",
  deadlines: [
    {
      label: "AI marking deadline",
      date: "2026-12-02",
      description: "AI tools launched before Aug 2, 2026 must mark what they generate by this date.",
    },
  ],
  reasonsRelevant: [
    "Acme's software has an AI assistant that writes text and makes images for customers, including in the EU",
    "If a vendor provides the assistant, the marking is the vendor's job, though Acme may still need to tell customers",
  ],
  plan: {
    brief: {
      headline: "A new EU rule makes Acme mark its AI assistant's output by Dec 2.",
      support: [
        "Acme's assistant writes text and makes images for EU customers.",
        "Cowork suggests confirming who provides the assistant, then adding the marking and checking it works.",
      ],
    },
    approach:
      "Confirm who provides the AI assistant, then add the marking and check that software can detect it before Dec 2. Cowork tracks each task with its owner.",
    tasks: [
      {
        id: "provider",
        description: "Confirm who built the AI assistant",
        doneWhen: "Peter confirms whether Acme or a vendor is the provider under the AI Act, with the reason on record.",
        ownerEmail: "chris.okafor@acme.com",
        ccEmails: ["pete.lin@acme.com"],
        due: "2026-11-24",
      },
      {
        id: "marking",
        description: "Add AI marking to the assistant's text and images",
        doneWhen: "Everything the assistant generates for EU customers carries a machine-readable AI marking.",
        ownerEmail: "chris.okafor@acme.com",
        ccEmails: ["pete.lin@acme.com"],
        due: "2026-12-01",
        waitingOn: "provider",
      },
      {
        id: "detect",
        description: "Check the marking can be detected",
        doneWhen: "A detection test passes on sample text and images, and Peter confirms the result.",
        ownerEmail: "sam.ortiz@acme.com",
        ccEmails: ["chris.okafor@acme.com"],
        due: "2026-12-02",
        waitingOn: "marking",
      },
    ],
    rules: [],
  },
};
