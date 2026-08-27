/**
 * Acceso a datos de la tabla `restaurant_zones` (Fase D). Mismo patrón que
 * `tables.service.ts`: mapRow + fetch + escrituras con try/catch silencioso.
 */

import { supabase } from '@/lib/supabase';

export interface RestaurantZone {
  id: string;
  name: string;
  sortOrder: number;
}

function mapRow(row: any): RestaurantZone {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order ?? 0
  };
}

export async function fetchZones(): Promise<RestaurantZone[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('restaurant_zones')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function insertZone(name: string, sortOrder: number): Promise<RestaurantZone | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('restaurant_zones')
      .insert({ name, sort_order: sortOrder })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

export async function updateZone(id: string, updates: { name?: string; sortOrder?: number }): Promise<void> {
  if (!supabase) return;
  try {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    await supabase.from('restaurant_zones').update(payload).eq('id', id);
  } catch {
    // Silencioso, igual que el resto de servicios — la UI ya actualizó el
    // estado local de forma optimista.
  }
}

export async function deleteZone(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('restaurant_zones').delete().eq('id', id);
  } catch {
    // Silencioso
  }
}
