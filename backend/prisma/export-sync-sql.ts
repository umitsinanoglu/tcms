import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val.toString();
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${val.toString().replace(/'/g, "''")}'`;
}

export async function generateSyncSql(): Promise<string> {
  const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tcms_db?schema=public';
  const prisma = new PrismaClient({ datasources: { db: { url: localUrl } } });

  try {
    const users = await prisma.user.findMany();
    const projects = await prisma.project.findMany();
    const projectSequences = await prisma.projectSequence.findMany();
    const testPlans = await prisma.testPlan.findMany();
    const suites = await prisma.suite.findMany();
    const testCases = await prisma.testCase.findMany();
    const testPlanCases = await prisma.testPlanCase.findMany();
    const testSteps = await prisma.testStep.findMany({ orderBy: [{ testCaseId: 'asc' }, { stepNumber: 'asc' }] });
    const testRuns = await prisma.testRun.findMany();
    const testResults = await prisma.testResult.findMany();
    const defects = await prisma.defect.findMany();

    let sql = `-- ========================================================\n`;
    sql += `-- TCMS Local DB -> Supabase Full Data Synchronization SQL\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n`;
    sql += `-- Summary:\n`;
    sql += `--   - Users:            ${users.length}\n`;
    sql += `--   - Projects:         ${projects.length}\n`;
    sql += `--   - ProjectSequences: ${projectSequences.length}\n`;
    sql += `--   - Test Plans:       ${testPlans.length}\n`;
    sql += `--   - Suites:           ${suites.length}\n`;
    sql += `--   - Test Cases:       ${testCases.length}\n`;
    sql += `--   - Test Plan Cases:  ${testPlanCases.length}\n`;
    sql += `--   - Test Steps:       ${testSteps.length}\n`;
    sql += `--   - Test Runs:        ${testRuns.length}\n`;
    sql += `--   - Test Results:     ${testResults.length}\n`;
    sql += `--   - Defects:          ${defects.length}\n`;
    sql += `-- ========================================================\n\n`;

    sql += `BEGIN;\n\n`;
    sql += `SET session_replication_role = 'replica'; -- Bypass FK constraints during batch load\n\n`;

    sql += `-- 1. Truncate existing tables\n`;
    sql += `TRUNCATE TABLE "defects", "test_results", "test_steps", "test_plan_cases", "test_cases", "suites", "test_runs", "test_plans", "project_sequences", "projects", "users" CASCADE;\n\n`;

    function appendInserts(tableName: string, columns: string[], rows: any[]) {
      if (rows.length === 0) return;
      sql += `-- Inserting ${rows.length} records into "${tableName}"\n`;
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        sql += `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES\n`;
        sql += chunk
          .map((row) => `  (${columns.map((c) => escapeSql(row[c])).join(', ')})`)
          .join(',\n');
        sql += `;\n`;
      }
      sql += `\n`;
    }

    appendInserts('users', ['id', 'email', 'name', 'role', 'department', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'], users);
    appendInserts('projects', ['id', 'name', 'key', 'description', 'jiraProjectKey', 'createdAt'], projects);
    appendInserts('project_sequences', ['id', 'projectId', 'entityType', 'lastValue', 'updatedAt'], projectSequences);
    appendInserts('test_plans', ['id', 'title', 'description', 'version', 'environment', 'status', 'scope', 'requirements', 'projectId', 'createdAt', 'updatedAt'], testPlans);
    appendInserts('suites', ['id', 'name', 'projectId', 'parentId', 'orderIndex'], suites);
    appendInserts('test_cases', ['id', 'code', 'title', 'description', 'executionType', 'type', 'priority', 'precondition', 'projectId', 'suiteId', 'jiraStoryKey', 'jiraIssueUrl', 'screenshotUrl', 'createdAt', 'updatedAt'], testCases);
    appendInserts('test_plan_cases', ['id', 'testPlanId', 'testCaseId', 'createdAt'], testPlanCases);
    appendInserts('test_steps', ['id', 'stepNumber', 'action', 'expectedResult', 'attachments', 'testCaseId'], testSteps);
    appendInserts('test_runs', ['id', 'title', 'version', 'environment', 'status', 'executedBy', 'testerEmail', 'projectId', 'testPlanId', 'createdAt'], testRuns);
    appendInserts('test_results', ['id', 'testRunId', 'testCaseId', 'status', 'executionMs', 'errorMessage', 'executedBy', 'testerEmail', 'environment', 'platform', 'appVersion', 'device', 'userProfile', 'customerType', 'flakyStatus', 'retries', 'jiraBugKey', 'jiraBugUrl', 'screenshotUrl', 'executedAt'], testResults);
    appendInserts('defects', ['id', 'key', 'title', 'description', 'severity', 'status', 'projectId', 'testCaseId', 'testRunId', 'testResultId', 'assignedTo', 'reportedBy', 'environment', 'channel', 'jiraBugKey', 'jiraBugUrl', 'resolutionNotes', 'resolvedAt', 'createdAt', 'updatedAt'], defects);

    sql += `SET session_replication_role = 'origin'; -- Re-enable FK constraints\n\n`;
    sql += `COMMIT;\n`;

    const outputPath = path.resolve(__dirname, 'supabase_sync_data.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`✓ SQL synchronization file generated successfully!`);
    console.log(`  Path: ${outputPath}`);
    console.log(`  Size: ${sizeMb} MB`);
    return outputPath;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  generateSyncSql()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
