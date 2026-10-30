import { Box, Container, Stack, Typography, useTheme } from "@mui/material";

import { ComplianceCalendar, FullCalendarLink } from "@/components/calendar/ComplianceCalendar";
import { PrototypeHomeComposer } from "@/components/chat/PrototypeHomeComposer";
import { AttentionPane } from "@/components/home/AttentionPane";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { LOGGED_IN_USER } from "@/user";

export default function IndexPage() {
  return (
    <Container maxWidth={false} sx={{ maxWidth: 960, py: 5, mx: "auto", px: { xs: 2, sm: 3 } }}>
      <Stack gap={4}>
        <LongTermHero />
        <Stack gap={2} sx={{ width: "100%" }}>
          <PrototypeHomeComposer />
          <HomeQuickActions />
        </Stack>
        <AttentionPane />
        <ComplianceCalendar variant="widget" headerAction={<FullCalendarLink />} />
      </Stack>
    </Container>
  );
}

/** Diligent brand red for the hero lockup mark. */
const DILIGENT_RED = "#D4232A";

/** Serif font for the hero headline. */
const HERO_FONT = 'Merriweather, "Iowan Old Style", "Palatino Linotype", Georgia, serif';


/** Centered Diligent logo lockup (red "D" mark + wordmark). */
function DiligentHeroLogo() {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={1.25} aria-label="Diligent">
      <Box
        component="svg"
        viewBox="0 0 36 44"
        aria-hidden
        sx={{ width: 30, height: 37, display: "block" }}
      >
        <path d="M2 2 H14 A20 20 0 0 1 14 42 H2 Z" fill={DILIGENT_RED} />
      </Box>
      <Typography
        component="span"
        sx={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.015em",
          lineHeight: 1,
          color: tokens.semantic.color.type.default.value,
        }}
      >
        Diligent
      </Typography>
    </Stack>
  );
}

function StaticPlateHeadline() {
  const { tokens } = useTheme();

  return (
    <Typography
      component="h1"
      align="center"
      sx={{
        fontFamily: HERO_FONT,
        fontWeight: 400,
        fontSize: { xs: "2rem", sm: "2.4rem", md: "2.75rem" },
        lineHeight: 1.15,
        color: tokens.semantic.color.type.default.value,
      }}
    >
      What's on your plate,{" "}
      <Box component="span" sx={{ fontWeight: 700 }}>
        {LOGGED_IN_USER.firstName}
      </Box>
      ?
    </Typography>
  );
}

function LongTermHero() {
  return (
    <Stack
      alignItems="center"
      gap={2.5}
      sx={{
        pt: { xs: 4, md: 7 },
        pb: { xs: 1, md: 2 },
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: 300, sm: 500, md: 700 },
          height: { xs: 300, sm: 500, md: 700 },
          background:
            "radial-gradient(circle, rgba(233, 231, 252, 0.4) 0%, rgba(233, 231, 252, 0.2) 30%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <DiligentHeroLogo />
      </Box>
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <StaticPlateHeadline />
      </Box>
    </Stack>
  );
}
