import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { WorkerAppModule } from './app.module';

export async function bootstrapWorker() {
  const app = await NestFactory.create<NestExpressApplication>(WorkerAppModule, new ExpressAdapter(), {
    abortOnError: false,
    logger: ['error', 'warn'],
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.set('trust proxy', true);
  await app.listen(3000);
  return app;
}
