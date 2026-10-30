import "@diligentcorp/atlas-react-bundle/lib/index.d.ts";

declare global {
  interface ImportMetaEnv {
    readonly VITE_AUTH_USERNAME?: string;
    readonly VITE_AUTH_PASSWORD?: string;
  }
}
