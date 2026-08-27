'use client';

import { useEffect, useState } from 'react';
import { RestaurantInfo, GastroThemePreset, ThemeColors } from '@/types/restaurant';
import { GASTRO_THEMES, INITIAL_RESTAURANT } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { serverDate } from '@/lib/server-time';
import { sounds } from '@/lib/utils';
import { ToastMessage } from './use-toasts';
import * as restaurantService from '@/services/restaurant.service';

interface UseRestaurantProfileDeps {
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  /**
   * Se dispara cuando `restaurants.force_logout_timestamp`/`auth_version`
   * cambian por tiempo real — es el kill-switch de sesión (dominio Auth).
   * Se recibe como dependencia en vez de importar useAuth directamente, para
   * que este hook no tenga que saber nada de autenticación.
   */
  onRestaurantRealtimeSignal: () => void;
}

/**
 * Perfil del restaurante y tema visual. Extraído tal cual estaba en
 * RestaurantContext.tsx (Fase 2a: reorganización, sin cambiar comportamiento).
 */
export function useRestaurantProfile({ showToast, onRestaurantRealtimeSignal }: UseRestaurantProfileDeps) {
  // Arranca siempre con el mismo valor que renderiza el servidor (evita un
  // desajuste de hidratación) y recién aplica lo guardado en localStorage
  // dentro de un useEffect, después de que el cliente ya hidrató.
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(INITIAL_RESTAURANT);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('eterra_restaurant_info');
    if (saved) {
      try {
        setRestaurant(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const currentThemeColors: ThemeColors = restaurant.themePreset === 'custom' && restaurant.customTheme
    ? restaurant.customTheme
    : GASTRO_THEMES[restaurant.themePreset]?.colors || GASTRO_THEMES.marisqueria.colors;

  // Aplicar Variables CSS Dinámicas según el Tema Seleccionado
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', currentThemeColors.primary);
      root.style.setProperty('--color-primary-hover', currentThemeColors.primaryHover);
      root.style.setProperty('--color-secondary', currentThemeColors.secondary);
      root.style.setProperty('--color-accent', currentThemeColors.accent);
      root.style.setProperty('--color-bg-light', currentThemeColors.bgLight || '#f8fafc');
      root.style.setProperty('--color-bg-card', currentThemeColors.bgCard || '#ffffff');
      root.style.setProperty('--color-text-main', currentThemeColors.textMain || '#0f172a');
      root.style.setProperty('--color-text-muted', currentThemeColors.textMuted || '#64748b');
      root.style.setProperty('--color-border', currentThemeColors.border || '#e2e8f0');
    }
  }, [currentThemeColors]);

  // Persistencia en LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eterra_restaurant_info', JSON.stringify(restaurant));
    }
  }, [restaurant]);

  // Carga inicial + tiempo real
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    let isMounted = true;

    restaurantService.fetchRestaurant().then(cloudRest => {
      if (cloudRest && isMounted) {
        const mappedRest: RestaurantInfo = {
          ...INITIAL_RESTAURANT,
          name: cloudRest.name || INITIAL_RESTAURANT.name,
          slogan: cloudRest.slogan || INITIAL_RESTAURANT.slogan,
          story: cloudRest.story || INITIAL_RESTAURANT.story,
          phone: cloudRest.phone || INITIAL_RESTAURANT.phone,
          whatsapp: cloudRest.whatsapp || INITIAL_RESTAURANT.whatsapp,
          address: cloudRest.address || INITIAL_RESTAURANT.address,
          city: cloudRest.city || INITIAL_RESTAURANT.city,
          currency: cloudRest.currency || INITIAL_RESTAURANT.currency,
          themePreset: (cloudRest.theme_preset as GastroThemePreset) || INITIAL_RESTAURANT.themePreset,
          customTheme: cloudRest.custom_theme || INITIAL_RESTAURANT.customTheme,
        };
        setRestaurant(mappedRest);
        if (typeof window !== 'undefined') {
          localStorage.setItem('eterra_restaurant_info', JSON.stringify(mappedRest));
        }
      }
    });

    const restChannel = supabase
      .channel('realtime_restaurant_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants' },
        (payload) => {
          if (payload.new) {
            const nr = payload.new as any;
            setRestaurant(prev => ({
              ...prev,
              name: nr.name || prev.name,
              slogan: nr.slogan || prev.slogan,
              story: nr.story || prev.story,
              phone: nr.phone || prev.phone,
              whatsapp: nr.whatsapp || prev.whatsapp,
              address: nr.address || prev.address,
              city: nr.city || prev.city,
              currency: nr.currency || prev.currency,
              themePreset: (nr.theme_preset as GastroThemePreset) || prev.themePreset,
              customTheme: nr.custom_theme || prev.customTheme,
            }));
            if (nr.force_logout_timestamp || nr.auth_version) {
              onRestaurantRealtimeSignal();
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase?.removeChannel(restChannel);
    };
  }, [onRestaurantRealtimeSignal]);

  const setThemePreset = (preset: GastroThemePreset) => {
    sounds.playClick();
    setRestaurant(prev => {
      const updated = { ...prev, themePreset: preset };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eterra_restaurant_info', JSON.stringify(updated));
      }
      return updated;
    });
    restaurantService.upsertRestaurant({
      slug: 'eterra-peru',
      name: restaurant.name,
      theme_preset: preset,
      updated_at: serverDate().toISOString()
    });
    showToast('success', `Estilo visual cambiado a: ${GASTRO_THEMES[preset].name}`);
  };

  const updateCustomTheme = (colors: ThemeColors) => {
    setRestaurant(prev => {
      const updated: RestaurantInfo = { ...prev, themePreset: 'custom' as GastroThemePreset, customTheme: colors };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eterra_restaurant_info', JSON.stringify(updated));
      }
      return updated;
    });
    restaurantService.upsertRestaurant({
      slug: 'eterra-peru',
      name: restaurant.name,
      theme_preset: 'custom',
      custom_theme: colors,
      updated_at: serverDate().toISOString()
    });
    showToast('success', 'Paleta personalizada aplicada con éxito');
  };

  const updateRestaurantInfo = (info: Partial<RestaurantInfo>) => {
    setRestaurant(prev => {
      const updated = { ...prev, ...info };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eterra_restaurant_info', JSON.stringify(updated));
      }
      return updated;
    });
    restaurantService.upsertRestaurant({
      slug: 'eterra-peru',
      name: info.name || restaurant.name,
      slogan: info.slogan,
      story: info.story,
      phone: info.phone,
      whatsapp: info.whatsapp,
      address: info.address,
      city: info.city,
      currency: info.currency,
      updated_at: serverDate().toISOString()
    });
    showToast('success', 'Configuración de ÉTERRA guardada y sincronizada en la nube');
  };

  return {
    restaurant,
    currentThemeColors,
    setThemePreset,
    updateCustomTheme,
    updateRestaurantInfo
  };
}
