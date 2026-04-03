import { join } from "path";
import prisma from "@prisma/config";
import dotenv from "dotenv";

const config = dotenv.config({ path: join(__dirname, "../../.env") });
export default prisma.defineConfig({
  datasource: {
    url:
      config.parsed?.DEVICE_SERVICE_DATABASE_URL ||
      process.env.DEVICE_SERVICE_DATABASE_URL
  }
});
