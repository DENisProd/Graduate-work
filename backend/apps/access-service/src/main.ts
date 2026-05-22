import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';
import { ErrorResponse } from './modules/common/dto/error-response.dto';

function parseCorsOrigins(raw: string | undefined, fallback: string[]): string[] {
  const parts = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

async function bootstrap() {
  loadEnv({ path: join(process.cwd(), '../../.env') });
  const port = Number(process.env.ACCESS_CONTROL_SERVICE_PORT ?? 8085);

  const corsOrigins = parseCorsOrigins(process.env.ACCESS_CORS_ORIGINS, [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
  ]);

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-User-Id',
      'X-User-Display-Name',
      'Accept-Language',
    ],
  });
  app.setGlobalPrefix('api/access/v1', { exclude: ['health', 'docs', 'docs/(.*)'] });
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
      [
        'Сервис контроля доступа к домам, комнатам, ресурсам и правам (RBAC/ABAC).',
        '',
        '**Аутентификация в UI:** операции от имени пользователя ожидают заголовок **X-User-Id** (внешний UUID пользователя). В Swagger UI нажмите **Authorize**, введите UUID — значение подставится в запросы.',
        '',
        'Опционально: **X-User-Display-Name** (URL-encoded имя из Keycloak) — сохраняется в профиле пользователя для списков участников.',
        '',
        'Тело ошибок соответствует схеме **ErrorResponse** (HTTP 4xx/5xx).',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Локальная разработка (ACCESS_CONTROL_SERVICE_PORT)')
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
    .addTag('Device types', 'Каталог: типы устройств')
    .addTag('Device categories', 'Каталог: категории устройств')
    .addTag('Devices', 'Каталог: устройства')
    .addTag('Device functions', 'Каталог: функции устройств')
    .addTag('Device function actions', 'Каталог: действия функций устройств')
    .addTag('Admin — device types', 'Админ: типы устройств')
    .addTag('Admin — device categories', 'Админ: категории устройств')
    .addTag('Admin — devices', 'Админ: устройства')
    .addTag('Admin — device functions', 'Админ: функции устройств')
    .addTag('Admin — device function actions', 'Админ: действия функций')
    .addTag('Integration', 'Межсервисная интеграция: ensure каталога')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponse],
  });
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/v1`);
  console.log(`CORS origins: ${corsOrigins.join(', ')}`);
}

bootstrap();

