import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/server/db/schema.ts",
  out: "./.drizzle/migrations",   // migration files live here
  dbCredentials: {
    url: process.env.DATABASE_URL || "./expense-dev.db"           // path to your sqlite file
  },
});
