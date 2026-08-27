/**
 * Acceso a datos de `audit_logs` (Fase I). Mismo patrón que el resto de
 * servicios — escritura silenciosa (nunca debe interrumpir la acción que
 * está siendo auditada si la nube falla momentáneamente).
 */

import { supabase } from '@/lib/supabase';
import { AuditLog } from '@/types/restaurant';

function mapRow(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.ts_label,
    userId: row.user_id || 'sys',
    userName: row.user_name || 'Sistema',
    userRole: row.user_role || 'customer',
    action: row.action,
    description: row.description,
    metadata: row.metadata ?? undefined
  };
}

export async function fetchAuditLogs(limit = 200): Promise<AuditLog[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function persistAuditLog(log: AuditLog): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert({
      id: log.id,
      ts_label: log.timestamp,
      user_id: log.userId,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      description: log.description,
      metadata: log.metadata ?? null
    });
  } catch (e) {
    console.warn('Persist audit log cloud error:', e);
  }
}
