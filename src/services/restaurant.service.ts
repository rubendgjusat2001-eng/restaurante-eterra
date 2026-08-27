/**
 * Acceso a datos de la tabla `restaurants`. FASE 2a — esto es solo una
 * reorganización de código: sigue llamando a Supabase directo desde el
 * navegador con la anon key, exactamente la misma postura de seguridad que
 * antes de este cambio. Esto NO es "la capa de servicios" que menciona
 * docs/decisions/0002-rls-posture-phase1.md (esa se refiere a mover las
 * escrituras a rutas de servidor para poder cerrar RLS — un trabajo aparte,
 * todavía pendiente). Ver CLAUDE.md §6.3.
 */

import { supabase } from '@/lib/supabase';

export async function fetchRestaurant(): Promise<Record<string, any> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('restaurants').select('*').limit(1).maybeSingle();
  if (error || !data) return null;
  return data;
}

export function upsertRestaurant(payload: Record<string, any>): void {
  if (!supabase) return;
  supabase.from('restaurants').upsert(payload, { onConflict: 'slug' }).then();
}
