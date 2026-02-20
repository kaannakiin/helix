import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE_NAME } from '@org/constants';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api');

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    })
  );

  app.use(cookieParser());

  app.enableCors({
    origin: isProduction ? config.getOrThrow<string>('CORS_ORIGIN') : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'x-lang',
    ],
  });

  app.set('trust proxy', 1);

  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' });

  app.enableShutdownHooks();

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Helix API')
      .setDescription('Helix Backend API Documentation')
      .setVersion('1.0')
      .addCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document), {
      useGlobalPrefix: false,
    });
  }

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);

  Logger.log(`Application is running on: http://localhost:${port}/api`);
  if (!isProduction) {
    Logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
