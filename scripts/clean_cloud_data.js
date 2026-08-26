const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tlrktmprdgxhvwrnyzsz.supabase.co';
const supabaseKey = 'sb_publishable_tg126ASNqWTeTMNB2SA3Dw_A5yrYaz5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAll() {
  console.log('--- Limpiando Base de Datos Supabase a 0 ---');
  
  // 1. Borrar todas las órdenes
  const { error: err1 } = await supabase.from('orders').delete().neq('id', '___none___');
  console.log('Orders limpiadas:', err1 ? err1.message : 'OK');

  // 2. Borrar todas las mesas
  const { error: err2 } = await supabase.from('tables').delete().neq('id', '___none___');
  console.log('Tables limpiadas:', err2 ? err2.message : 'OK');

  // 3. Borrar todos los platos del menú si los hay
  const { error: err3 } = await supabase.from('menu_items').delete().neq('id', '___none___');
  console.log('Menu items limpiados:', err3 ? err3.message : 'OK');

  console.log('--- Base de datos completamente limpia a 0 ---');
}

cleanAll();
