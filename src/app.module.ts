import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramService } from './telegram/telegram.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { AppRedisModule } from './redis/redis.module';

@Module({
  imports: [
    TelegramModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AppRedisModule,
  ],
  controllers: [AppController, TelegramController],
  providers: [AppService, TelegramService],
})
export class AppModule {}
