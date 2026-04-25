"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const dotenv_1 = require("dotenv");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    (0, dotenv_1.config)({ path: (0, path_1.join)(process.cwd(), '../../.env') });
    const port = Number(process.env.DEVICE_SERVICE_PORT ?? process.env.PORT ?? 3000);
    console.log("PORT", port);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000'],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-User-Id',
            'Accept',
        ],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Device Service API')
        .setDescription([
        'Сервис каталога устройств: типы, категории, устройства, функции и действия.',
        '',
        'Публичные маршруты — только чтение и мягкое удаление; префикс **/api/v1/admin/** — полный CRUD.',
    ].join('\n'))
        .setVersion('1.0')
        .addServer(`http://localhost:${port}`, 'Локальная разработка (DEVICE_SERVICE_PORT)')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
        },
    });
    await app.listen(port);
}
bootstrap();
