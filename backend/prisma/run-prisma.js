#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const env = (process.env.ENVIRONMENT || 'local').toLowerCase().trim();
const isSupabase = env === 'supabase';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL || '';
const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL || supabaseUrl;
const localUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';

const activeUrl = isSupabase ? supabaseUrl : localUrl;
const activeDirectUrl = isSupabase ? supabaseDirectUrl : localUrl;

process.env.DATABASE_URL = activeUrl;
process.env.DIRECT_URL = activeDirectUrl;

console.log(`\x1b[36m[TCMS Prisma Runner]\x1b[0m Target: \x1b[33m${isSupabase ? 'SUPABASE' : 'LOCAL'}\x1b[0m (${isSupabase ? 'Remote Cloud' : 'Local Instance'})`);

const args = process.argv.slice(2);
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['prisma', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: activeUrl,
    DIRECT_URL: activeDirectUrl,
  },
  cwd: path.resolve(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
