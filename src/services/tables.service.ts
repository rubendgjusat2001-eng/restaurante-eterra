/**
 * Acceso a datos de la tabla `tables`. FASE 2a — reorganización de código
 * solamente, misma anon key y misma postura de RLS que antes.
 */

import { supabase } from '@/lib/supabase';
import { Table } from '@/types/restaurant';

function mapRow(t: any): Table {
  return {
    id: t.id,
    number: t.number,
    zone: t.zone,
    capacity: t.capacity,
    status: t.status,
    customerCount: t.customer_count,
    currentOrderId: t.current_order_id,
    seatedAt: t.seated_at,
    openedTimestamp: t.opened_timestamp,
    openedByUserId: t.opened_by_user_id,
    openedByUserName: t.opened_by_user_name,
    assignedWaiterId: t.assigned_waiter_id,
    assignedWaiterName: t.assigned_waiter_name,
    closedByUserId: t.closed_by_user_id,
    closedByUserName: t.closed_by_user_name,
    closedAt: t.closed_at
  };
}

export async function fetchTables(): Promise<Table[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('tables').select('*');
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function persistTableToCloud(table: Table): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('tables').upsert({
      id: table.id,
      number: table.number,
      zone: table.zone,
      capacity: table.capacity,
      status: table.status,
      customer_count: table.customerCount ?? null,
      current_order_id: table.currentOrderId ?? null,
      seated_at: table.seatedAt ?? null,
      opened_timestamp: table.openedTimestamp ?? null,
      opened_by_user_id: table.openedByUserId ?? null,
      opened_by_user_name: table.openedByUserName ?? null,
      assigned_waiter_id: table.assignedWaiterId ?? null,
      assigned_waiter_name: table.assignedWaiterName ?? null,
      closed_by_user_id: table.closedByUserId ?? null,
      closed_by_user_name: table.closedByUserName ?? null,
      closed_at: table.closedAt ?? null
    });
  } catch (e) {
    console.warn('Persist table cloud error:', e);
  }
}

export function deleteTableRow(tableId: string): void {
  if (!supabase) return;
  supabase.from('tables').delete().eq('id', tableId).then();
}
