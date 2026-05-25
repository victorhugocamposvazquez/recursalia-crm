/**
 * Promueve un usuario a admin por email (service role).
 *
 *   npm run promote-admin -- <email>
 *
 * Carga automáticamente .env.local — no necesitas `dotenv -e` por delante.
 * Requiere: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import './loadEnv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

async function findUserByEmail(supabase: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const user = data.users.find((u) => (u.email ?? '').toLowerCase() === normalized);
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const emailArg = process.argv[2]?.trim();
  if (!emailArg) {
    console.error('Uso: npx tsx scripts/promote-to-admin.ts <email>');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.'
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const authUser = await findUserByEmail(supabase, emailArg);
  if (!authUser) {
    console.error('User not found in auth.users');
    process.exit(1);
  }

  const userId = authUser.id;
  const email = authUser.email ?? '';

  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (selErr) {
    console.error(selErr.message);
    process.exit(1);
  }

  if (existing?.role === 'admin') {
    console.log(`Already admin: ${emailArg}`);
    process.exit(0);
  }

  const now = new Date().toISOString();

  if (!existing) {
    const { error: insErr } = await supabase.from('profiles').insert({
      id: userId,
      email,
      role: 'admin',
      created_at: now,
      updated_at: now,
    });
    if (insErr) {
      console.error(insErr.message);
      process.exit(1);
    }
  } else {
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ role: 'admin', updated_at: now })
      .eq('id', userId);
    if (updErr) {
      console.error(updErr.message);
      process.exit(1);
    }
  }

  console.log(`Promoted ${emailArg} to admin`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
