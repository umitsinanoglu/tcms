import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseEnv } from './db-env';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const config = resolveDatabaseEnv();
    super({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    const config = resolveDatabaseEnv();
    this.logger.log(
      `🌐 Connecting to [${config.environment}] database: ${config.databaseUrl.replace(/:([^@]+)@/, ':****@')}`
    );
    await this.$connect();
    this.logger.log(`✅ Successfully connected to [${config.environment}] database.`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

