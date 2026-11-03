import type { Signal } from "./signal";

/**
 * The prototype's primary use case, from the ATG v. Lane discovery brief.
 * The ruling is real; Acme's bylaw findings are modeled on gaps the brief
 * found in public Delaware bylaws. Points for counsel, not legal advice.
 */
export const ATG_RULING: Signal = {
  id: "atg-v-lane",
  title: "Delaware ruling on advance notice bylaws",
  summary:
    "In ATG v. Lane, the Court of Chancery held that a board can enforce only what its advance notice bylaw states: it \"cannot … enforce a requirement that a bylaw does not contain.\" Acme's Article II, Section 8 hasn't changed since 2008, and the 2027 nomination window opens Jan 8.",
  source: "Delaware Court of Chancery",
  sourceUrl: "https://www.courts.delaware.gov/opinions/download.aspx?id=400580",
  citation: "ATG Capital Opportunities Fund LP v. Lane, C.A. No. 2026-0447-LWW",
  history: "Affirmed by the Delaware Supreme Court on Oct 8, 2026",
  tags: [
    { kind: "type", label: "Court ruling" },
    { kind: "jurisdiction", label: "Delaware" },
    { kind: "topic", label: "Advance notice bylaws" },
  ],
  issuedDate: "2026-08-28",
  status: "New",
  deadlines: [
    {
      label: "2027 nomination window opens",
      date: "2027-01-08",
      description:
        "Stockholders can start sending director nominations. The board should adopt any bylaw change before then.",
    },
    {
      label: "2027 nomination window closes",
      date: "2027-02-06",
      description: "A Saturday, and the bylaw has no weekend rule.",
    },
  ],
  reasonsRelevant: [
    "Section 8(c)(i) points to clause (C)(5) for the solicitation statement, but that text is in (C)(3)",
    "Only a nominee can be asked for more information. The court said Empery's board could have asked the stockholder directly (slip op. 37)",
    "Section 8 predates the universal proxy rule and has no Rule 14a-19 text",
    "The nomination section asks about agreements with the nominee only. Agreements with any other person are asked about for other business, not nominations (slip op. 22)",
  ],
  plan: {
    approach:
      "Close the gaps in Article II, Section 8 before the nomination window opens on Jan 8. Counsel drafts the text, the board adopts it in December, and Cowork confirms the 8-K and the website, then watches the window.",
    milestones: [
      {
        id: "assess",
        title: "Get counsel's view",
        startsWhen: "Cowork has compared Article II, Section 8 with the ruling and listed the points for counsel.",
        doneWhen: "Counsel's memo and draft text are with you, or you've recorded that no change is needed.",
        approver: "Peter approves the draft text",
        rules: [
          {
            id: "memo",
            when: "Counsel has the points for counsel, but the memo hasn't arrived.",
            actions:
              "Send counsel the points with their slip opinion pages. Ask for the memo to go to you directly, so privileged files never pass through Cowork.",
            until: "You confirm that the memo and draft text arrived.",
            kind: "progress",
          },
          {
            id: "already-reviewed",
            when: "You reply that counsel already reviewed the bylaw.",
            actions: "Close the signal. Record the date and who reviewed it.",
            until: "The signal is closed, with the reason on record.",
            kind: "exception",
          },
          {
            id: "no-gap",
            when: "Counsel finds no gap that needs a change.",
            actions: "Quote counsel's reason to you, and close the signal when you confirm.",
            until: "The signal is closed, with counsel's reason on record.",
            kind: "exception",
          },
        ],
        tasks: [
          {
            id: "memo",
            description: "Send a memo on Article II, Section 8, with draft text",
            ownerEmail: "dana.whitfield@whitfieldcrane.com",
            due: "2026-12-08",
          },
        ],
      },
      {
        id: "prepare",
        title: "Prepare the change",
        startsWhen: "You've approved counsel's draft text.",
        doneWhen: "The amendment and the updated nominee questionnaire are on the Governance Committee's agenda.",
        approver: "Peter confirms the agenda",
        rules: [
          {
            id: "share-draft",
            when: "The draft text is approved, and the questionnaire and agenda owners don't have it yet.",
            actions: "Send each owner the approved text in their own thread, and confirm their due dates.",
            until: "Each owner has the text and has confirmed the date.",
            kind: "progress",
          },
          {
            id: "waiting",
            when: "An owner is waiting on another task before they can start.",
            actions: "Hold follow-ups for that owner. Tell them as soon as the other task is done.",
            until: "The owner has what they need, and follow-ups resume.",
            kind: "exception",
          },
          {
            id: "date-moves",
            when: "The committee or board meeting date moves.",
            actions: "Count every due date back from Jan 8 again, and ask you to approve the new dates.",
            until: "Every due date still lands before the window opens, or you accept the risk.",
            kind: "exception",
          },
        ],
        tasks: [
          {
            id: "agenda",
            description: "Put the bylaw amendment on the Governance Committee's Dec 15 agenda",
            ownerEmail: "alex.kim@acme.com",
            due: "2026-12-11",
          },
          {
            id: "questionnaire",
            description:
              "Add questions on agreements, concert parties, Section 13(d) groups and hedges to the nominee questionnaire",
            ownerEmail: "alex.kim@acme.com",
            due: "2026-12-18",
          },
        ],
      },
      {
        id: "adopt",
        title: "Adopt and disclose",
        startsWhen: "The Governance Committee recommends the amendment.",
        doneWhen: "The board adopted it, the 8-K under Item 5.03 is on EDGAR, and the website shows the new bylaws.",
        approver: "Peter confirms the filing",
        rules: [
          {
            id: "adopted",
            when: "The board adopts the amendment.",
            actions: "Work out the 8-K deadline, four business days later, and tell the filing owner.",
            until: "The filing owner has the deadline.",
            kind: "progress",
          },
          {
            id: "filed",
            when: "An 8-K under Item 5.03 with the new bylaws appears on EDGAR.",
            actions: "Mark the filing task done, and tell you with a link to the filing.",
            until: "You've seen the filing.",
            kind: "progress",
          },
          {
            id: "not-filed",
            when: "The 8-K deadline passed, and there's no 8-K on EDGAR.",
            actions: "Ask you whether the board adopted the change.",
            until: "You answer, or the 8-K appears.",
            kind: "exception",
          },
          {
            id: "office-closed",
            when: "Federal offices close on the deadline day.",
            actions: "Move the deadline to the next business day, and tell the filing owner.",
            until: "The filing owner has the new date.",
            kind: "exception",
          },
        ],
        tasks: [
          {
            id: "8k",
            description: "File the 8-K under Item 5.03 with the new bylaws",
            ownerEmail: "pete.lin@acme.com",
            due: "2026-12-24",
          },
          {
            id: "website",
            description: "Post the new bylaws on the governance documents page",
            ownerEmail: "morgan.diaz@acme.com",
            due: "2026-12-23",
          },
        ],
      },
      {
        id: "watch",
        title: "Watch the nomination window",
        startsWhen: "The new bylaws are in force.",
        doneWhen: "The window closed on Feb 6, and every notice that came in was reviewed under the new process.",
        approver: "Peter closes the signal",
        approachPhrase: ", then watches the window",
        rules: [
          {
            id: "edgar",
            when: "The nomination window is open.",
            actions: "Check EDGAR each day for a Schedule 13D or a contest filing, and tell you the same day.",
            until: "The window has closed.",
            kind: "progress",
          },
          {
            id: "notice",
            when: "You tell Cowork a nomination notice arrived.",
            actions:
              "Log it with the date received, start the review process, and track the deficiency letter date. The first letter must state every ground (slip op. 33).",
            until: "The notice is reviewed, and any deficiency letter has gone out.",
            kind: "progress",
          },
          {
            id: "saturday",
            when: "A notice arrives on Saturday, Feb 6.",
            actions: "Follow the office's decision on Saturday notices, and tell you.",
            until: "The notice is logged with the date the office took it.",
            kind: "exception",
          },
        ],
        tasks: [
          {
            id: "process",
            description: "Write the process for reviewing nomination notices",
            ownerEmail: "pete.lin@acme.com",
            due: "2027-01-06",
          },
          {
            id: "saturday",
            description: "Decide how the office takes a notice on Saturday, Feb 6",
            ownerEmail: "alex.kim@acme.com",
            due: "2027-01-06",
          },
        ],
      },
    ],
    rules: [
      {
        id: "follow-up",
        when: "An owner hasn't replied for three business days.",
        actions: "Follow up in the same thread.",
        circuitBreaker: "After three follow-ups, stop and ask you.",
        until: "The owner replies, or you reassign, extend, or drop the task.",
        kind: "progress",
      },
      {
        id: "first-outside-email",
        when: "Cowork is about to email someone outside Acme for the first time.",
        actions: "Show you the email before it goes.",
        until: 'You reply "Send", or edit it.',
        kind: "exception",
      },
      {
        id: "outside-done",
        when: "An owner outside Acme says a task is done.",
        actions: "Quote the reply to you, and change nothing yet.",
        until: "You confirm it, or reopen the task.",
        kind: "exception",
      },
      {
        id: "more-time",
        when: "An owner asks for more time.",
        actions: "Ask you for the new date.",
        until: "You approve it and Cowork tells the owner, or you keep the date.",
        kind: "exception",
      },
      {
        id: "wrong-owner",
        when: "An owner says the task belongs to someone else.",
        actions: "Ask you who should own it, then brief the new owner.",
        until: "The new owner confirms.",
        kind: "exception",
      },
      {
        id: "contest",
        when: "A nomination notice or Schedule 13D arrives before the board acts.",
        actions:
          "Pause every task and tell you the same day. Counsel decides the timing, because board action in a contest gets enhanced scrutiny (slip op. 40).",
        until: "Counsel has set a path, and you restart or change the plan.",
        kind: "exception",
      },
      {
        id: "stuck",
        when: "No rule fits what's happening.",
        actions: "Stop, and tell you what happened and what Cowork tried. Log it, so a rule can be added.",
        until: "You decide what happens next.",
        kind: "exception",
      },
    ],
  },
};

/**
 * Signals from before the ATG ruling. They don't appear in the attention
 * pane, which is for new items, but chat lists them under recent signals.
 * Two led to workstreams that predate the prototype's story: their tasks show
 * on the calendar, but the workstreams have no pages. Illustrative mock data.
 */
export const PAST_SIGNALS: Signal[] = [
  {
    id: "california-climate-disclosure",
    title: "California sets dates for climate disclosure reports",
    summary:
      "The California Air Resources Board set the first reporting dates under SB 253. Companies with more than $1 billion in revenue doing business in California report Scope 1 and 2 emissions first.",
    source: "California Air Resources Board",
    tags: [
      { kind: "type", label: "Regulatory change" },
      { kind: "jurisdiction", label: "California" },
      { kind: "topic", label: "Climate disclosure" },
    ],
    issuedDate: "2026-10-14",
    status: "In progress",
    deadlines: [
      {
        label: "First Scope 1 and 2 report due",
        date: "2027-06-30",
        description: "Covers fiscal 2026 emissions.",
      },
    ],
    reasonsRelevant: [
      "Acme's revenue is over the $1 billion threshold, and it sells in California",
      "The 2026 sustainability report has Scope 1 and 2 numbers, but no third-party assurance yet",
    ],
    pastWorkstream: {
      name: "Climate disclosure readiness",
      status: "Active",
      startedOn: "2026-10-16",
      statusSummary:
        "2 of 4 tasks done. Acme is confirmed in scope and the facilities data is in; Maya's pick of an assurance vendor slipped past Nov 2, which holds up the Dec 4 Audit Committee briefing.",
      tasks: [
        {
          id: "climate-scope",
          description: "Confirm Acme is in scope for SB 253",
          owner: "Sam Ortiz",
          due: "2026-10-23",
          status: "Done",
        },
        {
          id: "climate-data",
          description: "Collect fiscal 2026 Scope 1 and 2 data from facilities",
          owner: "Raj Patel",
          due: "2026-11-03",
          status: "Done",
        },
        {
          id: "climate-assurance",
          description: "Choose a third-party assurance vendor",
          owner: "Maya Chen",
          due: "2026-11-02",
          status: "In progress",
        },
        {
          id: "climate-briefing",
          description: "Brief the Audit Committee on the reporting timeline",
          owner: "Alex Kim",
          due: "2026-12-04",
          status: "Not started",
        },
      ],
    },
  },
  {
    id: "ftc-subscription-enforcement",
    title: "FTC settles with a subscription seller over hard-to-cancel plans",
    summary:
      "The FTC settled with a software company whose customers could only cancel by phone. The order requires online cancellation as easy as sign-up, and consent before each renewal charge.",
    source: "Federal Trade Commission",
    tags: [
      { kind: "type", label: "Enforcement action" },
      { kind: "jurisdiction", label: "United States" },
      { kind: "topic", label: "Subscription cancellation" },
    ],
    issuedDate: "2026-10-06",
    status: "Closed",
    deadlines: [],
    reasonsRelevant: ["Acme sells some software on auto-renewing plans, but customers can already cancel online"],
    outcome: "No action taken. Acme's customers already cancel online, so this one was lower priority.",
  },
  {
    id: "sec-cyber-guidance",
    title: "SEC staff guidance on reporting a material cyber-attack",
    summary:
      "SEC staff clarified when a cyber-attack must be reported on Form 8-K under Item 1.05: within four business days after the company decides it's material, not after the investigation ends.",
    source: "Securities and Exchange Commission",
    tags: [
      { kind: "type", label: "Regulatory change" },
      { kind: "jurisdiction", label: "United States" },
      { kind: "topic", label: "Cyber incident disclosure" },
    ],
    issuedDate: "2026-09-21",
    status: "In progress",
    deadlines: [],
    reasonsRelevant: [
      "Incident Response Plan §4.2 said five business days, not four",
      "Nobody was named to sign an 8-K cyber filing",
    ],
    pastWorkstream: {
      name: "Cyber 8-K readiness",
      status: "Active",
      startedOn: "2026-09-24",
      statusSummary:
        "3 of 4 tasks done. The plan now says four business days, Raj signs 8-K cyber filings, and the tabletop ran Nov 2; Alex adds the plan to the Nov 12 Audit Committee pre-read.",
      tasks: [
        {
          id: "cyber-irp",
          description: "Update Incident Response Plan §4.2 to four business days",
          owner: "Pete Lin",
          due: "2026-10-16",
          status: "Done",
        },
        {
          id: "cyber-signoff",
          description: "Confirm who signs an 8-K cyber filing",
          owner: "Raj Patel",
          due: "2026-10-23",
          status: "Done",
        },
        {
          id: "cyber-tabletop",
          description: "Run a tabletop exercise on the materiality decision",
          owner: "Maya Chen",
          due: "2026-11-02",
          status: "Done",
        },
        {
          id: "cyber-preread",
          description: "Add the updated plan to the Audit Committee pre-read",
          owner: "Alex Kim",
          due: "2026-11-12",
          status: "Not started",
        },
      ],
    },
  },
  {
    id: "delaware-officer-exculpation",
    title: "Delaware ruling on exculpating officers",
    summary:
      "The Court of Chancery held that a charter amendment exculpating officers covers only claims for breach of the duty of care, not loyalty claims or claims brought by the company itself.",
    source: "Delaware Court of Chancery",
    tags: [
      { kind: "type", label: "Court ruling" },
      { kind: "jurisdiction", label: "Delaware" },
      { kind: "topic", label: "Officer exculpation" },
    ],
    issuedDate: "2026-08-12",
    status: "Closed",
    deadlines: [],
    reasonsRelevant: ["Acme amended its charter in 2024 to exculpate officers"],
    outcome:
      "Reviewed with outside counsel on Aug 20. Acme's charter already matches the ruling, so no change is needed.",
  },
  {
    id: "peer-clawback-policies",
    title: "Three peers expand their clawback policies",
    summary:
      "Three companies in Acme's proxy peer group expanded their clawback policies beyond the SEC's Rule 10D-1 minimum, to cover misconduct as well as restatements.",
    source: "Peer proxy filings",
    tags: [
      { kind: "type", label: "Peer filing" },
      { kind: "topic", label: "Executive compensation" },
    ],
    issuedDate: "2026-07-28",
    status: "Closed",
    deadlines: [],
    reasonsRelevant: ["Acme's clawback policy covers restatements only, the Rule 10D-1 minimum"],
    outcome:
      "Shared with the Compensation Committee on Aug 5. The committee will revisit it in its 2027 policy review.",
  },
];

/** Every signal, in the order Cowork surfaced them, newest first. */
export const SIGNALS: Signal[] = [ATG_RULING, ...PAST_SIGNALS];
