//import { execSync } from "node:child_process";
//import fs from "node:fs";

const { execSync } = require("child_process");

const ua = process.env.npm_config_user_agent || "";

// Skip check if user agent isn't set (can happen in some shell environments)
// Assume user is running pnpm if this is reached during install
if (ua && !ua.startsWith("pnpm/")) {
  console.error("❌ Use pnpm instead of npm or yarn");
  process.exit(1);
}

// Clean up other lockfiles
try {
  execSync("del package-lock.json yarn.lock", { stdio: "ignore", shell: "cmd.exe" });
} catch {
  // ignore if files don't exist
}