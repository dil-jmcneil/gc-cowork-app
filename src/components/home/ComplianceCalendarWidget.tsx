import { Card, CardContent, Link, Stack, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router";

import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import { EventRow } from "@/components/calendar/EventRow";
import { useProjectStore } from "@/projects/projectStore";

const PREVIEW_COUNT = 6;

/** Condensed preview of the Compliance Calendar for the home page. */
export function ComplianceCalendarWidget() {
  const { tokens } = useTheme();
  const projects = useProjectStore((s) => s.projects);
  const events = useMemo(
    () => deriveCalendarEvents(projects, new Date()).slice(0, PREVIEW_COUNT),
    [projects],
  );

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Stack gap={1.5}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
              Compliance calendar
            </Typography>
            <Link component={RouterLink} to="/compliance-calendar" underline="hover">
              <Typography variant="textMd" sx={{ color: "inherit" }}>
                View full calendar
              </Typography>
            </Link>
          </Stack>
          {events.length === 0 ? (
            <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
              Nothing coming up.
            </Typography>
          ) : (
            <Stack gap={0.5}>
              {events.map((event) => (
                <EventRow key={event.id} event={event} dense />
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
