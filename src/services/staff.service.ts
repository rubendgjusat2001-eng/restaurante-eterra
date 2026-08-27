/**
 * Acceso a datos de la tabla `staff_users`. FASE 2a — reorganización de
 * código solamente, misma anon key y misma postura de RLS que antes. El PIN
 * nunca se lee ni se escribe aquí en texto plano: eso pasa por
 * /api/auth/set-staff-pin (servidor, bcrypt). Ver CLAUDE.md §4-5.
 */

import { supabase } from '@/lib/supabase';
import { StaffUser } from '@/types/restaurant';

function mapRow(row: any): StaffUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    pin: '',
    avatar: row.avatar || '👤',
    color: 'from-slate-600 to-slate-800',
    active: true
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

export { mapRow as mapStaffRow };
