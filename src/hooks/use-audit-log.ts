'use client';

import { useState, type RefObject } from 'react';
import { AuditLog, StaffUser } from '@/types/restaurant';
import { serverDate } from '@/lib/server-time';

/**
 * Registro de auditoría. Extraído tal cual estaba (Fase 2a: reorganización,
 * sin cambiar comportamiento) — todavía vive solo en memoria, se pierde al
 * recargar la página. Persistirlo en una tabla real es Fase 2b (ver plan).
 *
 * Recibe `currentUserRef` (no el valor directo) porque `addAuditLog` lo
 * necesita ANTES de que exista `useAuth()` en el árbol de hooks — Auth,
 * Personal y Auditoría se necesitan mutuamente (Auth usa `staff`, Personal usa
 * `currentUser` para permisos, Auditoría usa `currentUser` para atribuir). Un
 * ref roto ese ciclo sin que un hook tenga que llamar a otro directamente.
 */
export function useAuditLog(currentUserRef: RefObject<StaffUser | null>) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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
  };

  return { auditLogs, addAuditLog };
}
