import { Container } from "@mui/material";

import { ComplianceCalendar } from "@/components/calendar/ComplianceCalendar";
import { SPACE } from "@/lib/layout";

export default function ComplianceCalendarPage() {
  return (
    <Container maxWidth={false} sx={{ py: SPACE.section, px: { xs: 2, md: 4 } }}>
      <ComplianceCalendar variant="page" />
    </Container>
  );
}
