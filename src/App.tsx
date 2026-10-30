import { AppLayout } from "@diligentcorp/atlas-react-bundle";
import { Typography } from "@mui/material";
import "./styles.css";

import { LOGGED_IN_USER } from "./user.js";

export default function App() {
  return (
    <AppLayout
      orgName="Acme Co, Inc."
      logo="/acme-logo.png"
      userFullName={LOGGED_IN_USER.fullName}
      navigation={null}
    >
      <Typography variant="h3">GC Cowork</Typography>
    </AppLayout>
  );
}
