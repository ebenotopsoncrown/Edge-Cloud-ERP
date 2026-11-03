// Confirms no value from .env.seed is in git. Prints findings by name, never by value.
//   node scripts/seed-mlu/check-secrets.mjs            staged and tracked files
//   node scripts/seed-mlu/check-secrets.mjs --history  also every past commit
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { projectRoot } from './lib.mjs';

const git = (...args) => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8', maxBuffer: 1024 * 1024 * 512, stdio: ['ignore', 'pipe', 'ignore'] });

const secrets = {};
for (const line of readFileSync(join(projectRoot, '.env.seed'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/);
  // The URL and test email aren't secrets, and the project address is public in the site bundle.
  if (m && m[2] && /KEY|PASSWORD|SECRET|TOKEN/.test(m[1])) secrets[m[1]] = m[2];
}
const PATTERNS = { 'JWT-shaped string': /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, 'Supabase secret key': /sb_secret_[A-Za-z0-9_-]{10,}/, 'Supabase publishable key': /sb_publishable_[A-Za-z0-9_-]{10,}/ };

const problems = [];
const scan = (where, text) => {
  for (const [name, value] of Object.entries(secrets)) if (text.includes(value)) problems.push(`${name} in ${where}`);
  for (const [name, pattern] of Object.entries(PATTERNS)) if (pattern.test(text)) problems.push(`${name} in ${where}`);
};

const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
for (const file of staged) { try { scan(`staged ${file}`, git('show', `:${file}`)); } catch { /* deleted */ } }
const tracked = git('ls-files').split('\n').filter(Boolean);
for (const file of tracked) { try { scan(file, readFileSync(join(projectRoot, file), 'utf8')); } catch { /* unreadable */ } }

const envTracked = tracked.filter(f => /(^|\/)\.env/.test(f) || f.includes('seed-mlu/output/') || f.includes('node_modules/'));
console.log(`Checked ${Object.keys(secrets).length} secret values: ${Object.keys(secrets).join(', ')}`);
console.log(`Staged files: ${staged.length} | tracked files: ${tracked.length}`);
console.log(`.env files, output or node_modules tracked: ${envTracked.join(', ') || 'none'}`);
try { git('check-ignore', '.env.seed'); console.log('.env.seed ignored by git: yes'); } catch { problems.push('.env.seed is not ignored'); }

if (process.argv.includes('--history')) {
  const commits = git('rev-list', '--all').split('\n').filter(Boolean);
  scan(`history of ${commits.length} commits`, git('log', '--all', '-p', '--no-color'));
  try { if (git('log', '--all', '--oneline', '--', '.env.seed').trim()) problems.push('.env.seed appears in history'); } catch { /* none */ }
  console.log(`History scanned: ${commits.length} commits`);
}
console.log(problems.length ? `PROBLEMS:\n  ${[...new Set(problems)].join('\n  ')}` : 'No secrets found.');
process.exit(problems.length ? 1 : 0);
