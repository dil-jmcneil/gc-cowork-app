export type RegulatoryChangeStatus = "New" | "In review" | "Upcoming";

export type RegulatoryDeadline = {
  label: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** One line on what the deadline requires. */
  description?: string;
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
  deadlines: RegulatoryDeadline[];
  reasonsRelevant: string[];
};
