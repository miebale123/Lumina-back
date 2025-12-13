import { Controller, Get, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { configuration } from './config/app.config';
import { typeOrmConfig } from './config/typeorm.config';
import { Public } from './common';
import { UsersModule, AdminModule, AuditModule, HousesModule } from './';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuthModule } from './auth';
import { SettingsModule } from './settings.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { BrokersModule } from './brokers/brokers.module';
import { NotificationsModule } from './notifications/notifications.module';

@Controller('/')
class AppController {
  @Public()
  @Get()
  root() {
    return { message: 'hello this is root access' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [configuration.KEY],
      useFactory: typeOrmConfig,
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: () => randomUUID(),
        level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss',
                  ignore: 'pid,hostname',
                },
              },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),

    ThrottlerModule.forRoot({
      throttlers: [],
    }),
    AuthModule,
    UsersModule,
    AdminModule,
    AuditModule,
    SettingsModule,
    HousesModule,
    BookmarksModule,
    BrokersModule,
    NotificationsModule
  ],
  providers: [
    GlobalExceptionFilter,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
