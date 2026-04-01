"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@prisma/config");
const dotenv_1 = require("dotenv");
const config = dotenv_1.default.config();
exports.default = config_1.default.defineConfig({
    datasource: {
        url: config.parsed?.ACCESS_CONTROL_DB_URL || process.env.ACCESS_CONTROL_DB_URL
    }
});
