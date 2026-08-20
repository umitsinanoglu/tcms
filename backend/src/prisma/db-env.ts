import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export interface DbEnvConfig {
  environment: 'SUPABASE' | 'LOCAL';
  databaseUrl: string;
  directUrl: string;
}

export function resolveDatabaseEnv(): DbEnvConfig {
  const env = (process.env.ENVIRONMENT || 'local').toLowerCase().trim();
  const isSupabase = env === 'supabase';

  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || '';
  const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL || supabaseUrl;
  const localUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';

  const activeUrl = isSupabase ? supabaseUrl : localUrl;
  const activeDirectUrl = isSupabase ? supabaseDirectUrl : localUrl;

  // Set standard Prisma env variables dynamically in runtime memory
  process.env.DATABASE_URL = activeUrl;
  process.env.DIRECT_URL = activeDirectUrl;

  return {
    environment: isSupabase ? 'SUPABASE' : 'LOCAL',
    databaseUrl: activeUrl,
    directUrl: activeDirectUrl,
  };
}

// Immediately resolve when imported
export const currentDbConfig = resolveDatabaseEnv();
