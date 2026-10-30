import { Container } from "@mui/material";

import { ComplianceCalendar } from "@/components/calendar/ComplianceCalendar";

export default function ComplianceCalendarPage() {
  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <ComplianceCalendar variant="page" />
    </Container>
  );
}
