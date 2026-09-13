// One-off: apply 003_master_admin.sql + create the master admin login.
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const root = path.resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, '.env'), 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

function parseConn() {
  const uri = env.VITE_SUPABASE_POSTGRES || env.SUPABASE_POSTGRES;
  if (uri) {
    const m = uri.match(/^postgres(?:ql)?:\/\/([^:]+):(.+)@([^:/]+)(?::(\d+))?\/(.+)$/);
    if (m) {
      return {
        host: m[3], port: Number(m[4] || 5432), database: m[5],
        username: m[1], password: m[2],
      };
    }
  }
  return {
    host: env.DB_HOST, port: Number(env.DB_PORT || 5432), database: env.DB_NAME,
    username: env.DB_USER, password: env.DB_PASSWORD,
  };
}

const MASTER_EMAIL = 'master@digitalmenus.app';
const MASTER_PASSWORD = 'MasterAdmin2026!';

const sql = postgres({ ...parseConn(), ssl: 'prefer' });

// 1. Apply the migration (idempotent — policies use drop-if-exists).
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/003_master_admin.sql'),
  'utf8',
);
await sql.unsafe(migration);
const roles = await sql`
  select pg_get_constraintdef(oid) as def from pg_constraint
  where conname = 'staff_role_check' and conrelid = 'staff'::regclass
`;
console.log('role constraint:', roles[0]?.def);
const policies = await sql`
  select policyname from pg_policies where tablename = 'orders' order by policyname
`;
console.log('order policies:', policies.map((p) => p.policyname).join(', '));

// 2. Create the master auth user (anon signup), then confirm + map it.
const authBase = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const res = await fetch(`${authBase}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: MASTER_EMAIL, password: MASTER_PASSWORD }),
});
const body = await res.json();
if (!res.ok && !/already registered/i.test(body.msg ?? body.error_description ?? body.message ?? '')) {
  console.error('signup failed:', res.status, JSON.stringify(body));
  process.exit(1);
}
console.log('signup:', res.ok ? 'created (or already exists)' : 'already exists');

const users = await sql`select id, email_confirmed_at from auth.users where email = ${MASTER_EMAIL}`;
if (users.length !== 1) {
  console.error('master auth user not found');
  process.exit(1);
}
const uid = users[0].id;
await sql`
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = ${uid}
`;
await sql`
  insert into staff (id, restaurant_slug, name, role)
  values (${uid}, 'bella-italia', 'Master Admin', 'admin')
  on conflict (id) do update set role = 'admin', name = 'Master Admin'
`;
const stf = await sql`select id, restaurant_slug, role from staff where id = ${uid}`;
console.log('master staff row:', stf[0]);
await sql.end();