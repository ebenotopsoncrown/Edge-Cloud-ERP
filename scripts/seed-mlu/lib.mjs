// Shared plumbing for the MLU seed. Uses the REST API directly so the only
// dependency is Node itself, and so every request can be checked before it goes out.
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
export const projectRoot = join(here, '..', '..');
export const outputDir = join(here, 'output');

// The one company this tooling may ever touch.
export const COMPANY_ID = '056852c2-01bd-472f-9155-088e12a97122';

function loadEnv() {
  let raw;
  try {
    raw = readFileSync(join(projectRoot, '.env.seed'), 'utf8');
  } catch {
    throw new Error('.env.seed not found in the project root.');
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('.env.seed must set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return env;
}

const env = loadEnv();
const baseUrl = env.SUPABASE_URL.replace(/\/+$/, '');
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

// Nothing this tooling prints may contain the key.
export const scrub = (text) => String(text).split(key).join('[hidden]');

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const body = await response.text();
  if (!response.ok) {
    let message = body;
    try { const parsed = JSON.parse(body); message = [parsed.message, parsed.details, parsed.hint].filter(Boolean).join(' | '); } catch { /* keep raw */ }
    const error = new Error(scrub(`${response.status}: ${message}`));
    error.status = response.status;
    throw error;
  }
  return { body, response };
}

export async function getSchema() {
  const { body } = await request('', { headers: { Accept: 'application/openapi+json' } });
  const spec = JSON.parse(body);
  const tables = {};
  for (const [name, def] of Object.entries(spec.definitions || {})) {
    const required = new Set(def.required || []);
    tables[name] = Object.fromEntries(Object.entries(def.properties || {}).map(([column, info]) => [column, {
      type: info.format || info.type,
      required: required.has(column),
      hasDefault: info.default !== undefined,
      enum: info.enum,
      isPk: (info.description || '').includes('<pk'),
      fk: (info.description || '').match(/<fk table='([^']+)'/)?.[1],
    }]));
  }
  return tables;
}

const scoped = (table, query = '') => {
  if (table === 'companies') return `companies?id=eq.${COMPANY_ID}${query}`;
  return `${table}?company_id=eq.${COMPANY_ID}${query}`;
};

export async function countRows(table) {
  const { response } = await request(scoped(table, '&select=*'), { method: 'HEAD', headers: { Prefer: 'count=exact', Range: '0-0' } });
  return Number(response.headers.get('content-range')?.split('/')[1] ?? 0);
}

// Count only, across all companies. Used to prove other companies' rows didn't change.
export async function countAll(table) {
  const { response } = await request(`${table}?select=*`, { method: 'HEAD', headers: { Prefer: 'count=exact', Range: '0-0' } });
  return Number(response.headers.get('content-range')?.split('/')[1] ?? 0);
}

// Database functions callable through the API.
export async function listRpcs() {
  const { body } = await request('', { headers: { Accept: 'application/openapi+json' } });
  return Object.keys(JSON.parse(body).paths || {}).filter(p => p.startsWith('/rpc/')).map(p => p.slice(5));
}

// Sends an update that can match no rows, to see whether the API accepts the column.
// Changes nothing either way.
const NO_ROW = '00000000-0000-0000-0000-000000000000';
export async function probeColumn(table, column) {
  try {
    await request(`${table}?company_id=eq.${COMPANY_ID}&id=eq.${NO_ROW}`, { method: 'PATCH', body: JSON.stringify({ [column]: null }) });
    return 'accepted';
  } catch (error) {
    return `rejected (${error.message.slice(0, 90)})`;
  }
}

export async function readRows(table, query = '') {
  const { body } = await request(scoped(table, `&select=*${query}`));
  return JSON.parse(body);
}

export async function insertRows(table, rows) {
  if (table === 'companies') throw new Error('companies is updated, never inserted.');
  for (const row of rows) {
    if (row.company_id !== COMPANY_ID) throw new Error(`Refusing to write ${table}: row for a different company.`);
  }
  const { body } = await request(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rows) });
  return JSON.parse(body);
}

export async function deleteCompanyRows(table) {
  if (table === 'companies') throw new Error('The company row itself is never deleted.');
  const { body } = await request(scoped(table), { method: 'DELETE', headers: { Prefer: 'return=representation' } });
  return JSON.parse(body).length;
}

export async function updateCompany(changes) {
  const { body } = await request(`companies?id=eq.${COMPANY_ID}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(changes) });
  const rows = JSON.parse(body);
  if (rows.length !== 1 || rows[0].id !== COMPANY_ID) throw new Error('Company update did not touch exactly the MLU row.');
  return rows[0];
}

export const envValue = (name) => env[name];

// One row, and only if it belongs to MLU.
export async function deleteRowById(table, id) {
  const { body } = await request(`${table}?company_id=eq.${COMPANY_ID}&id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
  return JSON.parse(body).length;
}

export async function updateRowById(table, id, changes) {
  const { body } = await request(`${table}?company_id=eq.${COMPANY_ID}&id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(changes) });
  return JSON.parse(body).length;
}

export function writeOutput(name, data) {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}
