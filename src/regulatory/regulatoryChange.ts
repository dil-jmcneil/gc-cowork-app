export type RegulatoryChangeStatus = "New" | "In review" | "Upcoming";

export type RegulatoryDeadline = {
  label: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** One line on what the deadline requires. */
  description?: string;
};

/** A task Cowork proposes when a project is drafted from the change. */
export type TaskTemplate = {
  /** Stable within the change, so stories can find the task again. */
  id: string;
  description: string;
  /** Directory email of the suggested owner. */
  ownerEmail: string;
  /** ISO date, yyyy-mm-dd. */
  due: string;
};

/** A subset of the OOUX regulatory change object; later work extends it. */
export type RegulatoryChange = {
  id: string;
  title: string;
  summary: string;
  regulatoryBody: string;
  /** ISO date, yyyy-mm-dd. */
  effectiveDate: string;
  status: RegulatoryChangeStatus;
  /** External, regulator-set dates. Shown on the calendar as external deadlines. */
  deadlines: RegulatoryDeadline[];
  reasonsRelevant: string[];
  /** Internal work Cowork drafts into a project's plan. */
  taskTemplates: TaskTemplate[];
};
