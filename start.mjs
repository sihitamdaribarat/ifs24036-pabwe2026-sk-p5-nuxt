import { spawn } from "child_process";
import { existsSync } from "fs";
import { config } from "dotenv";

config();

const port = process.env.APP_PORT || process.env.PORT || 3000;
process.env.PORT = port;

// Jalankan server hasil build secara langsung (lebih cepat siap daripada `npx nuxt preview`),
// sehingga jeda 502 saat redeploy menjadi sesingkat mungkin.
const serverEntry = ".output/server/index.mjs";
const [command, args] = existsSync(serverEntry)
  ? ["node", [serverEntry]]
  : ["npx", ["nuxt", "preview", "--port", port]];

console.log(`Menjalankan Nuxt pada port ${port} (${command} ${args.join(" ")})...`);

const server = spawn(command, args, {
  stdio: "inherit",
  shell: command === "npx",
  env: process.env,
});

server.on("close", (code) => {
  process.exit(code);
});
