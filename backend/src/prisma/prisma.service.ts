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

    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log(`✅ Successfully connected to [${config.environment}] database.`);
        return;
      } catch (err: any) {
        retries--;
        this.logger.warn(`⚠️ Database connection attempt failed (${err.message}). Retries remaining: ${retries}`);
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

