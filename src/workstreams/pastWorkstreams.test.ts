import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import { PAST_SIGNALS } from "@/signals/signals";

import { PAST_WORKSTREAMS } from "./pastWorkstreams";
import { SEED_WORKSTREAMS } from "./workstreamStore";

const NOW = new Date("2026-11-03T12:00:00Z");

test("the two past workstreams are real workstreams when the app loads", () => {
  expect(PAST_WORKSTREAMS.map((w) => w.name)).toEqual(["Climate disclosure readiness", "Cyber 8-K readiness"]);
  expect(SEED_WORKSTREAMS).toEqual(PAST_WORKSTREAMS);
  for (const workstream of PAST_WORKSTREAMS) {
    expect(workstream.plan.status).toBe("accepted");
    expect(PAST_SIGNALS.some((s) => s.id === workstream.sourceSignalId)).toBe(true);
  }
});

test("every past task keeps its owner, date, status, summary and what done looks like", () => {
  const climate = PAST_WORKSTREAMS[0];
  const source = PAST_SIGNALS.find((s) => s.id === climate.sourceSignalId)!.pastWorkstream!;
  expect(climate.plan.tasks).toHaveLength(source.tasks.length);
  const vendor = climate.plan.tasks.find((t) => t.id === "climate-assurance")!;
  expect(vendor).toMatchObject({ deadline: "2026-11-02", status: "In progress" });
  expect(vendor.delegate.label).toBe("Maya Chen");
  expect(vendor.statusSummary).toMatch(/two vendor quotes/);
  expect(vendor.doneWhen).toMatch(/assurance vendor is engaged/);
  expect(climate.plan.tasks.find((t) => t.id === "climate-briefing")!.waitingOn).toBe("climate-assurance");
  expect(vendor.history.length).toBeGreaterThan(0);
});

test("their calendar tasks link to their workstream pages, not their signal", () => {
  const events = deriveCalendarEvents(PAST_WORKSTREAMS, NOW);
  const vendor = events.find((e) => e.id === "climate-assurance")!;
  expect(vendor.kind).toBe("task");
  expect(vendor.href).toBe("/workstreams/past-climate-disclosure-readiness?task=climate-assurance");
  expect(vendor.attention).toBe("nudge");
  expect(events.filter((e) => e.kind === "reference")).toHaveLength(0);
});
