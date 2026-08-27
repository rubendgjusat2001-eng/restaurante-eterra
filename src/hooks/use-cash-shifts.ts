'use client';

import { useEffect, useState, type RefObject } from 'react';
import { CashShift, CashDenominationCount, StaffUser } from '@/types/restaurant';
import { INITIAL_SHIFT } from '@/lib/constants';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as cashShiftsService from '@/services/cash-shifts.service';
import { ToastMessage } from './use-toasts';

interface UseCashShiftsDeps {
  currentUserRef: RefObject<StaffUser | null>;
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'shift_closed', description: string) => void;
}

/**
 * Caja y turnos (Fase F) — ahora persiste de verdad en Supabase (antes vivía
 * solo en memoria, se perdía al recargar). Regla dura: nunca dos turnos
 * abiertos a la vez — validado aquí Y con un índice único parcial en la base
 * de datos (cubre condiciones de carrera entre dos dispositivos). Ver
 * docs/decisions/0009-cash-shifts.md.
 */
export function useCashShifts({ currentUserRef, isPrivateRoute, showToast, addAuditLog }: UseCashShiftsDeps) {
  const [activeShift, setActiveShift] = useState<CashShift>(() => INITIAL_SHIFT);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);
  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState(false);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    Promise.all([cashShiftsService.fetchOpenShift(), cashShiftsService.fetchShiftHistory()]).then(([open, history]) => {
      if (open) setActiveShift(open);
      setShiftHistory(history);
      setHasLoadedFromCloud(true);
    });
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const channel = supabase
      .channel('realtime_cash_shifts_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_shifts' },
        (payload) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const nu = payload.new as any;
            if (nu.status === 'open') {
              setActiveShift(prev => prev.id === nu.id || prev.status !== 'open' ? {
                ...prev,
                id: nu.id,
                shiftName: nu.shift_name,
                openedBy: nu.opened_by,
                openedAt: nu.opened_at,
                initialCash: Number(nu.initial_cash) || 0,
                systemCashSales: Number(nu.system_cash_sales) || 0,
                systemCardSales: Number(nu.system_card_sales) || 0,
                systemYapePlinSales: Number(nu.system_yape_plin_sales) || 0,
                systemOtherSales: Number(nu.system_other_sales) || 0,
                systemTotalSales: Number(nu.system_total_sales) || 0,
                manualCashWithdrawals: Number(nu.manual_cash_withdrawals) || 0,
                manualCashEntries: Number(nu.manual_cash_entries) || 0,
                status: 'open'
              } : prev);
            } else if (nu.status === 'closed') {
              setShiftHistory(prev => prev.some(s => s.id === nu.id) ? prev : [{
                id: nu.id,
                shiftName: nu.shift_name,
                openedBy: nu.opened_by,
                closedBy: nu.closed_by ?? undefined,
                openedAt: nu.opened_at,
                closedAt: nu.closed_at ?? undefined,
                initialCash: Number(nu.initial_cash) || 0,
                systemCashSales: Number(nu.system_cash_sales) || 0,
                systemCardSales: Number(nu.system_card_sales) || 0,
                systemYapePlinSales: Number(nu.system_yape_plin_sales) || 0,
                systemOtherSales: Number(nu.system_other_sales) || 0,
                systemTotalSales: Number(nu.system_total_sales) || 0,
                manualCashWithdrawals: Number(nu.manual_cash_withdrawals) || 0,
                manualCashEntries: Number(nu.manual_cash_entries) || 0,
                countedCashTotal: nu.counted_cash_total !== null ? Number(nu.counted_cash_total) : undefined,
                countedCardTotal: nu.counted_card_total !== null ? Number(nu.counted_card_total) : undefined,
                countedYapePlinTotal: nu.counted_yape_plin_total !== null ? Number(nu.counted_yape_plin_total) : undefined,
                cashDifference: nu.cash_difference !== null ? Number(nu.cash_difference) : undefined,
                status: 'closed',
                notes: nu.notes ?? undefined
              }, ...prev]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isPrivateRoute]);

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

    const updated: CashShift = {
      ...activeShift,
      countedCashBreakdown: breakdown,
      countedCashTotal: totalCounted,
      expectedCashTotal: expectedCash,
      cashDifference: difference,
      notes: notes || activeShift.notes
    };
    setActiveShift(updated);
    cashShiftsService.persistShiftToCloud(updated);

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
    setActiveShift(closed);
    cashShiftsService.persistShiftToCloud(closed);
    sounds.playCashRegister();
    showToast('success', `Turno "${closed.shiftName}" cerrado correctamente (Corte Z)`, 'Cierre de Caja');
    addAuditLog('shift_closed', `Turno ${closed.shiftName} cerrado con diferencia de S/. ${diff.toFixed(2)}`);
  };

  const openNewShift = (shiftName: string, initialCash: number) => {
    if (activeShift.status === 'open') {
      showToast('error', `Ya hay un turno abierto ("${activeShift.shiftName}") — ciérralo antes de abrir uno nuevo. Solo puede haber una caja abierta a la vez.`, 'Caja ya Abierta');
      sounds.playAlert();
      return;
    }

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
    cashShiftsService.persistShiftToCloud(newShift).then(res => {
      if (!res.ok && res.error?.includes('cash_shifts_one_open_per_restaurant')) {
        // Otro dispositivo abrió un turno en el mismo instante — el índice
        // único de la base de datos ganó la carrera; recargamos el estado
        // real desde la nube para no quedar desincronizados.
        cashShiftsService.fetchOpenShift().then(open => {
          if (open) setActiveShift(open);
        });
        showToast('error', 'Otro dispositivo ya abrió un turno justo ahora. Se sincronizó con el turno real.', 'Conflicto de Caja');
      }
    });
    sounds.playClick();
    showToast('success', `Nuevo turno "${shiftName}" aperturado con fondo inicial S/. ${initialCash.toFixed(2)}`);
  };

  // Egresos/ingresos manuales por categoría (ej. "Pago a Trabajadores") — se
  // suman al total ya rastreado (manualCashWithdrawals/manualCashEntries)
  // para que el Efectivo Esperado siga siendo correcto sin tener que volver
  // a sumar cash_movements en cada cálculo.
  const registerCashMovement = async (input: {
    movementType: 'expense' | 'income';
    category: string;
    concept: string;
    amount: number;
  }) => {
    if (activeShift.status !== 'open') {
      showToast('error', 'No hay un turno abierto para registrar este movimiento');
      return;
    }
    const created = await cashShiftsService.insertMovement({
      shiftId: activeShift.id,
      ...input,
      createdBy: currentUserRef.current?.name
    });
    if (!created) {
      showToast('error', 'No se pudo registrar el movimiento');
      return;
    }
    const updated: CashShift = {
      ...activeShift,
      manualCashWithdrawals: activeShift.manualCashWithdrawals + (input.movementType === 'expense' ? input.amount : 0),
      manualCashEntries: activeShift.manualCashEntries + (input.movementType === 'income' ? input.amount : 0)
    };
    setActiveShift(updated);
    cashShiftsService.persistShiftToCloud(updated);
    sounds.playClick();
    showToast('success', `${input.movementType === 'expense' ? 'Egreso' : 'Ingreso'} de S/. ${input.amount.toFixed(2)} registrado`, input.category);
  };

  return { activeShift, setActiveShift, shiftHistory, saveCashAudit, closeCurrentShift, openNewShift, registerCashMovement, hasLoadedFromCloud };
}
