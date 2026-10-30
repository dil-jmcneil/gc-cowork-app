import { AppLayout } from "@diligentcorp/atlas-react-bundle";
import { LoginGate } from "./auth/LoginGate.js";
import { useEffect, useLayoutEffect } from "react";
import { Outlet, Route, Routes } from "react-router";
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
import IndexPage from "./pages/IndexPage.js";
import NewChatPage from "./pages/NewChatPage.js";
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
      </Route>
      </Routes>
    </LoginGate>
  );
}

function Shell() {
  useSideNavAppKey("launchpad");

  return (
    <AppLayout
      orgName="Acme Co, Inc."
      logo="/acme-logo.png"
      userFullName={LOGGED_IN_USER.fullName}
      navigation={<CommandCenterNavigation />}
    >
      <Outlet />
      <DemoSettingsFab />
    </AppLayout>
  );
}
