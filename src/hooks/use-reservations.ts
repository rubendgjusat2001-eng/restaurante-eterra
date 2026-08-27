'use client';

import { useState } from 'react';
import { Reservation, Promotion } from '@/types/restaurant';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { ToastMessage } from './use-toasts';

interface UseReservationsDeps {
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
}

/**
 * Reservas y promociones (público). Extraído tal cual estaba en
 * RestaurantContext.tsx (Fase 2a: reorganización, sin cambiar comportamiento)
 * — **todavía vive solo en memoria, se pierde al recargar la página**.
 * Persistirlo en una tabla real es Fase 2b (ver el plan y CLAUDE.md §6).
 */
export function useReservations({ showToast }: UseReservationsDeps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

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
    sounds.playKitchenBell();
    showToast('success', `¡Reserva ${newRes.code} confirmada para ${newRes.customerName}!`, 'Reserva ÉTERRA');
    return newRes;
  };

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast('info', `Estado de reserva actualizado a: ${status.toUpperCase()}`);
  };

  const updatePromotion = (promo: Promotion) => {
    setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p));
    showToast('success', `Promoción "${promo.title}" actualizada`);
  };

  return { reservations, setReservations, createReservation, updateReservationStatus, promotions, updatePromotion };
}
