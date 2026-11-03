// Creates student01@mlutraining.com to student10@mlutraining.com, linked only to MLU, and
// writes a printable credentials sheet and a CSV OUTSIDE the repo.
//
//   node scripts/seed-mlu/create-students.mjs [output folder]
//
// Re-running gives every student a NEW password, so sheets printed earlier stop working.
// Passwords go only to the output folder, never to the console. The verification signs in
// with the anon key, so Row Level Security applies to it.
import { randomInt } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { isAbsolute, join, relative, resolve } from 'path';
import { COMPANY_ID, envValue, projectRoot, readRows, scrub, serviceAuth, serviceRest } from './lib.mjs';

const OUTPUT = resolve(process.argv[2] || 'C:/Users/Public/Documents/MLU-Credentials');
const inRepo = (() => { const rel = relative(projectRoot, OUTPUT); return !rel.startsWith('..') && !isAbsolute(rel); })();
if (inRepo) { console.error('Refusing: the output folder is inside the repo.'); process.exit(1); }

const LOGIN_URL = 'https://edgeclouderp.com';
const TITLE = 'Margaret Lawrence University - Accounting Training';
const NOTICE = 'Please do not change company settings or the base currency.';
const STUDENT_EMAIL = /^student(0[1-9]|10)@mlutraining\.com$/;
const STUDENTS = Array.from({ length: 10 }, (_, i) => `student${String(i + 1).padStart(2, '0')}@mlutraining.com`);

// No 0/O/o, 1/l/I. Letters and digits only, so they're easy to type from paper.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
function generatePassword() {
  const all = UPPER + LOWER + DIGITS;
  const pick = (set) => set[randomInt(set.length)];
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), ...Array.from({ length: 9 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

const results = [];
const report = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` -> ${scrub(detail)}` : ''}`); };

async function allAuthUsers() {
  const users = [];
  for (let page = 1; page <= 50; page++) {
    const { users: batch } = await serviceAuth(`admin/users?page=${page}&per_page=200`);
    if (!batch?.length) break;
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

const memberships = async (userId) => (await serviceRest(`company_members?user_id=eq.${userId}&select=company_id`)).rows;
const companyCount = async () => (await serviceRest('companies?select=id')).rows.length;

async function provisionStudent(email, existing, password, label) {
  if (!STUDENT_EMAIL.test(email)) throw new Error(`Refusing unexpected email: ${email}`);
  const user_metadata = { full_name: label };
  let user;
  if (existing) user = await serviceAuth(`admin/users/${existing.id}`, { method: 'PUT', body: JSON.stringify({ password, email_confirm: true, user_metadata }) });
  else user = await serviceAuth('admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true, user_metadata }) });

  // Exactly one membership: MLU.
  const before = await memberships(user.id);
  const others = before.filter(m => m.company_id !== COMPANY_ID);
  for (const other of others) await serviceRest(`company_members?user_id=eq.${user.id}&company_id=eq.${other.company_id}`, { method: 'DELETE' });
  if (!before.some(m => m.company_id === COMPANY_ID)) {
    await serviceRest('company_members', { method: 'POST', body: JSON.stringify([{ user_id: user.id, company_id: COMPANY_ID }]) });
  }

  // The profile row, if the sign-up trigger made one.
  const { rows: profile } = await serviceRest(`users?id=eq.${user.id}&select=id`);
  if (profile.length) {
    await serviceRest(`users?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ is_super_admin: false, company_id: COMPANY_ID, accessible_companies: [COMPANY_ID], full_name: label }) });
  }
  return { user, removedOtherLinks: others.length, hasProfile: profile.length > 0 };
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function writeSheets(creds, companyName) {
  mkdirSync(OUTPUT, { recursive: true });
  const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [['username', 'password', 'login_address', 'company'].map(csvCell).join(','), ...creds.map(c => [c.email, c.password, LOGIN_URL, companyName].map(csvCell).join(','))].join('\r\n') + '\r\n';
  writeFileSync(join(OUTPUT, 'MLU-student-credentials.csv'), csv);

  const cards = creds.map(c => `
    <section class="card">
      <h2>${escapeHtml(TITLE)}</h2>
      <dl>
        <dt>Login address</dt><dd>${escapeHtml(LOGIN_URL)}</dd>
        <dt>Username</dt><dd>${escapeHtml(c.email)}</dd>
        <dt>Password</dt><dd class="password">${escapeHtml(c.password)}</dd>
        <dt>Company</dt><dd>${escapeHtml(companyName)}</dd>
      </dl>
      <p class="notice">${escapeHtml(NOTICE)}</p>
    </section>`).join('');

  writeFileSync(join(OUTPUT, 'MLU-student-credentials.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MLU Student Credentials</title>
<style>
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; }
  .sheet { width: 194mm; height: 281mm; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(5, 1fr); }
  .card { border: 1px dashed #777; padding: 3.5mm 4.5mm; display: flex; flex-direction: column; overflow: hidden; break-inside: avoid; }
  h2 { font-size: 10.5pt; line-height: 1.2; margin: 0 0 2mm; color: #1B4F8A; }
  dl { display: grid; grid-template-columns: 24mm 1fr; column-gap: 2mm; row-gap: 1mm; margin: 0; font-size: 9pt; line-height: 1.25; }
  dt { color: #555; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .password { font-family: Consolas, "Courier New", monospace; font-size: 12.5pt; font-weight: 700; letter-spacing: 0.04em; }
  .notice { margin: auto 0 0; padding-top: 1.5mm; font-size: 8pt; line-height: 1.25; color: #92400E; }
  @media screen { body { padding: 16px 0; background: #eee; } .sheet { background: #fff; box-shadow: 0 1px 8px rgba(0,0,0,.2); } }
</style>
</head>
<body>
<main class="sheet">${cards}
</main>
</body>
</html>
`);
}

// ── Signed in as a student, with the anon key, so RLS applies ─────────────────
const API = envValue('SUPABASE_URL').replace(/\/+$/, '');
const ANON = envValue('SUPABASE_ANON_KEY');
async function signIn(email, password) {
  const res = await fetch(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body.error_code || body.msg}`);
  return body;
}
const asStudent = (token) => async (path, options = {}) => {
  const res = await fetch(`${API}/rest/v1/${path}`, { ...options, headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers } });
  const text = await res.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, ok: res.ok, body };
};

async function verify(creds, ids) {
  console.log('\n=== Every student');
  for (const c of creds) {
    const members = await memberships(c.id);
    const { rows: profile } = await serviceRest(`users?id=eq.${c.id}&select=is_super_admin,role`);
    let signedIn = false; let companies = '?';
    try {
      const session = await signIn(c.email, c.password);
      signedIn = true;
      const list = await asStudent(session.access_token)('companies?select=id');
      companies = list.ok ? list.body.map(x => x.id).join(',') === COMPANY_ID ? 'MLU only' : `${list.body.length} companies` : `HTTP ${list.status}`;
    } catch (error) { companies = error.message; }
    const ok = signedIn && members.length === 1 && members[0].company_id === COMPANY_ID && companies === 'MLU only' && !(profile[0]?.is_super_admin);
    report(`${c.email}: signs in, member of MLU only, sees MLU only, not super admin`, ok, ok ? '' : JSON.stringify({ signedIn, members: members.length, companies, superAdmin: profile[0]?.is_super_admin }));
  }

  console.log('\n=== student01, with the anon key');
  const student = creds[0];
  const session = await signIn(student.email, student.password);
  const db = asStudent(session.access_token);

  const seen = await db('companies?select=id,company_name');
  report(`sees only the MLU company (sees: ${seen.ok ? seen.body.map(x => x.company_name).join('; ') : seen.status})`, seen.ok && seen.body.length === 1 && seen.body[0].id === COMPANY_ID);

  const { rows: havillah } = await serviceRest("companies?company_name=ilike.*Havillah*&select=id,company_name");
  report(`Havillah Group exists to test against (found ${havillah.length})`, havillah.length === 1);
  if (havillah.length) {
    const hid = havillah[0].id;
    report('Havillah Group is not visible by name or id', (await db(`companies?id=eq.${hid}&select=id`)).body?.length === 0 && (await db('companies?company_name=ilike.*Havillah*&select=id')).body?.length === 0);
    for (const table of ['accounts', 'customers', 'vendors', 'products', 'invoices', 'bills', 'payments', 'journal_entries', 'employees']) {
      const real = (await serviceRest(`${table}?company_id=eq.${hid}&select=id`)).rows.length;
      const read = await db(`${table}?company_id=eq.${hid}&select=id`);
      report(`reads zero Havillah ${table} (Havillah really has ${real})`, read.ok && read.body.length === 0, read.ok ? '' : `HTTP ${read.status}`);
    }
  }

  const mluInvoices = (await readRows('invoices')).length;
  const invoices = await db(`invoices?company_id=eq.${COMPANY_ID}&select=id,invoice_number,total_amount`);
  report(`can read MLU invoices (${invoices.ok ? invoices.body.length : invoices.status} of ${mluInvoices})`, invoices.ok && mluInvoices > 0 && invoices.body.length === mluInvoices);

  const selfBefore = (await serviceRest(`users?id=eq.${student.id}&select=is_super_admin,role`)).rows[0];
  report(`student01 has a profile row to attack (role: ${selfBefore?.role ?? 'none'}, super admin: ${selfBefore?.is_super_admin ?? 'none'})`, !!selfBefore);
  for (const [field, value] of [['is_super_admin', true], ['role', 'admin']]) {
    const attempt = await db(`users?id=eq.${student.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ [field]: value }) });
    const after = (await serviceRest(`users?id=eq.${student.id}&select=is_super_admin,role`)).rows[0];
    const unchanged = after?.[field] === selfBefore?.[field];
    if (!unchanged) await serviceRest(`users?id=eq.${student.id}`, { method: 'PATCH', body: JSON.stringify({ [field]: selfBefore[field] ?? null }) });
    report(`cannot change own ${field} (API said ${attempt.status}, ${Array.isArray(attempt.body) ? `${attempt.body.length} rows` : (attempt.body?.message || 'no rows')}; value ${unchanged ? 'unchanged' : 'CHANGED, and was put back'})`, unchanged);
  }

  // Also the route the app itself reads from: the signed-in user's own auth record.
  const metaRes = await fetch(`${API}/auth/v1/user`, { method: 'PUT', headers: { apikey: ANON, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { is_super_admin: true } }) });
  const meta = await metaRes.json();
  report('self-editing auth metadata does not grant is_super_admin to the app', meta.is_super_admin !== true);
  if (meta.user_metadata?.is_super_admin !== undefined) {
    // Metadata updates merge, so the key has to be set to null to remove it.
    const cleared = await serviceAuth(`admin/users/${student.id}`, { method: 'PUT', body: JSON.stringify({ user_metadata: { full_name: 'Student 01', is_super_admin: null } }) });
    report('test value removed from student01 metadata', cleared.user_metadata?.is_super_admin === undefined || cleared.user_metadata?.is_super_admin === null);
    console.log('      note: a user can write any value into their own user_metadata. The app does not read is_super_admin from it.');
  }
}

async function main() {
  if (!ANON) throw new Error('SUPABASE_ANON_KEY is missing from .env.seed.');
  const [company] = await readRows('companies');
  if (!company || company.id !== COMPANY_ID || !company.company_name?.includes('Margaret Lawrence')) throw new Error('Target is not the MLU company. Nothing changed.');

  const companiesBefore = await companyCount();
  const authUsers = await allAuthUsers();
  const passwords = new Set();
  while (passwords.size < STUDENTS.length) passwords.add(generatePassword());
  const passwordList = [...passwords];

  const creds = []; let createdCount = 0; let resetCount = 0;
  for (let i = 0; i < STUDENTS.length; i++) {
    const email = STUDENTS[i];
    const existing = authUsers.find(u => (u.email || '').toLowerCase() === email);
    const label = `Student ${String(i + 1).padStart(2, '0')}`;
    const { user, removedOtherLinks, hasProfile } = await provisionStudent(email, existing, passwordList[i], label);
    if (existing) resetCount++; else createdCount++;
    creds.push({ email, password: passwordList[i], id: user.id });
    if (removedOtherLinks) console.log(`${email}: removed ${removedOtherLinks} link(s) to other companies`);
    if (!hasProfile) console.log(`${email}: no row in public.users`);

    // Stop early if creating a user had side effects, rather than repeating them nine more times.
    if (i === 0) {
      const after = await companyCount();
      if (after !== companiesBefore) throw new Error(`Creating ${email} changed the number of companies (${companiesBefore} -> ${after}). Stopped after one student.`);
    }
  }
  console.log(`Created ${createdCount}, password reset on ${resetCount}.`);
  const companiesAfter = await companyCount();
  report(`number of companies unchanged (${companiesBefore})`, companiesAfter === companiesBefore, `now ${companiesAfter}`);

  writeSheets(creds, company.company_name);
  console.log(`Sheets written to ${OUTPUT}`);

  await verify(creds);

  const failed = results.filter(r => !r.ok).length;
  console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error('Stopped:', scrub(error.message));
  process.exit(1);
});
