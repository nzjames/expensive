import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle/migrations",   // migration files live here
  dbCredentials: {
    url: "./sqlite.db"           // path to your sqlite file
  },
});