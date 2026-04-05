import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  loadEnv({ path: join(__dirname, '../../.env') });
  const port = Number(process.env.DEVICE_SERVICE_PORT ?? process.env.PORT ?? 3000);

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Device Service API')
    .setDescription(
      [
        'Сервис каталога устройств: типы, категории, устройства, функции и действия.',
        '',
        'Публичные маршруты — только чтение и мягкое удаление; префикс **/api/v1/admin/** — полный CRUD.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Локальная разработка (DEVICE_SERVICE_PORT)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
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
