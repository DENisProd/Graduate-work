"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./modules/common/filters/http-exception.filter");
async function bootstrap() {
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
        .setDescription('Операции от имени пользователя требуют заголовок **X-User-Id** (внешний UUID). В Swagger UI нажмите **Authorize**, введите UUID — значение будет подставляться во все запросы.')
        .setVersion('1.0')
        .addApiKey({
        type: 'apiKey',
        in: 'header',
        name: 'X-User-Id',
        description: 'Внешний идентификатор пользователя (UUID), тот же, что после авторизации в gateway.',
    }, 'X-User-Id')
        .addSecurityRequirements('X-User-Id')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = process.env.ACCESS_CONTROL_SERVICE_PORT ?? 8085;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
