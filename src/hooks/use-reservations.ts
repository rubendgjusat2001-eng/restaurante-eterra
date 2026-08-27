'use client';

import { useEffect, useState } from 'react';
import { Reservation, Promotion } from '@/types/restaurant';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as reservationsService from '@/services/reservations.service';
import { ToastMessage } from './use-toasts';

interface UseReservationsDeps {
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. La
   * CREACIÓN de reservas sigue funcionando siempre (se hace desde el portal
   * público, sin sesión) — solo la lectura/tiempo real que usa el ERP para
   * gestionarlas se limita a la ruta privada. */
  isPrivateRoute: boolean;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
}

/**
 * Reservas y promociones (Fase I) — ahora persiste de verdad en Supabase
 * (antes vivía solo en memoria, se perdía al recargar).
 */
export function useReservations({ isPrivateRoute, showToast }: UseReservationsDeps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    reservationsService.fetchReservations().then(setReservations);
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const channel = supabase
      .channel('realtime_reservations_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const nu = payload.new as any;
          setReservations(prev => prev.some(r => r.id === nu.id) ? prev : [{
            id: nu.id, code: nu.code, customerName: nu.customer_name, customerPhone: nu.customer_phone,
            customerEmail: nu.customer_email || '', partySize: nu.party_size, reservationDate: nu.reservation_date,
            reservationTime: nu.reservation_time, zonePreference: nu.zone_preference || '', tableId: nu.table_id ?? undefined,
            status: nu.status, specialRequests: nu.special_requests ?? undefined, depositAmount: Number(nu.deposit_amount) || 0,
            paymentStatus: nu.payment_status, createdAt: nu.created_at
          }, ...prev]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const nu = payload.new as any;
          setReservations(prev => prev.map(r => r.id === nu.id ? { ...r, status: nu.status, paymentStatus: nu.payment_status } : r));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const ou = payload.old as any;
          setReservations(prev => prev.filter(r => r.id !== ou.id));
        }
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isPrivateRoute]);

  const createReservation = (resData: Omit<Reservation, 'id' | 'code' | 'createdAt' | 'status' | 'paymentStatus'>): Reservation => {
    const newRes: Reservation = {
      ...resData,
      id: `res-${Date.now()}`,
      code: `RES-${Math.floor(100 + Math.random() * 900)}`,
      status: 'confirmed',
      paymentStatus: resData.depositAmount > 0 ? 'paid' : 'none',
      createdAt: serverDate().toISOString()
    };
    setReservations(prev => [newRes, ...prev]);
    reservationsService.persistReservationToCloud(newRes);
    sounds.playKitchenBell();
    showToast('success', `¡Reserva ${newRes.code} confirmada para ${newRes.customerName}!`, 'Reserva ÉTERRA');
    return newRes;
  };

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    let updated: Reservation | undefined;
    setReservations(prev => prev.map(r => {
      if (r.id === id) { updated = { ...r, status }; return updated; }
      return r;
    }));
    if (updated) reservationsService.persistReservationToCloud(updated);
    showToast('info', `Estado de reserva actualizado a: ${status.toUpperCase()}`);
  };

  const updatePromotion = (promo: Promotion) => {
    setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p));
    showToast('success', `Promoción "${promo.title}" actualizada`);
  };

  return { reservations, setReservations, createReservation, updateReservationStatus, promotions, updatePromotion };
}
