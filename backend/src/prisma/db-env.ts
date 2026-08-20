import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export interface DbEnvConfig {
  environment: 'SUPABASE' | 'LOCAL' | 'TTB_LOCAL';
  databaseUrl: string;
  directUrl: string;
}

export function resolveDatabaseEnv(): DbEnvConfig {
  const env = (process.env.ENVIRONMENT || 'local').toLowerCase().trim();
  const isSupabase = env === 'supabase';
  const isTtbLocal = env === 'ttb_local';

  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || '';
  const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL || supabaseUrl;

  const ttbLocalUrl = process.env.TTB_LOCAL_DATABASE_URL || '';
  const ttbLocalDirectUrl = process.env.TTB_LOCAL_DIRECT_URL || ttbLocalUrl;

  const localUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';

  let activeUrl: string;
  let activeDirectUrl: string;
  let envType: 'SUPABASE' | 'LOCAL' | 'TTB_LOCAL';

  if (isSupabase) {
    activeUrl = supabaseUrl;
    activeDirectUrl = supabaseDirectUrl;
    envType = 'SUPABASE';
  } else if (isTtbLocal) {
    activeUrl = ttbLocalUrl;
    activeDirectUrl = ttbLocalDirectUrl;
    envType = 'TTB_LOCAL';
  } else {
    activeUrl = localUrl;
    activeDirectUrl = localUrl;
    envType = 'LOCAL';
  }

  // Set standard Prisma env variables dynamically in runtime memory
  process.env.DATABASE_URL = activeUrl;
  process.env.DIRECT_URL = activeDirectUrl;

  return {
    environment: envType,
    databaseUrl: activeUrl,
    directUrl: activeDirectUrl,
  };
}

// Immediately resolve when imported
export const currentDbConfig = resolveDatabaseEnv();
