'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as staffService from '@/services/staff.service';
import type { StaffPosition } from '@/types/restaurant';

interface UseStaffPositionsDeps {
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
}

/**
 * Catálogo de Cargos (Fase E) — puesto de trabajo, solo informativo/RRHH.
 * NO otorga permisos (eso lo hace `access_accounts.role`, distinto y
 * separado — ver docs/decisions/0008-staff-profile.md). Mismo patrón
 * fetch+realtime que `use-zones.ts`.
 */
export function useStaffPositions({ isPrivateRoute }: UseStaffPositionsDeps) {
  const [positions, setPositions] = useState<StaffPosition[]>([]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    staffService.fetchPositions().then(setPositions);
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const channel = supabase
      .channel('realtime_staff_positions_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_positions' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const nu = payload.new as any;
            setPositions(prev => prev.some(p => p.id === nu.id)
              ? prev
              : [...prev, { id: nu.id, name: nu.name, description: nu.description ?? undefined, sortOrder: nu.sort_order ?? 0 }].sort((a, b) => a.sortOrder - b.sortOrder));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const nu = payload.new as any;
            setPositions(prev => prev.map(p => p.id === nu.id
              ? { id: nu.id, name: nu.name, description: nu.description ?? undefined, sortOrder: nu.sort_order ?? 0 }
              : p));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const ou = payload.old as any;
            setPositions(prev => prev.filter(p => p.id !== ou.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isPrivateRoute]);

  const addPosition = useCallback(async (name: string, description = '') => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const nextOrder = positions.length > 0 ? Math.max(...positions.map(p => p.sortOrder)) + 1 : 1;
    const created = await staffService.insertPosition(trimmed, description.trim(), nextOrder);
    if (created) setPositions(prev => [...prev, created]);
    return created;
  }, [positions]);

  const removePosition = useCallback(async (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
    await staffService.deletePosition(id);
  }, []);

  return { positions, addPosition, removePosition };
}
