import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const app = createApp();

  // Fail fast if the database isn't reachable.
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("✅ Database connection OK");
  } catch (err) {
    console.error("❌ Could not connect to the database:", err);
    process.exit(1);
  }

  // Listen on 0.0.0.0 (all interfaces) so a phone on the same WiFi can reach
  // the API via your computer's LAN IP — not just localhost on this machine.
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`🚀 Travel_X API running on ${env.PUBLIC_BASE_URL}`);
    console.log(`   Storage provider: ${env.STORAGE_PROVIDER}`);
    console.log(`   Health: ${env.PUBLIC_BASE_URL}/health`);
    console.log(`   On your phone, use http://<your-LAN-IP>:${env.PORT}`);
  });
}

main();