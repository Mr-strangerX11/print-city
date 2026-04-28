import { join } from 'path';
import { mkdir } from 'fs/promises';
import { createNestApp } from './main';

async function bootstrap() {
  const app = await createNestApp();

  const uploadsDir = join(process.cwd(), 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  const port = process.env.API_PORT ?? 4000;
  await app.getHttpAdapter().getHttpServer().listen(port);
  console.log(`API running on http://localhost:${port}/api`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
