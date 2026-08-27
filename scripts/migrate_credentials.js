/**
 * Fase 1 — Migra las credenciales en texto plano actuales a hashes bcrypt en las
 * nuevas tablas `access_accounts` (Nivel 1: login) y `staff_credentials` (Nivel 2:
 * identificación por PIN). No borra ni modifica las columnas/tablas viejas.
 *
 * Idempotente: se puede volver a ejecutar sin duplicar ni sobrescribir datos ya
 * migrados.
 *
 * Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Uso: node scripts/migrate_credentials.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SALT_ROUNDS = 10;
const DEFAULT_OWNER_PASSWORD = 'Admin2026!*';
const DEFAULT_OWNER_USERNAME = 'admin@eterra.pe';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function migrateOwnerAccounts(staffUsers) {
  const { data: restaurants, error } = await supabase.from('restaurants').select('id');
  if (error) throw error;

  for (const restaurant of restaurants || []) {
    const { data: existingOwnerAccount } = await supabase
      .from('access_accounts')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('role', 'owner')
      .maybeSingle();

    if (existingOwnerAccount) {
      console.log(`Restaurante ${restaurant.id}: ya tiene cuenta de dueño en access_accounts, se omite.`);
      continue;
    }

    const ownerStaffRow = staffUsers.find(s => s.role === 'owner');
    const effectivePassword = ownerStaffRow?.pin || DEFAULT_OWNER_PASSWORD;
    const passwordHash = await bcrypt.hash(String(effectivePassword), SALT_ROUNDS);

    const { error: insertErr } = await supabase.from('access_accounts').insert({
      restaurant_id: restaurant.id,
      username: DEFAULT_OWNER_USERNAME,
      display_name: 'Propietario',
      role: 'owner',
      password_hash: passwordHash,
      active: true
    });
    if (insertErr) throw insertErr;
    console.log(`Restaurante ${restaurant.id}: cuenta de dueño creada (usuario: ${DEFAULT_OWNER_USERNAME}).`);
  }
}

async function migrateStaffPins(staffUsers) {
  let migrated = 0;
  let skipped = 0;

  for (const staffMember of staffUsers) {
    if (!staffMember.pin) continue;

    const { data: existingCredential } = await supabase
      .from('staff_credentials')
      .select('staff_id')
      .eq('staff_id', staffMember.id)
      .maybeSingle();

    if (existingCredential) {
      skipped++;
      continue;
    }

    const pinHash = await bcrypt.hash(String(staffMember.pin), SALT_ROUNDS);
    const { error } = await supabase
      .from('staff_credentials')
      .insert({ staff_id: staffMember.id, pin_hash: pinHash });
    if (error) throw error;
    migrated++;
  }

  console.log(`PIN migrados: ${migrated}. Ya existentes (omitidos): ${skipped}.`);
}

async function main() {
  console.log('--- Fase 1: migrando credenciales a hashes seguros ---');

  const { data: staffUsers, error: staffErr } = await supabase
    .from('staff_users')
    .select('id, role, pin')
    .neq('id', 'system-security');
  if (staffErr) throw staffErr;

  await migrateOwnerAccounts(staffUsers || []);
  await migrateStaffPins(staffUsers || []);

  console.log('--- Migración completa ---');
  console.log('Verifica en el dashboard de Supabase que access_accounts y staff_credentials tienen datos hasheados (no texto plano) antes de continuar con la migración de RLS.');
}

main().catch(err => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
