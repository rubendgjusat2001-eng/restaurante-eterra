'use client';

import { useEffect, useState, type RefObject } from 'react';
import { StaffUser, UserRole } from '@/types/restaurant';
import { STAFF_MEMBERS } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sounds } from '@/lib/utils';
import { ToastMessage } from './use-toasts';
import * as staffService from '@/services/staff.service';

interface UseStaffDeps {
  /**
   * Se lee por referencia (no por valor) porque este hook se construye antes
   * que useAuth en el árbol de RestaurantProvider — Auth necesita `staff`, y
   * Personal necesita `currentUser` para el permiso de `updateUserPin`. Un
   * ref roto ese ciclo sin que un hook llame a otro directamente.
   */
  currentUserRef: RefObject<StaffUser | null>;
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'system_action', description: string) => void;
}

/**
 * Personal del restaurante (colaboradores de staff_users, Nivel 2). Extraído
 * tal cual estaba en RestaurantContext.tsx (Fase 2a: reorganización, sin
 * cambiar comportamiento) — de paso, se colapsan los dos efectos que cargaban
 * la misma tabla dos veces en el archivo original (simplificación pura, sin
 * cambio de comportamiento).
 */
export function useStaff({ currentUserRef, isPrivateRoute, showToast, addAuditLog }: UseStaffDeps) {
  const [staff, setStaff] = useState<StaffUser[]>(() => STAFF_MEMBERS);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    staffService.fetchStaff().then(mapped => {
      if (mapped.length > 0) setStaff(mapped);
    });
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const staffChannel = supabase
      .channel('realtime_staff_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_users' },
        (payload) => {
          // La fila 'system-security' es un hack legado (Fase 0) ya retirado —
          // se ignora por completo si aún queda alguna hasta que corra la
          // migración de limpieza final.
          const nu = payload.new as any;
          const ou = payload.old as any;
          if ((nu && (nu.id === 'system-security' || nu.role === 'system')) ||
              (ou && (ou.id === 'system-security' || ou.role === 'system'))) {
            return;
          }

          if (payload.eventType === 'INSERT' && nu) {
            setStaff(prev => prev.some(u => u.id === nu.id) ? prev : [...prev, {
              id: nu.id,
              name: nu.name,
              role: nu.role,
              pin: '',
              avatar: nu.avatar || '👤',
              color: 'from-slate-600 to-slate-800',
              active: true
            }]);
          } else if (payload.eventType === 'UPDATE' && nu) {
            setStaff(prev => prev.map(u => u.id === nu.id ? { ...u, name: nu.name, role: nu.role, avatar: nu.avatar || u.avatar } : u));
          } else if (payload.eventType === 'DELETE' && ou) {
            setStaff(prev => prev.filter(u => u.id !== ou.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(staffChannel);
    };
  }, [isPrivateRoute]);

  const addStaffUser = (newUser: { name: string; role: UserRole; pin: string; avatar?: string }) => {
    const created: StaffUser = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      role: newUser.role,
      pin: '',
      avatar: newUser.avatar || '👤',
      color: 'from-slate-600 to-slate-800',
      active: true
    };
    setStaff(prev => [...prev, created]);
    staffService.insertStaff(created);
    // El PIN se hashea y guarda del lado del servidor — nunca en texto plano.
    staffService.setStaffPin(created.id, newUser.pin).catch(() => {});
    sounds.playClick();
    showToast('success', `Personal ${created.name} (${created.role.toUpperCase()}) registrado`);
    addAuditLog('system_action', `Nuevo personal registrado: ${created.name} (${created.role})`);
  };

  const deleteStaffUser = (userId: string) => {
    const target = staff.find(s => s.id === userId);
    if (target?.role === 'owner') {
      showToast('error', 'No se puede eliminar la cuenta principal de Dueño');
      return;
    }
    setStaff(prev => prev.filter(s => s.id !== userId));
    staffService.deleteStaffRow(userId);
    sounds.playClick();
    showToast('info', `Usuario ${target?.name} eliminado`);
    addAuditLog('system_action', `Personal eliminado: ${target?.name}`);
  };

  const updateUserPin = (userId: string, newPin: string) => {
    const cu = currentUserRef.current;
    if (cu?.role !== 'owner' && cu?.role !== 'manager') {
      showToast('error', 'Solo el Dueño o Gerente pueden modificar PINs de colaboradores');
      return;
    }
    staffService.setStaffPin(userId, newPin)
      .then(res => {
        if (res.ok) {
          sounds.playClick();
          showToast('success', 'PIN de acceso actualizado con éxito');
          addAuditLog('system_action', `PIN actualizado para usuario ID: ${userId}`);
        } else {
          showToast('error', 'No se pudo actualizar el PIN');
        }
      })
      .catch(() => showToast('error', 'Error de conexión al actualizar el PIN'));
  };

  return { staff, setStaff, addStaffUser, deleteStaffUser, updateUserPin };
}
