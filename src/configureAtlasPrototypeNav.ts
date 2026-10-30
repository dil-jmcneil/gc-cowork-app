import { useEffect } from "react";

/**
 * Injects a small stylesheet into the mock global navigator shadow root so an
 * empty side-nav product header (no app key) does not reserve vertical space.
 */
const STYLE_ID = "atlas-prototype-hide-empty-side-nav-header";

function injectSideNavHeaderStyle(shadow: ShadowRoot): void {
  if (shadow.querySelector(`#${STYLE_ID}`)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    atlas-gn-side-nav header:empty {
      display: none !important;
    }
  `;
  shadow.appendChild(style);
}

function getMockNavigatorShadow(): ShadowRoot | null {
  return (
    document.querySelector("mock-hb-global-navigator")?.shadowRoot ?? null
  );
}

/** Call once from the app shell after mount; waits for the mock navigator to render. */
export function observeAtlasPrototypeNavTweaks(): () => void {
  const tryInject = (): boolean => {
    const shadow = getMockNavigatorShadow();
    if (!shadow) return false;
    injectSideNavHeaderStyle(shadow);
    return true;
  };
  if (tryInject()) return () => {};
  const observer = new MutationObserver(() => {
    if (tryInject()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Atlas `AINavSection` shares one leading slot between the section icon and the
 * expand caret: the icon shows at rest and, on hover/focus, is swapped out for
 * the caret in the same spot. The design instead wants the icon
 * pinned on the LEFT and the caret on the RIGHT at all times (matching the rest
 * of the nav). We adopt a constructable stylesheet into each section's shadow
 * root to always show both, reorder the caret to the trailing edge, and rotate
 * it when the section is open (the mock always renders a "down" glyph).
 */
let aiNavSectionLayoutSheet: CSSStyleSheet | null = null;

function getAiNavSectionLayoutSheet(): CSSStyleSheet {
  if (!aiNavSectionLayoutSheet) {
    aiNavSectionLayoutSheet = new CSSStyleSheet();
    aiNavSectionLayoutSheet.replaceSync(`
      .item { align-items: center; }
      .item .section-icon { display: inline-flex !important; order: 0; }
      .item .label { order: 1; }
      .item .expand-icon {
        display: inline-flex !important;
        order: 2;
        margin-inline-start: auto;
      }
      section.is-open .item .expand-icon { transform: rotate(180deg); }
    `);
  }
  return aiNavSectionLayoutSheet;
}

function applyAiNavSectionLayout(): void {
  const sheet = getAiNavSectionLayoutSheet();
  document.querySelectorAll("atlas-gn-ai-nav-section").forEach((el) => {
    const shadow = (el as HTMLElement).shadowRoot;
    if (shadow && !shadow.adoptedStyleSheets.includes(sheet)) {
      shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
    }
  });
}

/**
 * Keeps every `AINavSection` on the "icon left / caret right, both always
 * visible" layout — re-applying as sections mount. Call once from the app shell.
 */
export function observeAiNavSectionLayout(): () => void {
  applyAiNavSectionLayout();
  const observer = new MutationObserver(() => applyAiNavSectionLayout());
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

function findSideNavElement(): Element | null {
  const host = document.querySelector("mock-hb-global-navigator");
  const shadow = host?.shadowRoot ?? null;
  return shadow?.querySelector("atlas-gn-side-nav") ?? null;
}

/**
 * `atlas-gn-side-nav` renders its product title as
 * `<header><div class="app-name"><h2>…</h2></div></header>` inside its OWN
 * shadow root, so a style injected into the mock navigator shadow can't reach
 * it. We only ever show one app here, so hide that header unconditionally by
 * adopting a constructable stylesheet onto the side-nav's own shadow root —
 * it survives the component's Lit re-renders. Matches the supervisor surface,
 * which hides its side-nav title the same way.
 */
let sideNavHeaderHideSheet: CSSStyleSheet | null = null;

function getSideNavHeaderHideSheet(): CSSStyleSheet {
  if (!sideNavHeaderHideSheet) {
    sideNavHeaderHideSheet = new CSSStyleSheet();
    sideNavHeaderHideSheet.replaceSync("header { display: none !important; }");
  }
  return sideNavHeaderHideSheet;
}

function hideSideNavHeader(): void {
  const shadow = findSideNavElement()?.shadowRoot ?? null;
  if (!shadow) return;
  const sheet = getSideNavHeaderHideSheet();
  if (!shadow.adoptedStyleSheets.includes(sheet)) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
  }
}

/**
 * Expands the global nav side panel when it is collapsed by clicking the
 * header menu toggle (`header button.menu-button`) inside the `atlas-global-nav`
 * shadow root. No-op when the panel is already expanded.
 */
export function expandPrototypeSideNav(): void {
  const bodyCollapsed = document.body.classList.contains("atlas-gn-panel--collapsed");
  const sideNavCompact = findSideNavElement()?.hasAttribute("is-compact") ?? false;
  if (!bodyCollapsed && !sideNavCompact) {
    return;
  }

  const shadow = getMockNavigatorShadow();
  if (!shadow) return;

  type GlobalNavHost = HTMLElement & {
    _isOpen?: boolean;
    requestUpdate?: () => void;
  };

  const globalNav = shadow.querySelector<GlobalNavHost>("atlas-global-nav");
  const menuButton = globalNav?.shadowRoot?.querySelector<HTMLButtonElement>(
    "header button.menu-button",
  );

  if (menuButton) {
    menuButton.click();
    return;
  }

  if (globalNav) {
    globalNav._isOpen = true;
    globalNav.requestUpdate?.();
  }
}

/**
 * Sets the `app-key` attribute on the inner `atlas-gn-side-nav` element so the
 * side-nav product title reflects the current app. `<atlas-gn-side-nav>` lives
 * inside the mock navigator's shadow root, so mutations there don't reach a
 * document-level observer; observe the shadow root once it exists.
 */
export function useSideNavAppKey(appKey: string): void {
  useEffect(() => {
    let innerObserver: MutationObserver | null = null;

    const apply = () => {
      const sideNav = findSideNavElement();
      if (sideNav && sideNav.getAttribute("app-key") !== appKey) {
        sideNav.setAttribute("app-key", appKey);
      }
      hideSideNavHeader();
    };

    const ensureInnerObserver = (): boolean => {
      if (innerObserver) return true;
      const shadow = getMockNavigatorShadow();
      if (!shadow) return false;
      innerObserver = new MutationObserver(apply);
      innerObserver.observe(shadow, { childList: true, subtree: true });
      apply();
      return true;
    };

    if (ensureInnerObserver()) return () => innerObserver?.disconnect();

    const outerObserver = new MutationObserver(() => {
      if (ensureInnerObserver()) outerObserver.disconnect();
    });
    outerObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      outerObserver.disconnect();
      innerObserver?.disconnect();
    };
  }, [appKey]);
}
