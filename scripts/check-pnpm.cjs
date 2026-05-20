//import { execSync } from "node:child_process";
//import fs from "node:fs";

const fs = require("fs");

const ua = process.env.npm_config_user_agent || "";

// Skip check if user agent isn't set (can happen in some shell environments)
// Assume user is running pnpm if this is reached during install
if (ua && !ua.startsWith("pnpm/")) {
  console.error("❌ Use pnpm instead of npm or yarn");
  process.exit(1);
}

// Cross-platform cleanup
["package-lock.json", "yarn.lock"].forEach(file => {
  try {
    fs.unlinkSync(file);
  } catch {
    // ignore if files don't exist
  }
});