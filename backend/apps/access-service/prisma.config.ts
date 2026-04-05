import { join } from "path";
import prisma from "@prisma/config";
import dotenv from "dotenv";

console.log('join', join(__dirname, "../../.env"));
const config = dotenv.config({ path: join(__dirname, "../../.env") });
export default prisma.defineConfig({
  datasource: {
    url: config.parsed?.ACCESS_CONTROL_DB_URL || process.env.ACCESS_CONTROL_DB_URL
  }
});