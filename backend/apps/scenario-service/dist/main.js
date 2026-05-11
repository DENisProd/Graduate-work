"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const dotenv_1 = require("dotenv");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const app_module_1 = require("./app.module");
const safe_logger_1 = require("./common/logging/safe-logger");
function parseCorsOrigins(raw, fallback) {
    const parts = (raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return parts.length > 0 ? parts : fallback;
}
async function bootstrap() {
    console.log('join', __dirname);
    (0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, '../../../.env') });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: new safe_logger_1.SafeLogger() });
    const corsOrigins = parseCorsOrigins(process.env.SCENARIO_CORS_ORIGINS ?? process.env.FRONTEND_ORIGIN, ['http://localhost:3000', 'http://localhost:5173']);
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new nestjs_zod_1.ZodValidationPipe());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Scenario Service API')
        .setDescription('API для управления сценариями, устройствами и данными устройств')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.SCENARIO_SERVICE_PORT ?? process.env.PORT ?? 3001;
    console.log('App started at ', port);
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map