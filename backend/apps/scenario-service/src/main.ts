import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { SafeLogger } from './common/logging/safe-logger';

function parseCorsOrigins(raw: string | undefined, fallback: string[]): string[] {
  const parts = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

async function bootstrap() {
  console.log('join', __dirname);
  loadEnv({ path: join(__dirname, '../../../.env') });
  const app = await NestFactory.create(AppModule, { logger: new SafeLogger() });

  const corsOrigins = parseCorsOrigins(
    process.env.SCENARIO_CORS_ORIGINS ?? process.env.FRONTEND_ORIGIN,
    ['http://localhost:3000', 'http://localhost:5173'],
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('v1', {
    exclude: ['docs', 'docs-json', 'docs-yaml'],
  });
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Scenario Service API')
    .setDescription(
      'API для управления сценариями, устройствами и данными устройств',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.SCENARIO_SERVICE_PORT ?? process.env.PORT ?? 3001;
  console.log('App started at ', port);
  await app.listen(port);
}

void bootstrap();
