import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLambdaModule } from './app-lambda.module';
import express from 'express';

let cachedApp: NestExpressApplication | null = null;

// On Vercel serverless, always skip Bull/Redis regardless of REDIS_URL.
// Bull's persistent TCP connections hang the event loop in a stateless environment.
const ActiveModule = (process.env.VERCEL || !process.env.REDIS_URL) ? AppLambdaModule : AppModule;

export async function createNestApp(AppModuleClass = ActiveModule): Promise<NestExpressApplication> {
  const expressApp = express();
  
  // Health check endpoint BEFORE app initialization (responds immediately)
  expressApp.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create<NestExpressApplication>(AppModuleClass, adapter, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');

  const isDev = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: isDev
      ? true
      : (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
          if (!origin) return cb(null, true);
          // Allow comma-separated FRONTEND_URL values and all *.vercel.app previews
          const allowed = (process.env.FRONTEND_URL ?? '').split(',').map(u => u.trim()).filter(Boolean);
          if (allowed.some(u => origin.startsWith(u)) || origin.endsWith('.vercel.app')) {
            return cb(null, true);
          }
          cb(new Error(`CORS: ${origin} not allowed`));
        },
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

// Vercel serverless handler — (req, res) style required by @vercel/node
export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await createNestApp();
  }
  cachedApp.getHttpAdapter().getInstance()(req, res);
};
