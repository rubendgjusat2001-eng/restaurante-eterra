'use client';

import { useState, type RefObject } from 'react';
import { CashShift, CashDenominationCount, StaffUser } from '@/types/restaurant';
import { INITIAL_SHIFT } from '@/lib/constants';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { ToastMessage } from './use-toasts';

interface UseCashShiftsDeps {
  currentUserRef: RefObject<StaffUser | null>;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'shift_closed', description: string) => void;
}

/**
 * Caja y turnos. Extraído tal cual estaba en RestaurantContext.tsx (Fase 2a:
 * reorganización, sin cambiar comportamiento) — **todavía vive solo en
 * memoria, se pierde al recargar la página**. Ya existe la tabla
 * `cash_shifts` en Supabase con las columnas correctas; conectarla es Fase 2b
 * (ver el plan y CLAUDE.md §6), NO se hace en este paso.
 */
export function useCashShifts({ currentUserRef, showToast, addAuditLog }: UseCashShiftsDeps) {
  const [activeShift, setActiveShift] = useState<CashShift>(() => INITIAL_SHIFT);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);

  const saveCashAudit = (breakdown: CashDenominationCount, notes?: string) => {
    const totalCounted =
      (breakdown.b200 * 200) +
      (breakdown.b100 * 100) +
      (breakdown.b50 * 50) +
      (breakdown.b20 * 20) +
      (breakdown.b10 * 10) +
      (breakdown.m5 * 5) +
      (breakdown.m2 * 2) +
      (breakdown.m1 * 1) +
      (breakdown.m050 * 0.50) +
      (breakdown.m020 * 0.20) +
      (breakdown.m010 * 0.10);

    const expectedCash = activeShift.initialCash + activeShift.systemCashSales + activeShift.manualCashEntries - activeShift.manualCashWithdrawals;
    const difference = totalCounted - expectedCash;

    setActiveShift(prev => ({
      ...prev,
      countedCashBreakdown: breakdown,
      countedCashTotal: totalCounted,
      expectedCashTotal: expectedCash,
      cashDifference: difference,
      notes: notes || prev.notes
    }));

    sounds.playCashRegister();
    showToast(
      difference === 0 ? 'success' : (difference > 0 ? 'info' : 'warning'),
      `Arqueo guardado: Contado S/. ${totalCounted.toFixed(2)} | Diferencia: S/. ${difference >= 0 ? '+' : ''}${difference.toFixed(2)}`,
      'Arqueo de Turno (Corte X)'
    );
  };

  const closeCurrentShift = (countedCash: number, countedCards: number, countedYape: number, notes?: string, attributedStaffName?: string) => {
    const expectedCash = activeShift.initialCash + activeShift.systemCashSales + activeShift.manualCashEntries - activeShift.manualCashWithdrawals;
    const diff = countedCash - expectedCash;

    const closed: CashShift = {
      ...activeShift,
      closedBy: attributedStaffName || currentUserRef.current?.name || 'Administrador',
      closedAt: serverDate().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      countedCashTotal: countedCash,
      countedCardTotal: countedCards,
      countedYapePlinTotal: countedYape,
      expectedCashTotal: expectedCash,
      cashDifference: diff,
      status: 'closed',
      notes
    };

    setShiftHistory(prev => [closed, ...prev]);
    sounds.playCashRegister();
    showToast('success', `Turno "${closed.shiftName}" cerrado correctamente (Corte Z)`, 'Cierre de Caja');
    addAuditLog('shift_closed', `Turno ${closed.shiftName} cerrado con diferencia de S/. ${diff.toFixed(2)}`);
  };

  const openNewShift = (shiftName: string, initialCash: number) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      shiftName,
      openedBy: currentUserRef.current?.name || 'Cajero',
      openedAt: serverDate().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      initialCash,
      systemCashSales: 0,
      systemCardSales: 0,
      systemYapePlinSales: 0,
      systemOtherSales: 0,
      systemTotalSales: 0,
      manualCashWithdrawals: 0,
      manualCashEntries: 0,
      status: 'open'
    };
    setActiveShift(newShift);
    sounds.playClick();
    showToast('success', `Nuevo turno "${shiftName}" aperturado con fondo inicial S/. ${initialCash.toFixed(2)}`);
  };

  return { activeShift, setActiveShift, shiftHistory, saveCashAudit, closeCurrentShift, openNewShift };
}
