#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const env = (process.env.ENVIRONMENT || 'local').toLowerCase().trim();
const isSupabase = env === 'supabase';
const isTtbLocal = env === 'ttb_local';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL || '';
const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL || supabaseUrl;

const ttbLocalUrl = process.env.TTB_LOCAL_DATABASE_URL || '';
const ttbLocalDirectUrl = process.env.TTB_LOCAL_DIRECT_URL || ttbLocalUrl;

const localUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';

let activeUrl;
let activeDirectUrl;
let envLabel;
let envDesc;

if (isSupabase) {
  activeUrl = supabaseUrl;
  activeDirectUrl = supabaseDirectUrl;
  envLabel = 'SUPABASE';
  envDesc = 'Remote Cloud';
} else if (isTtbLocal) {
  activeUrl = ttbLocalUrl;
  activeDirectUrl = ttbLocalDirectUrl;
  envLabel = 'TTB_LOCAL';
  envDesc = 'TTB Local Network (192.168.1.189)';
} else {
  activeUrl = localUrl;
  activeDirectUrl = localUrl;
  envLabel = 'LOCAL';
  envDesc = 'Local Instance';
}

process.env.DATABASE_URL = activeUrl;
process.env.DIRECT_URL = activeDirectUrl;

console.log(`\x1b[36m[TCMS Prisma Runner]\x1b[0m Target: \x1b[33m${envLabel}\x1b[0m (${envDesc})`);

const args = process.argv.slice(2);
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
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
