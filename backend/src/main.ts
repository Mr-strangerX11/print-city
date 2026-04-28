import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

let cachedApp: NestExpressApplication | null = null;

export async function createNestApp(): Promise<NestExpressApplication> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');

  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: isDev
      ? true
      : (process.env.FRONTEND_URL ?? 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AP API')
    .setDescription('AP — Custom Print Marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.init();
  return app;
}

// Lambda/Vercel serverless handler
export default async () => {
  if (!cachedApp) {
    cachedApp = await createNestApp();
  }
  return cachedApp.getHttpAdapter().getInstance();
};
