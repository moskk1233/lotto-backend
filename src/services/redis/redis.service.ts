import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { type Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient;
  private logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });

    this.client.on('connect', () => this.logger.log('Redis Connected'));
    this.client.on('error', (err) => this.logger.error(err.message));
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis Disconnected');
  }

  async set(key: string, value: string, ttl: number) {
    await this.client.setex(key, ttl, value);
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async exists(key: string) {
    return await this.client.exists(key);
  }
}
