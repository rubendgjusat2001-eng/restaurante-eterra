require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAll() {
  console.log('--- Limpiando Base de Datos Supabase a 0 ---');

  const { error: err1 } = await supabase.from('orders').delete().neq('id', '___none___');
  console.log('Orders limpiadas:', err1 ? err1.message : 'OK');

  const { error: err2 } = await supabase.from('tables').delete().neq('id', '___none___');
  console.log('Tables limpiadas:', err2 ? err2.message : 'OK');

  const { error: err3 } = await supabase.from('menu_items').delete().neq('id', '___none___');
  console.log('Menu items limpiados:', err3 ? err3.message : 'OK');

  console.log('--- Base de datos completamente limpia a 0 ---');
}

cleanAll();
