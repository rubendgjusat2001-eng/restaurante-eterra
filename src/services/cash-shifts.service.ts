/**
 * Acceso a datos de `cash_shifts` + `cash_movements` (Fase F). La tabla
 * cash_shifts existía desde la Fase 1 pero el código nunca la usaba — todo
 * vivía solo en memoria (`use-cash-shifts.ts`), se perdía al recargar.
 */

import { supabase } from '@/lib/supabase';
import { CashShift, CashMovement } from '@/types/restaurant';

function mapRow(row: any): CashShift {
  return {
    id: row.id,
    shiftName: row.shift_name,
    openedBy: row.opened_by,
    closedBy: row.closed_by ?? undefined,
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? undefined,
    initialCash: Number(row.initial_cash) || 0,
    systemCashSales: Number(row.system_cash_sales) || 0,
    systemCardSales: Number(row.system_card_sales) || 0,
    systemYapePlinSales: Number(row.system_yape_plin_sales) || 0,
    systemOtherSales: Number(row.system_other_sales) || 0,
    systemTotalSales: Number(row.system_total_sales) || 0,
    manualCashWithdrawals: Number(row.manual_cash_withdrawals) || 0,
    manualCashEntries: Number(row.manual_cash_entries) || 0,
    countedCashBreakdown: row.counted_cash_breakdown ?? undefined,
    countedCashTotal: row.counted_cash_total !== null ? Number(row.counted_cash_total) : undefined,
    countedCardTotal: row.counted_card_total !== null ? Number(row.counted_card_total) : undefined,
    countedYapePlinTotal: row.counted_yape_plin_total !== null ? Number(row.counted_yape_plin_total) : undefined,
    expectedCashTotal: undefined,
    cashDifference: row.cash_difference !== null ? Number(row.cash_difference) : undefined,
    status: row.status,
    notes: row.notes ?? undefined
  };
}

/** El turno abierto (si existe) — a lo sumo uno, reforzado también por índice único en la BD. */
export async function fetchOpenShift(): Promise<CashShift | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('cash_shifts').select('*').eq('status', 'open').maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function fetchShiftHistory(): Promise<CashShift[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cash_shifts')
    .select('*')
    .eq('status', 'closed')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function persistShiftToCloud(shift: CashShift): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase no configurado' };
  try {
    const { error } = await supabase.from('cash_shifts').upsert({
      id: shift.id,
      shift_name: shift.shiftName,
      opened_by: shift.openedBy,
      closed_by: shift.closedBy ?? null,
      opened_at: shift.openedAt,
      closed_at: shift.closedAt ?? null,
      initial_cash: shift.initialCash,
      system_cash_sales: shift.systemCashSales,
      system_card_sales: shift.systemCardSales,
      system_yape_plin_sales: shift.systemYapePlinSales,
      system_other_sales: shift.systemOtherSales,
      system_total_sales: shift.systemTotalSales,
      manual_cash_withdrawals: shift.manualCashWithdrawals,
      manual_cash_entries: shift.manualCashEntries,
      counted_cash_breakdown: shift.countedCashBreakdown ?? null,
      counted_cash_total: shift.countedCashTotal ?? null,
      counted_card_total: shift.countedCardTotal ?? null,
      counted_yape_plin_total: shift.countedYapePlinTotal ?? null,
      cash_difference: shift.cashDifference ?? null,
      status: shift.status,
      notes: shift.notes ?? null
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// --- Movimientos de caja (egresos/ingresos por categoría) ---

function mapMovementRow(row: any): CashMovement {
  return {
    id: row.id,
    shiftId: row.shift_id,
    movementType: row.movement_type,
    category: row.category,
    concept: row.concept,
    amount: Number(row.amount) || 0,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at
  };
}

export async function fetchShiftMovements(shiftId: string): Promise<CashMovement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapMovementRow);
}

export async function insertMovement(movement: {
  shiftId: string;
  movementType: 'expense' | 'income';
  category: string;
  concept: string;
  amount: number;
  createdBy?: string;
}): Promise<CashMovement | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        shift_id: movement.shiftId,
        movement_type: movement.movementType,
        category: movement.category,
        concept: movement.concept,
        amount: movement.amount,
        created_by: movement.createdBy ?? null
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapMovementRow(data);
  } catch {
    return null;
  }
}
