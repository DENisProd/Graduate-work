import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-User-Id', 'Accept-Language'],
  });
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'api/docs', 'api/docs/(.*)'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Access Control Service API')
    .setDescription(
      'Операции от имени пользователя требуют заголовок **X-User-Id** (внешний UUID). В Swagger UI нажмите **Authorize**, введите UUID — значение будет подставляться во все запросы.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-User-Id',
        description: 'Внешний идентификатор пользователя (UUID), тот же, что после авторизации в gateway.',
      },
      'X-User-Id',
    )
    .addSecurityRequirements('X-User-Id')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.ACCESS_CONTROL_SERVICE_PORT ?? 8085;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();

