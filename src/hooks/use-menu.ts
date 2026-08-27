'use client';

import { useEffect, useState } from 'react';
import { MenuItem, MenuCategory } from '@/types/restaurant';
import { MENU_CATEGORIES } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sounds } from '@/lib/utils';
import { ToastMessage } from './use-toasts';
import * as menuService from '@/services/menu.service';

interface UseMenuDeps {
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'stock_depleted', description: string) => void;
}

/**
 * Carta y categorías (incluye 86-list). Extraído tal cual estaba en
 * RestaurantContext.tsx (Fase 2a: reorganización, sin cambiar comportamiento).
 */
export function useMenu({ showToast, addAuditLog }: UseMenuDeps) {
  const [categories] = useState<MenuCategory[]>(MENU_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eterra_menu_items', JSON.stringify(menuItems));
    }
  }, [menuItems]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    menuService.fetchMenuItems().then(mapped => setMenuItems(mapped));
  }, []);

  const toggleDishAvailability = (dishId: string) => {
    setMenuItems(prev => prev.map(dish => {
      if (dish.id === dishId) {
        const nextState = !dish.isAvailable;
        sounds.playClick();
        showToast(
          nextState ? 'success' : 'warning',
          `${dish.name} marcado como ${nextState ? 'DISPONIBLE' : 'AGOTADO (86-List)'}`,
          'Actualización de Stock en Vivo'
        );
        addAuditLog('stock_depleted', `${dish.name} cambiado a ${nextState ? 'Disponible' : 'Agotado'}`);
        menuService.updateAvailability(dishId, nextState);
        return { ...dish, isAvailable: nextState };
      }
      return dish;
    }));
  };

  const updateDish = (dish: MenuItem) => {
    setMenuItems(prev => prev.map(d => d.id === dish.id ? dish : d));
    showToast('success', `Plato "${dish.name}" actualizado`);
    menuService.updateDishRow(dish);
  };

  const addDish = (dish: MenuItem) => {
    setMenuItems(prev => [...prev, dish]);
    showToast('success', `Nuevo plato "${dish.name}" agregado a la carta`);
    menuService.insertDish(dish);
  };

  const deleteDish = (dishId: string) => {
    setMenuItems(prev => prev.filter(d => d.id !== dishId));
    menuService.deleteDishRow(dishId);
    sounds.playClick();
    showToast('info', 'Plato eliminado de la carta');
  };

  return { categories, menuItems, setMenuItems, toggleDishAvailability, updateDish, addDish, deleteDish };
}
