import { ATG_RULING } from "@/signals/signals";
import { LOGGED_IN_USER } from "@/user";

import { findPerson } from "./people";
import { formatShortDate } from "./taskStatus";
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
} from "./threadMessages";

/**
 * Demo shortcut: when the GC starts the ATG v. Lane workstream, its tasks jump
 * ahead to where they'd be after a few days (Tue Oct 27 to Mon Nov 2). Each
 * history shows a plan rule at work: the first email outside Acme waits for
 * Peter, outside counsel's "done" waits for Peter's review, and a waiting
 * owner's follow-ups are held until the task they wait on is done.
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

  if (key === "counsel") {
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
          `Dana is outside Acme, so here's my first email to Dana before it goes. Reply "Send", or tell me what to change.\n\n"${firstEmail.body}"`,
          "2026-10-27T13:31:00Z",
        ),
        gcChatMessage("Send.", "2026-10-27T14:02:00Z"),
        firstEmail,
        coworkAction("Set reminders for Dana", "2026-10-27T14:04:00Z", {
          detail: "Follows up every three business days until Dana replies, up to three times.",
          rule: "An owner hasn't replied for three business days.",
        }),
        ownerReply(
          DANA,
          `Happy to. I'll send the memo and a draft Section 8 to ${GC} directly by Nov 6, and reply "done" here when it's sent.`,
          "2026-10-28T16:20:00Z",
        ),
        ownerReply(
          DANA,
          `Done. I emailed ${GC} the memo and a draft Section 8 this afternoon, ahead of the Nov 6 date.`,
          "2026-11-02T21:40:00Z",
        ),
        coworkAction("Held the task open for your review", "2026-11-02T21:41:00Z", {
          detail:
            "Dana is outside Acme, so Dana's \"done\" doesn't close the task. You confirm it once you've reviewed the memo.",
          rule: "An owner outside Acme says a task is done.",
        }),
        coworkNote(
          `Dana says the memo and draft Section 8 went to you: "Done. I emailed ${GC} the memo and a draft Section 8 this afternoon, ahead of the Nov 6 date." Review it, then reply "Got it" or confirm on the task, and I'll close it.`,
          "2026-11-02T21:42:00Z",
        ),
      ],
      awaitingReview: true,
      reviewPrompt: "Review Dana's memo and draft Section 8, then confirm.",
      statusSummary: "Dana sent the memo and draft Section 8 to you on Nov 2.",
    });
  }

  if (key === "prepare") {
    return withTask(task, {
      status: "In progress",
      history: [
        assignmentEmail(task, "2026-10-27T13:32:00Z"),
        ownerReply(
          ALEX,
          "I'll hold the Dec 15 Governance Committee slot now, and start the questionnaire once counsel's draft text is in, so the new questions match it.",
          "2026-10-27T19:45:00Z",
        ),
        coworkAction("Held follow-ups for Alex", "2026-10-27T19:46:00Z", {
          detail: "Alex is waiting on counsel's view. Cowork tells Alex when you approve the draft text.",
          rule: "An owner is waiting on another task before they can start.",
        }),
        ownerReply(
          ALEX,
          "The amendment is item 3 on the Governance Committee's Dec 15 agenda, and I've held Dec 18 for a special board meeting.",
          "2026-10-29T15:10:00Z",
          ["Governance Committee agenda, Dec 15.pdf"],
        ),
        fileAdded(
          "Governance Committee agenda, Dec 15.pdf",
          "Alex Kim",
          "2026-10-29T15:10:00Z",
          "Attached to Alex's email",
        ),
      ],
      statusSummary:
        "The Dec 15 committee slot is booked. Alex starts the questionnaire once you approve counsel's text.",
    });
  }

  if (key === "adopt") {
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
        "Pete has an 8-K shell ready. It's due four business days after the board adopts, so Dec 24 if it adopts Dec 18.",
    });
  }

  if (key === "watch") {
    const note = "Make sure the process says who signs the deficiency letter.";
    return withTask(task, {
      status: "In progress",
      history: [
        assignmentEmail(task, "2026-10-27T13:36:00Z"),
        ownerReply(
          PETE,
          "Drafting the notice review process now. The first deficiency letter will list every ground, so we never have to send a second one. Outline attached.",
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
      statusSummary: "Pete is drafting the notice review process, with your note on who signs the deficiency letter.",
    });
  }

  return withTask(task, {
    history: [assignmentEmail(task, "2026-10-27T13:37:00Z")],
  });
}

const PREPARE_ID = `${ATG_RULING.id}-prepare`;

/**
 * After you confirm counsel's memo, Cowork applies the "share the draft" rule:
 * it tells Alex the text is approved and resumes follow-ups. The text itself
 * comes from you, so counsel's privileged files never pass through Cowork.
 */
export function afterAtgTaskConfirmed(workstream: Workstream, taskId: string, sentAt: string): Workstream {
  if (!isAtgWorkstream(workstream) || taskId !== `${ATG_RULING.id}-counsel`) return workstream;
  const tasks = workstream.plan.tasks.map((task) => {
    if (task.id !== PREPARE_ID || task.status === "Done") return task;
    return withTask(task, {
      history: [
        ...task.history,
        coworkEmail(
          ALEX,
          `Re: ${task.description}`,
          `Hi Alex, ${GC} approved counsel's draft text for Article II, Section 8, and is forwarding it to you now. You can start the questionnaire so the new questions match it. It's due ${formatShortDate(task.deadline)}.`,
          sentAt,
        ),
        coworkAction("Told Alex the draft text is approved", sentAt, {
          detail: "Follow-ups for Alex resume, counting toward the due date.",
          rule: "The draft text is approved, and the questionnaire and agenda owners don't have it yet.",
        }),
      ],
      statusSummary: `${GC} approved the draft text on ${formatShortDate(sentAt)}, so Alex can start the questionnaire. Due ${formatShortDate(task.deadline)}.`,
    });
  });
  return { ...workstream, plan: { ...workstream.plan, tasks } };
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
  };
}
