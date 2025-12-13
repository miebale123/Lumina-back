import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import type { ConfigType } from '@nestjs/config';
import { configuration } from './config/app.config';
import { AppModule } from './app.module';
import { AdminSeederService } from './admin/admin-seeder.service';
import { GlobalZodPipe } from './zod.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get<ConfigType<typeof configuration>>(configuration.KEY);

  app.enableCors({
    // origin: [config.frontEndLive, config.frontEndLocal],
    origin: ['http://localhost:4200', 'http://localhost:4201'],

    credentials: true,
  });
  app.enableShutdownHooks();

  app.use(helmet());
  app.use(cookieParser());
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new GlobalZodPipe());
  app.useGlobalFilters(app.get(GlobalExceptionFilter));

  const seeder = app.get(AdminSeederService);
  await seeder.createDefaultAdmin();

  await app.listen(config.port ?? 4444, '0.0.0.0');
}
bootstrap().catch((err) => console.log(err));
