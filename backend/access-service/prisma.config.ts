import prisma from "@prisma/config";
import dotenv from "dotenv";

const config = dotenv.config();
export default prisma.defineConfig({
  datasource: {
    url: config.parsed?.ACCESS_CONTROL_DB_URL || process.env.ACCESS_CONTROL_DB_URL
  }
});