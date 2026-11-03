import { ATG_RULING } from "@/signals/signals";
import { LOGGED_IN_USER } from "@/user";

import { findPerson } from "./people";
import type { Workstream, WorkstreamTask } from "./workstream";
import {
  assignmentEmail,
  coworkAction,
  coworkEmail,
  coworkNote,
  fileAdded,
  gcChatMessage,
  ownerReply,
  relayEmail,
  reminderEmail,
} from "./threadMessages";

/**
 * Demo shortcut: when the GC starts the ATG v. Lane workstream, its tasks jump
 * ahead to where they'd be after a few days (Tue Oct 27 to Mon Nov 2). Each
 * history shows a plan rule at work: the first email outside Acme waits for
 * Peter, a waiting owner's follow-ups are held, and a silent owner is chased
 * toward the three-follow-up circuit breaker.
 */
const STARTED_AT = "2026-10-27T13:25:00Z";

const GC = LOGGED_IN_USER.firstName;
const DANA = findPerson("dana.whitfield@whitfieldcrane.com");
const ALEX = findPerson("alex.kim@acme.com");
const PETE = findPerson("pete.lin@acme.com");

function withTask(task: WorkstreamTask, patch: Partial<WorkstreamTask>): WorkstreamTask {
  return { ...task, ...patch };
}

function storyFor(task: WorkstreamTask): WorkstreamTask {
  const key = task.id.slice(ATG_RULING.id.length + 1);

  if (key === "memo") {
    const firstEmail = coworkEmail(
      DANA,
      "Delaware ruling: memo on Acme's Article II, Section 8",
      `Hi Dana, could you send ${GC} a memo on Article II, Section 8 of the Acme bylaws, with draft text, by Nov 6? The board must act before the nomination window opens on Jan 8. The points for counsel are the Section 8(c)(i) cross-reference, the nominee-only request right (slip op. 37), the missing Rule 14a-19 text, and agreements with other persons (slip op. 22). Please send the memo to ${GC} directly, and reply "done" to me when it's sent.`,
      "2026-10-27T14:03:00Z",
    );
    return withTask(task, {
      status: "In progress",
      history: [
        coworkAction("Compared Article II, Section 8 with the ruling", "2026-10-27T13:29:00Z", {
          detail: "Found four points for counsel and five items the bylaw already covers.",
        }),
        fileAdded(
          "Bylaw comparison, Article II, Section 8 v. ATG v. Lane.docx",
          "Cowork",
          "2026-10-27T13:29:30Z",
          "Shared with Dana",
        ),
        coworkAction("Held the first email to Dana for your review", "2026-10-27T13:30:30Z", {
          rule: "Cowork is about to email someone outside Acme for the first time.",
        }),
        coworkNote(
          `Dana is outside Acme, so here's my first email to her before it goes. Reply "Send", or tell me what to change.\n\n"${firstEmail.body}"`,
          "2026-10-27T13:31:00Z",
        ),
        gcChatMessage("Send.", "2026-10-27T14:02:00Z"),
        firstEmail,
        coworkAction("Set reminders for Dana", "2026-10-27T14:04:00Z", {
          detail: "Follows up every three business days until she replies, up to three times.",
          rule: "An owner hasn't replied for three business days.",
        }),
        ownerReply(
          DANA,
          `Happy to. I'll send the memo and a draft Section 8 to ${GC} directly by Nov 6, and reply "done" here when it's sent.`,
          "2026-10-28T16:20:00Z",
        ),
      ],
      statusSummary: `Dana confirmed on Oct 28. The memo and draft text go to you directly by Nov 6. When she says it's done, Cowork checks with you before closing the task.`,
    });
  }

  if (key === "agenda") {
    return withTask(task, {
      status: "Done",
      history: [
        assignmentEmail(task, "2026-10-27T13:32:00Z"),
        ownerReply(
          ALEX,
          "Done. The amendment is item 3 on the Governance Committee's Dec 15 agenda, and I've held Dec 18 for a special board meeting.",
          "2026-10-29T15:10:00Z",
          ["Governance Committee agenda, Dec 15.pdf"],
        ),
        fileAdded(
          "Governance Committee agenda, Dec 15.pdf",
          "Alex Kim",
          "2026-10-29T15:10:00Z",
          "Attached to Alex's email",
        ),
        coworkAction("Marked the task done", "2026-10-29T15:11:00Z", {
          detail: "Alex is inside Acme, so the reply closed the task.",
        }),
      ],
      statusSummary:
        "Done on Oct 29. The amendment is item 3 on the Dec 15 committee agenda, and Dec 18 is held for the board.",
    });
  }

  if (key === "questionnaire") {
    return withTask(task, {
      history: [
        assignmentEmail(task, "2026-10-27T13:33:00Z"),
        ownerReply(
          ALEX,
          "I'll start once counsel's draft text is in, so the new questions match it.",
          "2026-10-27T19:45:00Z",
        ),
        coworkAction("Held follow-ups for Alex", "2026-10-27T19:46:00Z", {
          detail: "Alex is waiting on Dana's memo. Cowork sends Alex the draft text when you approve it.",
          rule: "An owner is waiting on another task before they can start.",
        }),
      ],
      statusSummary:
        "Waiting on counsel's draft text. Cowork is holding follow-ups and sends Alex the text when you approve it.",
    });
  }

  if (key === "8k") {
    return withTask(task, {
      history: [
        assignmentEmail(task, "2026-10-27T13:34:00Z"),
        ownerReply(
          PETE,
          "Got it. I'll have an 8-K shell ready, so it can go the day the board adopts.",
          "2026-10-28T14:05:00Z",
        ),
        coworkAction("Linked the 8-K deadline to the board's vote", "2026-10-28T14:06:00Z", {
          detail: "The deadline is set when the board adopts the amendment, four business days later.",
          rule: "The board adopts the amendment.",
        }),
      ],
      statusSummary:
        "Pete has an 8-K shell ready. The deadline is four business days after the board adopts, so Dec 24 if it adopts on Dec 18.",
    });
  }

  if (key === "website") {
    return withTask(task, {
      history: [
        assignmentEmail(task, "2026-10-27T13:35:00Z"),
        reminderEmail(task, "2026-10-30T13:00:00Z", { n: 1, of: 3 }),
        coworkAction("Scheduled the next follow-up for Nov 4", "2026-10-30T13:01:00Z", {
          detail: "Morgan hasn't replied. After the third follow-up, Cowork stops and asks you.",
          rule: "An owner hasn't replied for three business days.",
        }),
      ],
      statusSummary:
        "Morgan hasn't replied. Cowork followed up on Oct 30 (1 of 3) and tries again on Nov 4. After the third, it asks you.",
    });
  }

  if (key === "process") {
    const note = "Make sure the process says who signs the deficiency letter.";
    return withTask(task, {
      status: "In progress",
      history: [
        assignmentEmail(task, "2026-10-27T13:36:00Z"),
        ownerReply(
          PETE,
          "Drafting it now. The first deficiency letter will list every ground, so we never have to send a second one. Outline attached.",
          "2026-10-30T17:25:00Z",
          ["Nomination notice review process (outline).docx"],
        ),
        fileAdded(
          "Nomination notice review process (outline).docx",
          "Pete Lin",
          "2026-10-30T17:25:00Z",
          "Attached to Pete's email",
        ),
        gcChatMessage(note, "2026-11-02T14:10:00Z"),
        relayEmail(task, note, "2026-11-02T14:11:00Z"),
      ],
    });
  }

  return withTask(task, {
    history: [assignmentEmail(task, "2026-10-27T13:37:00Z")],
  });
}

export function isAtgWorkstream(workstream: Pick<Workstream, "sourceSignalId">): boolean {
  return workstream.sourceSignalId === ATG_RULING.id;
}

/** The ATG v. Lane workstream as it stands a few days after it started. */
export function progressAtgWorkstream(workstream: Workstream): Workstream {
  return {
    ...workstream,
    createdAt: STARTED_AT,
    plan: { ...workstream.plan, tasks: workstream.plan.tasks.map(storyFor) },
    statusSummary:
      "Getting counsel's view: Dana's memo is due Nov 6 and the Dec 15 committee slot is booked; Morgan hasn't replied yet (follow-up 1 of 3).",
  };
}
