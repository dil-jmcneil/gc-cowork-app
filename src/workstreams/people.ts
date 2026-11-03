export type OwnerKind = "directory" | "email" | "slack" | "teams";

/** A task owner: someone from the company directory, or an external contact we only have a handle for. */
export type TaskOwner = {
  id: string;
  label: string;
  /** Secondary line: role and email for directory people, channel for external contacts. */
  detail: string;
  kind: OwnerKind;
};

function person(label: string, role: string, email: string): TaskOwner {
  return { id: email, label, detail: `${role} · ${email}`, kind: "directory" };
}

/** Mock company directory. */
export const DIRECTORY: TaskOwner[] = [
  person("Maya Chen", "CISO", "maya.chen@acme.com"),
  person("Jordan Lee", "Privacy counsel", "jordan.lee@acme.com"),
  person("Sam Ortiz", "Compliance lead", "sam.ortiz@acme.com"),
  person("Priya Natarajan", "Head of HR", "priya.natarajan@acme.com"),
  person("Alex Kim", "Corporate secretary", "alex.kim@acme.com"),
  person("Chris Okafor", "VP, Product", "chris.okafor@acme.com"),
  person("Pete Lin", "Associate General Counsel", "pete.lin@acme.com"),
  person("Raj Patel", "Controller", "raj.patel@acme.com"),
  person("Morgan Diaz", "Investor relations", "morgan.diaz@acme.com"),
];

/** People outside Acme that Cowork already knows. They get email, and never sign in. */
export const OUTSIDE_CONTACTS: TaskOwner[] = [
  {
    id: "email:dana.whitfield@whitfieldcrane.com",
    label: "Dana Whitfield",
    detail: "Outside counsel, Whitfield & Crane LLP · dana.whitfield@whitfieldcrane.com",
    kind: "email",
  },
];

/** True for an owner outside the company, whose replies Peter confirms before anything changes. */
export function isOutsideOwner(owner: TaskOwner): boolean {
  return owner.kind !== "directory";
}

/** A directory person or known outside contact by email; throws for an unknown email so bad seed data fails loudly. */
export function findPerson(email: string): TaskOwner {
  const found = [...DIRECTORY, ...OUTSIDE_CONTACTS].find((p) => p.id === email || p.id === `email:${email}`);
  if (!found) throw new Error(`No directory person with email ${email}`);
  return found;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^@[\w.-]+$/;

/**
 * Typeahead options for an owner field: directory matches, plus an external
 * option when the input is an email address or an @handle (Slack or Teams).
 */
export function suggestOwners(
  input: string,
  directory: TaskOwner[] = [...DIRECTORY, ...OUTSIDE_CONTACTS],
): TaskOwner[] {
  const query = input.trim().toLowerCase();
  if (!query) return directory;

  const matches = directory.filter(
    (o) => o.label.toLowerCase().includes(query) || o.detail.toLowerCase().includes(query),
  );

  const raw = input.trim();
  if (
    EMAIL.test(raw) &&
    !directory.some((o) => o.id.toLowerCase() === query || o.id.toLowerCase() === `email:${query}`)
  ) {
    matches.push({
      id: `email:${query}`,
      label: raw,
      detail: "External email",
      kind: "email",
    });
  } else if (HANDLE.test(raw)) {
    matches.push(
      { id: `slack:${query}`, label: raw, detail: "Slack", kind: "slack" },
      {
        id: `teams:${query}`,
        label: raw,
        detail: "Microsoft Teams",
        kind: "teams",
      },
    );
  }
  return matches;
}

/** First name for named people; the handle or email for contacts we only have an address for. */
export function ownerShortName(owner: TaskOwner): string {
  return /[@.]/.test(owner.label) ? owner.label : owner.label.split(" ")[0];
}
