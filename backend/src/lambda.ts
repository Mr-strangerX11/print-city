import { createNestApp } from './main';
import type { Request, Response } from 'express';

let cachedServer: any = null;

export default async (req: Request, res: Response) => {
  if (!cachedServer) {
    const app = await createNestApp();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  cachedServer(req, res);
};
