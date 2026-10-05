import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost/baela",
  },
});
