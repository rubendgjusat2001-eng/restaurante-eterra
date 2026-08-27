'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as zonesService from '@/services/zones.service';
import type { RestaurantZone } from '@/services/zones.service';

interface UseZonesDeps {
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
}

/**
 * Zonas/salones configurables del local (Fase D, reemplaza el tipo
 * hardcodeado que tenía `Table.zone`). Mismo patrón fetch+realtime que
 * `use-tables.ts`.
 */
export function useZones({ isPrivateRoute }: UseZonesDeps) {
  const [zones, setZones] = useState<RestaurantZone[]>([]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    zonesService.fetchZones().then(setZones);
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const zonesChannel = supabase
      .channel('realtime_zones_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_zones' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const nu = payload.new as any;
            setZones(prev => prev.some(z => z.id === nu.id)
              ? prev
              : [...prev, { id: nu.id, name: nu.name, sortOrder: nu.sort_order ?? 0 }].sort((a, b) => a.sortOrder - b.sortOrder));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const nu = payload.new as any;
            setZones(prev => prev.map(z => z.id === nu.id
              ? { id: nu.id, name: nu.name, sortOrder: nu.sort_order ?? 0 }
              : z).sort((a, b) => a.sortOrder - b.sortOrder));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const ou = payload.old as any;
            setZones(prev => prev.filter(z => z.id !== ou.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(zonesChannel);
    };
  }, [isPrivateRoute]);

  const addZone = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const nextOrder = zones.length > 0 ? Math.max(...zones.map(z => z.sortOrder)) + 1 : 1;
    const created = await zonesService.insertZone(trimmed, nextOrder);
    if (created) setZones(prev => [...prev, created]);
    return created;
  }, [zones]);

  const renameZone = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setZones(prev => prev.map(z => z.id === id ? { ...z, name: trimmed } : z));
    await zonesService.updateZone(id, { name: trimmed });
  }, []);

  const removeZone = useCallback(async (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
    await zonesService.deleteZone(id);
  }, []);

  return { zones, addZone, renameZone, removeZone };
}
