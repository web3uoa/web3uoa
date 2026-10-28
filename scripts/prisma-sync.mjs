import "dotenv/config";
import { spawnSync } from "node:child_process";

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  console.log("Skipping prisma db push (DATABASE_URL is not set)");
  process.exit(0);
}

const normalizedUrl = rawUrl.trim().replace(/^['\"]+|['\"]+$/g, "");

let parsed;
try {
  parsed = new URL(normalizedUrl);
} catch {
  console.error(
    "Invalid DATABASE_URL format. Check for extra quotes or illegal characters.",
  );
  process.exit(1);
}

if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
  console.error(
    `Unsupported DATABASE_URL protocol: ${parsed.protocol}. Expected postgresql:// or postgres://`,
  );
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  command,
  ["prisma", "db", "push", "--url", normalizedUrl],
  {
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
