/// <reference types="vite/client" />

/** Base URL Delcom Open API, disuntikkan melalui `define` pada Vite/Nuxt. */
declare const DELCOM_BASEURL: string;

interface ImportMetaEnv {
  readonly VITE_DELCOM_BASEURL: string;
  readonly APP_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>;
  export default component;
}
