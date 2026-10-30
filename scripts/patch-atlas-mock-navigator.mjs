/**
 * Patches the @diligentcorp/atlas-react-bundle prototype mock navigator. Idempotent.
 *
 * - App title "Home" → "GC Cowork".
 * - MockNavigator default appKey: "launchpad".
 * - SideNav: no homepageUrl ("< Home (Platform)" link).
 * - User menu: showBackToOldNavigation off.
 * - Honor orgName / logo / userFullName props React assigns as properties.
 * - Busts the Vite pre-bundle cache so the dev server picks up the patched dist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const indexPath = path.join(
  projectRoot,
  "node_modules/@diligentcorp/atlas-react-bundle/dist/index.js",
);
const viteDepsDir = path.join(projectRoot, "node_modules/.vite");

if (!fs.existsSync(indexPath)) {
  console.warn("[patch-atlas-mock-navigator] Bundle not installed yet; skipping.");
  process.exit(0);
}

let source = fs.readFileSync(indexPath, "utf8");
const before = source;

function applyEither(from, to, label) {
  if (source.includes(to)) return;
  if (source.includes(from)) {
    source = source.replace(from, to);
    return;
  }
  console.error(
    `[patch-atlas-mock-navigator] ${label}: neither expected snippet found. Bundle may have changed.`,
  );
  process.exit(1);
}

applyEither(
  'LAUNCHPAD: item("launchpad", () => msg(`Home`, { desc: "App name" })',
  'LAUNCHPAD: item("launchpad", () => msg(`GC Cowork`, { desc: "App name" })',
  "LAUNCHPAD App-name label",
);

const desiredAppKey = `  appKey = "launchpad"`;
if (!source.includes(desiredAppKey)) {
  if (source.includes(`  appKey = "boards-cloud"`)) {
    source = source.replace(`  appKey = "boards-cloud"`, desiredAppKey);
  } else {
    console.error(
      "[patch-atlas-mock-navigator] MockNavigator default appKey: expected snippet not found.",
    );
    process.exit(1);
  }
}

applyEither(
  '/* @__PURE__ */ jsx2(SideNav2, { slot: "side-nav", appKey, homepageUrl: "https://www.diligent.com", children })',
  '/* @__PURE__ */ jsx2(SideNav2, { slot: "side-nav", appKey, children })',
  "SideNav homepageUrl removal",
);

applyEither(
  `          showBackToOldNavigation: true,`,
  `          showBackToOldNavigation: false,`,
  "showBackToOldNavigation flag",
);

// React 19 sets camelCase props on custom elements as JS properties; without
// this fallback orgName / logo / userFullName passed via <AppLayout> are ignored.
applyEither(
  `    this.orgName = this.getAttribute("orgName") || DEFAULT_ORG_NAME;
    this.logo = this.getAttribute("logo") || DEFAULT_LOGO;
    this.userFullName = this.getAttribute("userFullName") || DEFAULT_USER_FULL_NAME;`,
  `    this.orgName = this.getAttribute("orgName") || this.orgName || DEFAULT_ORG_NAME;
    this.logo = this.getAttribute("logo") || this.logo || DEFAULT_LOGO;
    this.userFullName = this.getAttribute("userFullName") || this.userFullName || DEFAULT_USER_FULL_NAME;`,
  "MockHbGlobalNavigator.connectedCallback prop fallback",
);

if (source === before) {
  console.log("[patch-atlas-mock-navigator] dist/index.js already up to date.");
} else {
  fs.writeFileSync(indexPath, source, "utf8");
  console.log("[patch-atlas-mock-navigator] Patched", path.relative(process.cwd(), indexPath));
}

if (fs.existsSync(viteDepsDir)) {
  fs.rmSync(viteDepsDir, { recursive: true, force: true });
  console.log(
    "[patch-atlas-mock-navigator] Cleared Vite pre-bundle cache:",
    path.relative(process.cwd(), viteDepsDir),
  );
}
