"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const dotenv_1 = require("dotenv");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./modules/common/filters/http-exception.filter");
const error_response_dto_1 = require("./modules/common/dto/error-response.dto");
async function bootstrap() {
    (0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, '../../.env') });
    const port = Number(process.env.ACCESS_CONTROL_SERVICE_PORT ?? 8085);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:8080'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-User-Id', 'Accept-Language'],
    });
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'api/docs', 'api/docs/(.*)'] });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Access Control Service API')
        .setDescription([
        'Сервис контроля доступа к домам, комнатам, ресурсам и правам (RBAC/ABAC).',
        '',
        '**Аутентификация в UI:** операции от имени пользователя ожидают заголовок **X-User-Id** (внешний UUID пользователя). В Swagger UI нажмите **Authorize**, введите UUID — значение подставится в запросы.',
        '',
        'Тело ошибок соответствует схеме **ErrorResponse** (HTTP 4xx/5xx).',
    ].join('\n'))
        .setVersion('1.0')
        .addServer(`http://localhost:${port}`, 'Локальная разработка (ACCESS_CONTROL_SERVICE_PORT)')
        .addApiKey({
        type: 'apiKey',
        in: 'header',
        name: 'X-User-Id',
        description: 'Внешний идентификатор пользователя (UUID), тот же, что после авторизации в gateway.',
    }, 'X-User-Id')
        .addSecurityRequirements('X-User-Id')
        .addTag('Users', 'Пользователи (связь внешнего userId с записью в сервисе)')
        .addTag('Houses', 'Дома: CRUD и списки по пользователю')
        .addTag('Admin Houses', 'Админ: обзор домов')
        .addTag('House Members', 'Участники домов')
        .addTag('House Rooms', 'Комнаты в доме')
        .addTag('House Roles', 'Роли дома и назначение ролей участникам')
        .addTag('House Invitations', 'Приглашения в дом')
        .addTag('Policies', 'Политики ABAC')
        .addTag('Resources', 'Ресурсы и дерево ресурсов дома')
        .addTag('Access Rights', 'Явные права доступа и структура доступа')
        .addTag('Audit', 'Журнал аудита')
        .addTag('Access Evaluation', 'Проверка доступа к ресурсу / функции устройства')
        .addTag('Access Control', 'Права дома и проверка доступа (legacy API)')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        extraModels: [error_response_dto_1.ErrorResponse],
    });
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
        },
    });
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
