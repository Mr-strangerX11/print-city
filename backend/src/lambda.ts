import { createNestApp } from './main';
import { AppLambdaModule } from './app-lambda.module';
import type { Request, Response } from 'express';

let cachedHandler: any = null;

export default async (req: Request, res: Response) => {
  if (!cachedHandler) {
    const app = await createNestApp(AppLambdaModule);
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  cachedHandler(req, res);
};
