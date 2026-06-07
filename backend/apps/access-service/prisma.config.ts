import { join } from "path";
import prisma from "@prisma/config";
import dotenv from "dotenv";

// Local dev: backend/.env
dotenv.config({ path: join(__dirname, "../../.env") });

/**
 * Used only when `prisma generate` runs without env (e.g. Docker build).
 * Prisma does not connect to the database during generate.
 */
const GENERATE_PLACEHOLDER =
  "postgresql://generate:generate@127.0.0.1:5432/generate?schema=public";

export default prisma.defineConfig({
  datasource: {
    url:
      process.env.ACCESS_CONTROL_DB_URL ??
      GENERATE_PLACEHOLDER,
  },
});
