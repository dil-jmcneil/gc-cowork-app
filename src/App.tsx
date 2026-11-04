import { AppLayout } from "@diligentcorp/atlas-react-bundle";
import { Box } from "@mui/material";
import { LoginGate } from "./auth/LoginGate.js";
import { useEffect, useLayoutEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router";
import "./styles.css";

import CommandCenterNavigation from "./CommandCenterNavigation.js";
import {
  observeAiNavSectionLayout,
  observeAtlasPrototypeNavTweaks,
  useSideNavAppKey,
} from "./configureAtlasPrototypeNav.js";
import { DemoSettingsFab } from "./components/demo/DemoSettingsFab.js";
import { useThemeVariantStore } from "./demo/themeVariantStore.js";
import ChatPage from "./pages/ChatPage.js";
import ComplianceCalendarPage from "./pages/ComplianceCalendarPage.js";
import CreateWorkstreamPage from "./pages/CreateWorkstreamPage.js";
import IndexPage from "./pages/IndexPage.js";
import NewChatPage from "./pages/NewChatPage.js";
import WorkstreamPage, { DraftWorkstreamPage } from "./pages/WorkstreamPage.js";
import { useMvpScopeStore } from "./demo/mvpScopeStore.js";
import TaskRoute from "./pages/TaskRoute.js";
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
  useLayoutEffect(() => observeAtlasPrototypeNavTweaks(), []);
  useLayoutEffect(() => observeAiNavSectionLayout(), []);
  useThemeVariantBodyClass();

  return (
    <LoginGate>
      <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<IndexPage />} />
        <Route path="chats/new" element={<NewChatPage />} />
        <Route path="chats/:chatId" element={<ChatPage />} />
        <Route path="workstreams/new" element={<NewWorkstreamRoute />} />
        <Route path="workstreams/:workstreamId" element={<WorkstreamPage />} />
        <Route path="workstreams/:workstreamId/tasks/:taskId" element={<TaskRoute />} />
        <Route path="compliance-calendar" element={<ComplianceCalendarPage />} />
      </Route>
      </Routes>
    </LoginGate>
  );
}

/** MVP: a new signal opens Cowork's draft on the workstream page. The create page comes back with post-MVP views on. */
function NewWorkstreamRoute() {
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  return showPostMvpViews ? <CreateWorkstreamPage /> : <DraftWorkstreamPage />;
}

function Shell() {
  useSideNavAppKey("launchpad");
  const { pathname } = useLocation();
  // Every workstream page, draft or started, has Cowork's chat on the right.
  const hasSideChat = pathname.startsWith("/workstreams/");

  return (
    <AppLayout
      orgName="Acme Co, Inc."
      logo="/acme-logo.png"
      userFullName={LOGGED_IN_USER.fullName}
      navigation={<CommandCenterNavigation />}
    >
      {/* Own stacking context, so content with a z-index (like the home hero) scrolls under the header. */}
      <Box sx={{ isolation: "isolate" }}>
        <Outlet />
      </Box>
      <DemoSettingsFab offsetBottom={hasSideChat ? 120 : 24} />
    </AppLayout>
  );
}
