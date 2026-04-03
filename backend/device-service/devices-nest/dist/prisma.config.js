"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const config_1 = require("@prisma/config");
const dotenv_1 = require("dotenv");
const config = dotenv_1.default.config({ path: (0, path_1.join)(__dirname, "../../.env") });
exports.default = config_1.default.defineConfig({
    datasource: {
        url: config.parsed?.DEVICE_SERVICE_DATABASE_URL ||
            process.env.DEVICE_SERVICE_DATABASE_URL
    }
});
