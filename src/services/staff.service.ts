/**
 * Acceso a datos de la tabla `staff_users` (+ `staff_positions`/
 * `staff_expenses`, Fase E: expediente de personal). El PIN nunca se lee ni
 * se escribe aquí en texto plano: eso pasa por /api/auth/set-staff-pin
 * (servidor, bcrypt). Ver CLAUDE.md §4-5.
 */

import { supabase } from '@/lib/supabase';
import { StaffUser, StaffPosition, StaffExpense } from '@/types/restaurant';

function mapRow(row: any): StaffUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    pin: '',
    avatar: row.avatar || '👤',
    color: 'from-slate-600 to-slate-800',
    active: true,
    positionId: row.position_id ?? undefined,
    phone: row.phone ?? undefined,
    documentId: row.document_id ?? undefined,
    email: row.email ?? undefined,
    hireDate: row.hire_date ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined
  };
}

export async function fetchStaff(): Promise<StaffUser[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('staff_users').select('*');
  if (error || !data) return [];
  return data
    .filter((u: any) => u.id !== 'system-security' && u.role !== 'system')
    .map(mapRow);
}

export function insertStaff(created: { id: string; name: string; role: string; avatar: string }): void {
  if (!supabase) return;
  supabase.from('staff_users').insert({
    id: created.id,
    name: created.name,
    role: created.role,
    avatar: created.avatar
  }).then();
}

export function deleteStaffRow(userId: string): void {
  if (!supabase) return;
  supabase.from('staff_users').delete().eq('id', userId).then();
}

export function setStaffPin(staffId: string, pin: string): Promise<Response> {
  return fetch('/api/auth/set-staff-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, pin })
  });
}

/** Expediente (Fase E): edita nombre/cargo/contacto — nunca el PIN ni el rol operativo. */
export async function updateStaffProfile(id: string, updates: {
  name?: string;
  positionId?: string | null;
  phone?: string;
  documentId?: string;
  email?: string;
  hireDate?: string;
  address?: string;
  notes?: string;
}): Promise<void> {
  if (!supabase) return;
  try {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.positionId !== undefined) payload.position_id = updates.positionId;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.documentId !== undefined) payload.document_id = updates.documentId;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.hireDate !== undefined) payload.hire_date = updates.hireDate || null;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    await supabase.from('staff_users').update(payload).eq('id', id);
  } catch {
    // Silencioso, igual que el resto de servicios.
  }
}

// --- Cargos (staff_positions) ---

function mapPositionRow(row: any): StaffPosition {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sortOrder: row.sort_order ?? 0
  };
}

export async function fetchPositions(): Promise<StaffPosition[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('staff_positions').select('*').order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data.map(mapPositionRow);
}

export async function insertPosition(name: string, description: string, sortOrder: number): Promise<StaffPosition | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('staff_positions')
      .insert({ name, description: description || null, sort_order: sortOrder })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapPositionRow(data);
  } catch {
    return null;
  }
}

export async function deletePosition(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('staff_positions').delete().eq('id', id);
  } catch {
    // Silencioso
  }
}

// --- Gastos/pagos por colaborador (staff_expenses) ---

function mapExpenseRow(row: any): StaffExpense {
  return {
    id: row.id,
    staffId: row.staff_id,
    concept: row.concept,
    amount: Number(row.amount) || 0,
    expenseDate: row.expense_date,
    createdBy: row.created_by ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at
  };
}

export async function fetchStaffExpenses(staffId: string): Promise<StaffExpense[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('staff_expenses')
    .select('*')
    .eq('staff_id', staffId)
    .order('expense_date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapExpenseRow);
}

export async function insertStaffExpense(expense: {
  staffId: string;
  concept: string;
  amount: number;
  expenseDate: string;
  createdBy?: string;
  notes?: string;
}): Promise<StaffExpense | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('staff_expenses')
      .insert({
        staff_id: expense.staffId,
        concept: expense.concept,
        amount: expense.amount,
        expense_date: expense.expenseDate,
        created_by: expense.createdBy ?? null,
        notes: expense.notes ?? null
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapExpenseRow(data);
  } catch {
    return null;
  }
}

export { mapRow as mapStaffRow };
