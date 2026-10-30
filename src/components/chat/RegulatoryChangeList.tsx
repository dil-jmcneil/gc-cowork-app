import CalendarIcon from "@diligentcorp/atlas-react-bundle/icons/Calendar";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";

import type {
  RegulatoryChange,
  RegulatoryChangeStatus,
} from "@/regulatory/regulatoryChange";

const STATUS_COLOR: Record<
  RegulatoryChangeStatus,
  "information" | "warning" | "subtle"
> = {
  New: "information",
  "In review": "warning",
  Upcoming: "subtle",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

export function RegulatoryChangeList({ items }: { items: RegulatoryChange[] }) {
  return (
    <Stack component="ul" gap={1.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {items.map((change) => (
        <Box component="li" key={change.id}>
          <RegulatoryChangeCard change={change} />
        </Box>
      ))}
    </Stack>
  );
}

function RegulatoryChangeCard({ change }: { change: RegulatoryChange }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  return (
    <Card>
      <CardHeader
        title={
          <Stack gap={0.75}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <StatusIndicator
                color={STATUS_COLOR[change.status]}
                label={change.status}
              />
              <Typography variant="textSm" sx={{ color: muted, fontWeight: emphasis }}>
                {change.regulatoryBody}
              </Typography>
            </Stack>
            <Typography variant="h4" component="h3" sx={{ fontWeight: emphasis }}>
              {change.title}
            </Typography>
          </Stack>
        }
      />
      <CardContent>
        <Stack gap={2}>
          <Typography variant="textMd">{change.summary}</Typography>

          <Detail label="Effective">
            <Typography variant="textMd">{formatDate(change.effectiveDate)}</Typography>
          </Detail>

          <Detail label={change.deadlines.length === 1 ? "Deadline" : "Deadlines"}>
            {change.deadlines.map((deadline) => (
              <Typography key={deadline.label} variant="textMd">
                {deadline.label} · {formatDate(deadline.date)}
              </Typography>
            ))}
          </Detail>

          <Stack gap={0.5}>
            <Typography variant="textSm" sx={{ fontWeight: emphasis }}>
              Why it matters
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {change.reasonsRelevant.map((reason) => (
                <Typography component="li" variant="textMd" key={reason}>
                  {reason}
                </Typography>
              ))}
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" gap={1.5} alignItems="flex-start">
      <Box sx={{ color: tokens.semantic.color.type.muted.value, display: "flex", pt: 0.25 }}>
        <CalendarIcon aria-hidden />
      </Box>
      <Stack gap={0.25}>
        <Typography variant="textSm" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
          {label}
        </Typography>
        {children}
      </Stack>
    </Stack>
  );
}
