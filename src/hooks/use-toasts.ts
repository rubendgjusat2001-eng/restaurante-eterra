'use client';

import { useCallback, useState } from 'react';
import { sounds } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

/**
 * Notificaciones toast + interruptor de sonido. Extraído tal cual estaba en
 * RestaurantContext.tsx (Fase 2a: reorganización, sin cambiar comportamiento).
 *
 * Nota heredada: `soundEnabled`/`setSoundEnabled` existen pero nada los lee
 * todavía antes de reproducir un sonido — es deuda técnica ya documentada en
 * CLAUDE.md §6, se corrige en Fase 2b, no en este paso.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const showToast = useCallback((type: ToastMessage['type'], message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);

    if (type === 'success') sounds.playClick();
    if (type === 'error') sounds.playAlert();
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast, soundEnabled, setSoundEnabled };
}
