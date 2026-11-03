import { ATG_RULING } from "@/insights/insights";
import { LOGGED_IN_USER } from "@/user";

import { findPerson } from "./people";
import type { Project, ProjectTask } from "./project";
import {
  assignmentEmail,
  coworkEmail,
  coworkNote,
  gcChatMessage,
  ownerReply,
  relayEmail,
  reminderEmail,
} from "./threadMessages";

/**
 * Demo shortcut: when the GC starts the ATG v. Lane project, its tasks jump
 * ahead to where they'd be after a few days (Tue Oct 27 to Mon Nov 2). Each
 * thread shows a plan rule at work: the first email outside Acme waits for
 * Peter, a waiting owner's follow-ups are held, and a silent owner is chased
 * toward the three-follow-up circuit breaker.
 */
const STARTED_AT = "2026-10-27T13:30:00Z";

const GC = LOGGED_IN_USER.firstName;
const DANA = findPerson("dana.whitfield@whitfieldcrane.com");
const ALEX = findPerson("alex.kim@acme.com");
const PETE = findPerson("pete.lin@acme.com");

function withTask(task: ProjectTask, patch: Partial<ProjectTask>): ProjectTask {
  return { ...task, ...patch };
}

function storyFor(task: ProjectTask): ProjectTask {
  const key = task.id.slice(ATG_RULING.id.length + 1);

  if (key === "memo") {
    const firstEmail = coworkEmail(
      DANA,
      "Delaware ruling: memo on Acme's Article II, Section 8",
      `Hi Dana, could you send ${GC} a memo on Article II, Section 8 of the Acme bylaws, with draft text, by Dec 8? The board must act before the nomination window opens on Jan 8. The points for counsel are the Section 8(c)(i) cross-reference, the nominee-only request right (slip op. 37), the missing Rule 14a-19 text, and agreements with other persons (slip op. 22). Please send the memo to ${GC} directly, and reply "done" to me when it's sent.`,
      "2026-10-27T14:03:00Z",
    );
    return withTask(task, {
      status: "In progress",
      thread: [
        coworkNote(
          `Dana is outside Acme, so here's my first email to her before it goes. Reply "Send", or tell me what to change.\n\n"${firstEmail.body}"`,
          "2026-10-27T13:31:00Z",
        ),
        gcChatMessage("Send.", "2026-10-27T14:02:00Z"),
        firstEmail,
        ownerReply(
          DANA,
          `Happy to. I'll send the memo and a draft Section 8 to ${GC} directly by Dec 8, and reply "done" here when it's sent.`,
          "2026-10-28T16:20:00Z",
        ),
      ],
      statusSummary: `Dana confirmed on Oct 28. The memo and draft text go to you directly by Dec 8. When she says it's done, Cowork checks with you before closing the task.`,
    });
  }

  if (key === "agenda") {
    return withTask(task, {
      status: "Done",
      thread: [
        assignmentEmail(task, "2026-10-27T13:32:00Z"),
        ownerReply(
          ALEX,
          "Done. The amendment is item 3 on the Governance Committee's Dec 15 agenda, and I've held Dec 18 for a special board meeting.",
          "2026-10-29T15:10:00Z",
        ),
      ],
      statusSummary:
        "Done on Oct 29. The amendment is item 3 on the Dec 15 committee agenda, and Dec 18 is held for the board.",
    });
  }

  if (key === "questionnaire") {
    return withTask(task, {
      thread: [
        assignmentEmail(task, "2026-10-27T13:33:00Z"),
        ownerReply(
          ALEX,
          "I'll start once counsel's draft text is in, so the new questions match it.",
          "2026-10-27T19:45:00Z",
        ),
        coworkNote(
          "Alex is waiting on Dana's memo, so I'm holding follow-ups. I'll send Alex the text when you approve it.",
          "2026-10-27T19:46:00Z",
        ),
      ],
      statusSummary:
        "Waiting on counsel's draft text. Cowork is holding follow-ups and sends Alex the text when you approve it.",
    });
  }

  if (key === "8k") {
    return withTask(task, {
      thread: [
        assignmentEmail(task, "2026-10-27T13:34:00Z"),
        ownerReply(
          PETE,
          "Got it. I'll have an 8-K shell ready, so it can go the day the board adopts.",
          "2026-10-28T14:05:00Z",
        ),
      ],
      statusSummary:
        "Pete has an 8-K shell ready. The deadline is four business days after the board adopts, so Dec 24 if it adopts on Dec 18.",
    });
  }

  if (key === "website") {
    return withTask(task, {
      thread: [
        assignmentEmail(task, "2026-10-27T13:35:00Z"),
        reminderEmail(task, "2026-10-30T13:00:00Z", { n: 1, of: 3 }),
      ],
      statusSummary:
        "Morgan hasn't replied. Cowork followed up on Oct 30 (1 of 3) and tries again on Nov 4. After the third, it asks you.",
    });
  }

  if (key === "process") {
    const note = "Make sure the process says who signs the deficiency letter.";
    return withTask(task, {
      status: "In progress",
      thread: [
        assignmentEmail(task, "2026-10-27T13:36:00Z"),
        ownerReply(
          PETE,
          "Drafting it now. The first deficiency letter will list every ground, so we never have to send a second one.",
          "2026-10-30T17:25:00Z",
        ),
        gcChatMessage(note, "2026-11-02T14:10:00Z"),
        relayEmail(task, note, "2026-11-02T14:11:00Z"),
      ],
    });
  }

  return withTask(task, {
    thread: [assignmentEmail(task, "2026-10-27T13:37:00Z")],
  });
}

export function isAtgProject(project: Pick<Project, "sourceInsightId">): boolean {
  return project.sourceInsightId === ATG_RULING.id;
}

/** The ATG v. Lane project as it stands a few days after it started. */
export function progressAtgProject(project: Project): Project {
  return {
    ...project,
    createdAt: STARTED_AT,
    plan: { ...project.plan, tasks: project.plan.tasks.map(storyFor) },
    statusSummary:
      "Milestone 1 of 4, Get counsel's view. Dana's memo is due Dec 8, and the Dec 15 committee slot is booked. Morgan hasn't replied yet (follow-up 1 of 3).",
  };
}
