/**
 * Acceso a datos de `role_permissions` (Fase G). Aplica solo a
 * access_accounts.role (Nivel 1) — el PIN de Personal (Nivel 2) nunca tiene
 * permisos propios.
 */

import { supabase } from '@/lib/supabase';

export interface RolePermission {
  id: string;
  role: string;
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

function mapRow(row: any): RolePermission {
  return {
    id: row.id,
    role: row.role,
    module: row.module,
    canView: Boolean(row.can_view),
    canEdit: Boolean(row.can_edit),
    canDelete: Boolean(row.can_delete)
  };
}

export async function fetchRolePermissions(): Promise<RolePermission[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('role_permissions').select('*');
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function upsertPermission(input: {
  id?: string;
  role: string;
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}): Promise<void> {
  if (!supabase) return;
  try {
    if (input.id) {
      await supabase.from('role_permissions').update({
        can_view: input.canView,
        can_edit: input.canEdit,
        can_delete: input.canDelete
      }).eq('id', input.id);
    } else {
      await supabase.from('role_permissions').insert({
        role: input.role,
        module: input.module,
        can_view: input.canView,
        can_edit: input.canEdit,
        can_delete: input.canDelete
      });
    }
  } catch {
    // Silencioso, igual que el resto de servicios.
  }
}
