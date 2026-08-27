/**
 * Acceso a datos de `reservations` (Fase I). Mismo patrón que el resto de
 * servicios. Las reservas se crean desde el portal público (sin sesión) — la
 * escritura nunca depende de `isPrivateRoute`, solo la lectura/tiempo real
 * que usa el ERP para gestionarlas.
 */

import { supabase } from '@/lib/supabase';
import { Reservation } from '@/types/restaurant';

function mapRow(row: any): Reservation {
  return {
    id: row.id,
    code: row.code,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || '',
    partySize: row.party_size,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    zonePreference: row.zone_preference || '',
    tableId: row.table_id ?? undefined,
    status: row.status,
    specialRequests: row.special_requests ?? undefined,
    depositAmount: Number(row.deposit_amount) || 0,
    paymentStatus: row.payment_status,
    createdAt: row.created_at
  };
}

export async function fetchReservations(): Promise<Reservation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function persistReservationToCloud(reservation: Reservation): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('reservations').upsert({
      id: reservation.id,
      code: reservation.code,
      customer_name: reservation.customerName,
      customer_phone: reservation.customerPhone,
      customer_email: reservation.customerEmail || null,
      party_size: reservation.partySize,
      reservation_date: reservation.reservationDate,
      reservation_time: reservation.reservationTime,
      zone_preference: reservation.zonePreference || null,
      table_id: reservation.tableId ?? null,
      status: reservation.status,
      special_requests: reservation.specialRequests ?? null,
      deposit_amount: reservation.depositAmount,
      payment_status: reservation.paymentStatus
    });
  } catch (e) {
    console.warn('Persist reservation cloud error:', e);
  }
}
