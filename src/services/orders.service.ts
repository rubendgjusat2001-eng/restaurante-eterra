/**
 * Acceso a datos de la tabla `orders`. FASE 2a — reorganización de código
 * solamente, misma anon key y misma postura de RLS que antes.
 */

import { supabase } from '@/lib/supabase';
import { Order } from '@/types/restaurant';

function mapRow(o: any): Order {
  return {
    id: o.id,
    code: o.code,
    tableId: o.table_id,
    tableNumber: o.table_number,
    waiterId: o.waiter_id,
    waiterName: o.waiter_name,
    openedByUserId: o.opened_by_user_id,
    openedByUserName: o.opened_by_user_name,
    closedByUserId: o.closed_by_user_id,
    closedByUserName: o.closed_by_user_name,
    closedAt: o.closed_at,
    orderType: o.order_type,
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: Number(o.subtotal) || 0,
    tax: Number(o.tax) || 0,
    tip: Number(o.tip) || 0,
    discount: Number(o.discount) || 0,
    total: Number(o.total) || 0,
    status: o.status,
    paymentMethod: o.payment_method,
    invoiceType: o.invoice_type,
    customerDocument: o.customer_document,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    createdAt: o.created_at
  };
}

export async function fetchOrders(): Promise<Order[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('orders').select('*');
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function persistOrderToCloud(order: Order): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('orders').upsert({
      id: order.id,
      code: order.code,
      table_id: order.tableId ?? null,
      table_number: order.tableNumber ?? null,
      waiter_id: order.waiterId,
      waiter_name: order.waiterName,
      opened_by_user_id: order.openedByUserId ?? null,
      opened_by_user_name: order.openedByUserName ?? null,
      closed_by_user_id: order.closedByUserId ?? null,
      closed_by_user_name: order.closedByUserName ?? null,
      closed_at: order.closedAt ?? null,
      order_type: order.orderType || 'dine_in',
      status: order.status || 'active',
      items: order.items || [],
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      tip: order.tip || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      payment_method: order.paymentMethod || 'pending',
      invoice_type: order.invoiceType ?? null,
      customer_document: order.customerDocument ?? null,
      customer_name: order.customerName ?? null,
      customer_phone: order.customerPhone ?? null
    });
  } catch (e) {
    console.warn('Persist order cloud error:', e);
  }
}
