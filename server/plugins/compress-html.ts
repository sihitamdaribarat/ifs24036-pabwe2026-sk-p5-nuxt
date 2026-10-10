import { gzipSync } from "node:zlib";
import { getRequestHeader } from "h3";

// Nitro hanya mengompresi aset statis (compressPublicAssets); dokumen HTML yang
// dirender dikompresi di sini (Lighthouse: "Enable text compression").
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:response", (response, { event }) => {
    const acceptEncoding = getRequestHeader(event, "accept-encoding") ?? "";
    if (typeof response.body !== "string" || !acceptEncoding.includes("gzip")) {
      return;
    }
    response.body = gzipSync(response.body);
    response.headers = {
      ...response.headers,
      "content-encoding": "gzip",
      vary: "Accept-Encoding",
    };
  });
});
