import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody is required by SignatureGuard to verify LINE's x-line-signature header
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = process.env.PORT ?? 8080;
  await app.listen(port);
}
bootstrap();
