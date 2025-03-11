import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: 'single',
        url: configService.get('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppRedisModule {}
