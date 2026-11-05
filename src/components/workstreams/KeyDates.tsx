import CalendarIcon from "@diligentcorp/atlas-react-bundle/icons/Calendar";
import { Stack, Typography, useTheme } from "@mui/material";

import { formatDate } from "@/lib/dates";
import { SPACE } from "@/lib/layout";
import type { SignalDeadline } from "@/signals/signal";

import { SectionCard } from "./SectionCard";

/** The signal's external dates, soonest first: each label, its date, and what it means. */
export function KeyDatesList({ deadlines }: { deadlines: SignalDeadline[] }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  if (!deadlines.length) {
    return (
      <Typography variant="body1" sx={{ color: muted }}>
        No key dates.
      </Typography>
    );
  }
  const ordered = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Stack component="ul" gap={SPACE.group} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {ordered.map((deadline) => (
        <Stack component="li" key={deadline.label} gap={SPACE.pair}>
          <Typography variant="body1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {deadline.label}
          </Typography>
          <Typography variant="body1">{formatDate(deadline.date)}</Typography>
          {deadline.description ? (
            <Typography variant="textMd" sx={{ color: muted }}>
              {deadline.description}
            </Typography>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}

export function KeyDatesCard({ deadlines }: { deadlines: SignalDeadline[] }) {
  return (
    <SectionCard title="Key Dates" icon={<CalendarIcon aria-hidden />}>
      <KeyDatesList deadlines={deadlines} />
    </SectionCard>
  );
}
