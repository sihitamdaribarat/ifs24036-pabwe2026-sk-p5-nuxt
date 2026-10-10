import type { RouterConfig } from "nuxt/schema";
import { routes } from "./routes";

// Rute aplikasi didefinisikan secara manual di src/routes.ts, menggantikan rute berbasis berkas Nuxt.
export default {
  routes: () => routes,
} satisfies RouterConfig;
