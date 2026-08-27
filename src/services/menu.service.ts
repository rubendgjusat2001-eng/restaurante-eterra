/**
 * Acceso a datos de la tabla `menu_items`. FASE 2a — reorganización de código
 * solamente, misma anon key y misma postura de RLS que antes.
 */

import { supabase } from '@/lib/supabase';
import { MenuItem, DishStation } from '@/types/restaurant';

function mapRow(m: any): MenuItem {
  return {
    id: m.id,
    categoryId: m.category_id,
    name: m.name,
    description: m.description || '',
    price: Number(m.price) || 0,
    costPrice: Number(m.cost_price) || Math.round((Number(m.price) || 0) * 0.35),
    imageUrl: m.image_url || 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&auto=format&fit=crop&q=80',
    station: (m.station as DishStation) || 'kitchen_cold',
    isAvailable: m.is_available ?? true,
    isFeatured: m.is_featured ?? false,
    preparationMinutes: m.preparation_minutes || 12,
    tags: m.tags || ['Especialidad de la Casa'],
    modifierGroups: m.modifier_groups || []
  };
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('menu_items').select('*');
  if (error || !data) return [];
  return data.map(mapRow);
}

export function updateAvailability(dishId: string, isAvailable: boolean): void {
  if (!supabase) return;
  supabase.from('menu_items').update({ is_available: isAvailable }).eq('id', dishId).then();
}

export function updateDishRow(dish: MenuItem): void {
  if (!supabase) return;
  supabase.from('menu_items').update({
    name: dish.name,
    description: dish.description,
    price: dish.price,
    station: dish.station,
    is_available: dish.isAvailable,
    is_featured: dish.isFeatured
  }).eq('id', dish.id).then();
}

export function insertDish(dish: MenuItem): void {
  if (!supabase) return;
  supabase.from('menu_items').insert({
    id: dish.id,
    category_id: dish.categoryId,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    image_url: dish.imageUrl || null,
    station: dish.station,
    is_available: dish.isAvailable,
    is_featured: dish.isFeatured || false
  }).then();
}

export function deleteDishRow(dishId: string): void {
  if (!supabase) return;
  supabase.from('menu_items').delete().eq('id', dishId).then();
}
