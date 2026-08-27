'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as rolePermissionsService from '@/services/role-permissions.service';
import type { RolePermission } from '@/services/role-permissions.service';

interface UsePermissionsDeps {
  /** Rol de la cuenta de acceso logueada (Nivel 1) — NUNCA el rol operativo de Personal (Nivel 2). */
  role: string | undefined;
  isPrivateRoute: boolean;
}

/**
 * Permisos de Roles configurables (Fase G) — aplica solo a `access_accounts.
 * role` (Nivel 1). Dos redes de seguridad deliberadas para nunca dejar a
 * nadie bloqueado por un dato faltante o mal cargado:
 *   1. `owner` siempre tiene acceso total, sin importar lo que diga la BD.
 *   2. Si la tabla todavía no tiene filas (p. ej. la migración 011 no se ha
 *      corrido todavía), no se oculta nada — se comporta como antes de esta
 *      fase, en vez de dejar el sistema en blanco.
 * Ver docs/decisions/0010-role-permissions.md.
 */
export function usePermissions({ role, isPrivateRoute }: UsePermissionsDeps) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    rolePermissionsService.fetchRolePermissions().then(list => {
      setPermissions(list);
      setPermissionsLoaded(true);
    });
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const channel = supabase
      .channel('realtime_role_permissions_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_permissions' },
        (payload) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const nu = payload.new as any;
            const mapped: RolePermission = {
              id: nu.id, role: nu.role, module: nu.module,
              canView: Boolean(nu.can_view), canEdit: Boolean(nu.can_edit), canDelete: Boolean(nu.can_delete)
            };
            setPermissions(prev => prev.some(p => p.id === mapped.id)
              ? prev.map(p => p.id === mapped.id ? mapped : p)
              : [...prev, mapped]);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const ou = payload.old as any;
            setPermissions(prev => prev.filter(p => p.id !== ou.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isPrivateRoute]);

  const getPermission = useCallback(
    (module: string) => permissions.find(p => p.role === role && p.module === module),
    [permissions, role]
  );

  const canView = useCallback((module: string) => {
    if (role === 'owner') return true;
    if (!permissionsLoaded || permissions.length === 0) return true;
    return getPermission(module)?.canView ?? false;
  }, [role, permissionsLoaded, permissions, getPermission]);

  const canEdit = useCallback((module: string) => {
    if (role === 'owner') return true;
    if (!permissionsLoaded || permissions.length === 0) return true;
    return getPermission(module)?.canEdit ?? false;
  }, [role, permissionsLoaded, permissions, getPermission]);

  const canDelete = useCallback((module: string) => {
    if (role === 'owner') return true;
    if (!permissionsLoaded || permissions.length === 0) return true;
    return getPermission(module)?.canDelete ?? false;
  }, [role, permissionsLoaded, permissions, getPermission]);

  const savePermission = useCallback(async (input: { role: string; module: string; canView: boolean; canEdit: boolean; canDelete: boolean }) => {
    const existing = permissions.find(p => p.role === input.role && p.module === input.module);
    await rolePermissionsService.upsertPermission({ id: existing?.id, ...input });
    setPermissions(prev => existing
      ? prev.map(p => p.id === existing.id ? { ...p, ...input } : p)
      : [...prev, { id: `temp-${Date.now()}`, ...input }]);
  }, [permissions]);

  return { permissions, canView, canEdit, canDelete, savePermission };
}
