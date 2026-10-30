import { CYBER_RULE_CHANGE } from "@/regulatory/regulatoryChanges";

import { findPerson } from "./people";
import type { Project, ProjectTask } from "./project";
import { assignmentEmail, gcChatMessage, ownerReply, reassignmentEmail, relayEmail, reminderEmail } from "./threadMessages";

/**
 * Demo shortcut: when the GC starts the cyber-rule project, its tasks jump
 * ahead to where they'd be after a few days of work (Mon Oct 26 to Thu Oct 29),
 * following the cowork-governance-mvp story — Pete updates the Incident
 * Response Plan, and the 8-K sign-off moves from Pete to Raj.
 */
const STARTED_AT = "2026-10-26T13:00:00Z";

const PETE = findPerson("pete.lin@acme.com");
const RAJ = findPerson("raj.patel@acme.com");
const ALEX = findPerson("alex.kim@acme.com");

function withTask(task: ProjectTask, patch: Partial<ProjectTask>): ProjectTask {
  return { ...task, ...patch };
}

function storyFor(task: ProjectTask): ProjectTask {
  const key = task.id.slice(CYBER_RULE_CHANGE.id.length + 1);

  if (key === "irp") {
    const t = withTask(task, { delegate: PETE });
    return withTask(t, {
      status: "In progress",
      thread: [
        assignmentEmail(t, "2026-10-26T13:05:00Z"),
        ownerReply(PETE, "On it. I'll have a redline of §4.2 to Peter by Thursday.", "2026-10-26T18:12:00Z"),
        gcChatMessage(
          "When Pete sends the redline, make sure it names who decides whether an incident is material.",
          "2026-10-28T14:30:00Z",
        ),
        relayEmail(t, "Please make sure the redline names who decides whether an incident is material.", "2026-10-28T14:31:00Z"),
        ownerReply(
          PETE,
          "Redline attached. §4.2 now says four business days, and it names the General Counsel — not the Disclosure Committee — as the person who decides whether an incident is material.",
          "2026-10-29T20:45:00Z",
          ["Incident Response Plan v3 (redline).docx"],
        ),
      ],
      statusSummary:
        "Pete sent the redline on Oct 29. It sets four business days and names you, not the Disclosure Committee, as the person who decides materiality. It's waiting for your signature.",
    });
  }

  if (key === "signoff") {
    const toPete = withTask(task, { delegate: PETE });
    const toRaj = withTask(task, { delegate: RAJ });
    return withTask(toRaj, {
      status: "Done",
      thread: [
        assignmentEmail(toPete, "2026-10-26T13:06:00Z"),
        reminderEmail(toPete, "2026-10-28T13:00:00Z"),
        ownerReply(PETE, "Sorry, the 8-K sign-off is really Raj's in Finance. Can you loop Raj in?", "2026-10-28T15:20:00Z"),
        gcChatMessage("Give the 8-K sign-off to Raj.", "2026-10-28T15:44:00Z"),
        reassignmentEmail(toPete, RAJ, "2026-10-28T15:45:00Z"),
        ownerReply(RAJ, "Confirmed. I sign 8-K cyber filings, and the CFO is my backup.", "2026-10-29T13:15:00Z"),
      ],
      statusSummary:
        "Raj Patel confirmed on Oct 29 that he signs 8-K cyber filings, with the CFO as backup. Pete handed it to him on Oct 28.",
    });
  }

  if (key === "preread") {
    const t = withTask(task, { delegate: ALEX });
    return withTask(t, {
      status: "Not started",
      thread: [
        assignmentEmail(t, "2026-10-26T13:07:00Z"),
        ownerReply(ALEX, "Will do. I'll hold a slot in the Nov 18 pre-read for the signed plan.", "2026-10-26T17:02:00Z"),
      ],
      statusSummary:
        "Alex is holding a slot in the Nov 18 Audit Committee pre-read. It's waiting on your signature of the updated plan.",
    });
  }

  return withTask(task, { thread: [assignmentEmail(task, "2026-10-26T13:08:00Z")] });
}

export function isCyberProject(project: Pick<Project, "sourceChangeId">): boolean {
  return project.sourceChangeId === CYBER_RULE_CHANGE.id;
}

/** The cyber project as it stands a few days after it started. */
export function progressCyberProject(project: Project): Project {
  return {
    ...project,
    createdAt: STARTED_AT,
    plan: { ...project.plan, tasks: project.plan.tasks.map(storyFor) },
    statusSummary:
      "1 of 3 tasks done. Raj owns the 8-K sign-off, and Pete's redline of §4.2 is waiting for your signature.",
  };
}
