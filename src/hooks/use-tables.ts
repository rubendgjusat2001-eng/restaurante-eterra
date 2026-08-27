'use client';

import { useCallback, useEffect, useState } from 'react';
import { Table } from '@/types/restaurant';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sounds } from '@/lib/utils';
import { ToastMessage } from './use-toasts';
import * as tablesService from '@/services/tables.service';

interface UseTablesDeps {
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'system_action', description: string) => void;
}

/**
 * Mesas y salones. Extraído tal cual estaba en RestaurantContext.tsx (Fase 2a:
 * reorganización, sin cambiar comportamiento). `openTable`/`transferTable`
 * (que también tocan Pedidos) viven en `use-table-lifecycle.ts`, no aquí.
 */
export function useTables({ isPrivateRoute, showToast, addAuditLog }: UseTablesDeps) {
  const [tables, setTables] = useState<Table[]>(() => []);
  const [activeZone, setActiveZone] = useState<string>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eterra_tables', JSON.stringify(tables));
    }
  }, [tables]);

  const persistTableToCloud = useCallback(async (table: Table) => {
    await tablesService.persistTableToCloud(table);
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    tablesService.fetchTables().then(mapped => setTables(mapped));
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const tablesChannel = supabase
      .channel('realtime_tables_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as any;
            setTables(prev => prev.map(t => t.id === updated.id ? {
              ...t,
              number: updated.number,
              zone: updated.zone,
              capacity: updated.capacity,
              status: updated.status,
              customerCount: updated.customer_count,
              currentOrderId: updated.current_order_id,
              seatedAt: updated.seated_at,
              openedTimestamp: updated.opened_timestamp,
              openedByUserId: updated.opened_by_user_id,
              openedByUserName: updated.opened_by_user_name,
              assignedWaiterId: updated.assigned_waiter_id,
              assignedWaiterName: updated.assigned_waiter_name,
              closedByUserId: updated.closed_by_user_id,
              closedByUserName: updated.closed_by_user_name,
              closedAt: updated.closed_at
            } : t));
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const added = payload.new as any;
            setTables(prev => {
              if (prev.some(t => t.id === added.id)) return prev;
              return [...prev, {
                id: added.id,
                number: added.number,
                zone: added.zone,
                capacity: added.capacity,
                status: added.status,
                customerCount: added.customer_count,
                currentOrderId: added.current_order_id
              }];
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deleted = payload.old as any;
            setTables(prev => prev.filter(t => t.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(tablesChannel);
    };
  }, [isPrivateRoute]);

  const requestTableBill = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const updated: Table = { ...table, status: 'bill_requested' };
      setTables(prev => prev.map(tbl => tbl.id === tableId ? updated : tbl));
      persistTableToCloud(updated);
    }
    sounds.playClick();
    showToast('info', 'Pre-cuenta solicitada. La mesa ahora está en color azul.');
  };

  const cleanTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const updated: Table = {
        ...table,
        status: 'available',
        currentOrderId: undefined,
        customerCount: undefined,
        seatedAt: undefined,
        openedTimestamp: undefined,
        openedByUserId: undefined,
        openedByUserName: undefined,
        assignedWaiterId: undefined,
        assignedWaiterName: undefined,
        closedByUserId: undefined,
        closedByUserName: undefined,
        closedAt: undefined
      };
      setTables(prev => prev.map(tbl => tbl.id === tableId ? updated : tbl));
      persistTableToCloud(updated);
    }
    sounds.playClick();
    showToast('success', 'Mesa limpia y disponible para nuevos clientes');
  };

  const addTable = (tableData: { number: string; zone: string; capacity: number }) => {
    const newId = `tbl-${Date.now()}`;
    const newTable: Table = {
      id: newId,
      number: tableData.number,
      zone: tableData.zone,
      capacity: tableData.capacity,
      status: 'available'
    };
    setTables(prev => [...prev, newTable]);
    persistTableToCloud(newTable);
    sounds.playClick();
    showToast('success', `Nueva mesa "${newTable.number}" creada en ${newTable.zone}`);
    addAuditLog('system_action', `Mesa ${newTable.number} agregada al salón ${newTable.zone}`);
  };

  const updateTable = (tableId: string, updates: Partial<Table>) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const updated = { ...table, ...updates };
      setTables(prev => prev.map(tbl => tbl.id === tableId ? updated : tbl));
      persistTableToCloud(updated);
    }
    sounds.playClick();
    showToast('success', 'Mesa actualizada correctamente');
  };

  const deleteTable = (tableId: string): boolean => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return false;
    if (table.status !== 'available' && table.status !== 'cleaning') {
      showToast('error', 'No se puede eliminar una mesa con comanda activa');
      return false;
    }
    setTables(prev => prev.filter(t => t.id !== tableId));
    tablesService.deleteTableRow(tableId);
    sounds.playClick();
    showToast('info', `Mesa ${table.number} eliminada del plano`);
    addAuditLog('system_action', `Mesa ${table.number} eliminada`);
    return true;
  };

  return {
    tables,
    setTables,
    activeZone,
    setActiveZone,
    persistTableToCloud,
    requestTableBill,
    cleanTable,
    addTable,
    updateTable,
    deleteTable
  };
}
