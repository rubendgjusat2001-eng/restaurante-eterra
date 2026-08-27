'use client';

import { useEffect, useState, type RefObject } from 'react';
import { AuditLog, StaffUser } from '@/types/restaurant';
import { serverDate } from '@/lib/server-time';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as auditLogService from '@/services/audit-log.service';

interface UseAuditLogDeps {
  currentUserRef: RefObject<StaffUser | null>;
  /** true solo dentro de /sistema/* — el registro (escritura) siempre
   * funciona igual, solo la lectura/tiempo real que muestra el historial en
   * el Dashboard se limita a la ruta privada. */
  isPrivateRoute: boolean;
}

/**
 * Registro de auditoría (Fase I) — ahora persiste de verdad en Supabase
 * (antes vivía solo en memoria, se perdía al recargar).
 *
 * Recibe `currentUserRef` (no el valor directo) porque `addAuditLog` lo
 * necesita ANTES de que exista `useAuth()` en el árbol de hooks — Auth,
 * Personal y Auditoría se necesitan mutuamente (Auth usa `staff`, Personal usa
 * `currentUser` para permisos, Auditoría usa `currentUser` para atribuir). Un
 * ref rompe ese ciclo sin que un hook tenga que llamar a otro directamente.
 */
export function useAuditLog({ currentUserRef, isPrivateRoute }: UseAuditLogDeps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    auditLogService.fetchAuditLogs().then(setAuditLogs);
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const channel = supabase
      .channel('realtime_audit_logs_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        if (!payload.new) return;
        const nu = payload.new as any;
        setAuditLogs(prev => prev.some(l => l.id === nu.id) ? prev : [{
          id: nu.id, timestamp: nu.ts_label, userId: nu.user_id || 'sys', userName: nu.user_name || 'Sistema',
          userRole: nu.user_role || 'customer', action: nu.action, description: nu.description, metadata: nu.metadata ?? undefined
        }, ...prev]);
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isPrivateRoute]);

  const addAuditLog = (action: AuditLog['action'], description: string, metadata?: Record<string, any>) => {
    const cu = currentUserRef.current;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: serverDate().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: cu?.id || 'sys',
      userName: cu?.name || 'Sistema',
      userRole: cu?.role || 'customer',
      action,
      description,
      metadata
    };
    setAuditLogs(prev => [newLog, ...prev]);
    auditLogService.persistAuditLog(newLog);
  };

  return { auditLogs, addAuditLog };
}
