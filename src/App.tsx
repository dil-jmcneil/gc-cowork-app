import { AppLayout } from "@diligentcorp/atlas-react-bundle";
import { Typography } from "@mui/material";
import { useEffect } from "react";
import "./styles.css";

import { DemoSettingsFab } from "./components/demo/DemoSettingsFab.js";
import { useThemeVariantStore } from "./demo/themeVariantStore.js";
import { LOGGED_IN_USER } from "./user.js";

/** Body class the "Refreshed" CSS token overrides in styles.css key off. */
const REFRESHED_BODY_CLASS = "refreshed-tokens";

function useThemeVariantBodyClass(): void {
  const variant = useThemeVariantStore((s) => s.variant);
  useEffect(() => {
    document.body.classList.toggle(REFRESHED_BODY_CLASS, variant === "refreshed");
    return () => {
      document.body.classList.remove(REFRESHED_BODY_CLASS);
    };
  }, [variant]);
}

export default function App() {
  useThemeVariantBodyClass();

  return (
    <AppLayout
      orgName="Acme Co, Inc."
      logo="/acme-logo.png"
      userFullName={LOGGED_IN_USER.fullName}
      navigation={null}
    >
      <Typography variant="h3">GC Cowork</Typography>
      <DemoSettingsFab />
    </AppLayout>
  );
}
