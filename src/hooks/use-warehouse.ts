'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as warehouseService from '@/services/warehouse.service';
import type { WarehouseItem, WarehouseSupplier } from '@/types/restaurant';
import { sounds } from '@/lib/utils';
import type { ToastMessage } from './use-toasts';

interface UseWarehouseDeps {
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
  currentUserName: string | undefined;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
}

/**
 * Almacén (Fase H, módulo nuevo). Mismo patrón fetch+realtime que el resto
 * de dominios. Los movimientos de stock (`warehouse_movements`) se consultan
 * bajo demanda por insumo (mismo enfoque que `staff_expenses`, no se
 * mantienen en memoria global).
 */
export function useWarehouse({ isPrivateRoute, currentUserName, showToast }: UseWarehouseDeps) {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [suppliers, setSuppliers] = useState<WarehouseSupplier[]>([]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    warehouseService.fetchItems().then(setWarehouseItems);
    warehouseService.fetchSuppliers().then(setSuppliers);
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const itemsChannel = supabase
      .channel('realtime_warehouse_items_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_items' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const nu = payload.new as any;
          setWarehouseItems(prev => prev.some(i => i.id === nu.id) ? prev : [...prev, {
            id: nu.id, name: nu.name, category: nu.category, unit: nu.unit,
            currentStock: Number(nu.current_stock) || 0, minStock: Number(nu.min_stock) || 0,
            supplierId: nu.supplier_id ?? undefined, notes: nu.notes ?? undefined
          }]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const nu = payload.new as any;
          setWarehouseItems(prev => prev.map(i => i.id === nu.id ? {
            id: nu.id, name: nu.name, category: nu.category, unit: nu.unit,
            currentStock: Number(nu.current_stock) || 0, minStock: Number(nu.min_stock) || 0,
            supplierId: nu.supplier_id ?? undefined, notes: nu.notes ?? undefined
          } : i));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const ou = payload.old as any;
          setWarehouseItems(prev => prev.filter(i => i.id !== ou.id));
        }
      })
      .subscribe();

    const suppliersChannel = supabase
      .channel('realtime_warehouse_suppliers_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_suppliers' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const nu = payload.new as any;
          setSuppliers(prev => prev.some(s => s.id === nu.id) ? prev : [...prev, {
            id: nu.id, name: nu.name, contactName: nu.contact_name ?? undefined,
            phone: nu.phone ?? undefined, email: nu.email ?? undefined, notes: nu.notes ?? undefined
          }]);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const ou = payload.old as any;
          setSuppliers(prev => prev.filter(s => s.id !== ou.id));
        }
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(itemsChannel);
      supabase?.removeChannel(suppliersChannel);
    };
  }, [isPrivateRoute]);

  const addWarehouseItem = useCallback(async (item: {
    name: string; category: string; unit: string; currentStock: number; minStock: number; supplierId?: string; notes?: string;
  }) => {
    const created = await warehouseService.insertItem(item);
    if (created) {
      setWarehouseItems(prev => [...prev, created]);
      showToast('success', `Insumo "${created.name}" agregado al almacén`);
    } else {
      showToast('error', 'No se pudo agregar el insumo');
    }
    return created;
  }, [showToast]);

  const removeWarehouseItem = useCallback(async (id: string, name: string) => {
    setWarehouseItems(prev => prev.filter(i => i.id !== id));
    await warehouseService.deleteItem(id);
    showToast('info', `Insumo "${name}" eliminado del almacén`);
  }, [showToast]);

  const registerStockMovement = useCallback(async (input: {
    itemId: string; movementType: 'in' | 'out' | 'adjustment'; quantity: number; reason: string;
  }) => {
    const item = warehouseItems.find(i => i.id === input.itemId);
    if (!item) return;

    const created = await warehouseService.insertMovement({ ...input, createdBy: currentUserName });
    if (!created) {
      showToast('error', 'No se pudo registrar el movimiento de stock');
      return;
    }

    const newStock = input.movementType === 'in'
      ? item.currentStock + input.quantity
      : input.movementType === 'out'
      ? Math.max(0, item.currentStock - input.quantity)
      : input.quantity; // 'adjustment' fija el stock directamente

    setWarehouseItems(prev => prev.map(i => i.id === item.id ? { ...i, currentStock: newStock } : i));
    warehouseService.updateItemStock(item.id, newStock);
    sounds.playClick();
    showToast('success', `Stock de "${item.name}" actualizado a ${newStock} ${item.unit}`);
  }, [warehouseItems, currentUserName, showToast]);

  const addSupplier = useCallback(async (supplier: { name: string; contactName?: string; phone?: string; email?: string; notes?: string }) => {
    const created = await warehouseService.insertSupplier(supplier);
    if (created) {
      setSuppliers(prev => [...prev, created]);
      showToast('success', `Proveedor "${created.name}" agregado`);
    } else {
      showToast('error', 'No se pudo agregar el proveedor');
    }
    return created;
  }, [showToast]);

  const removeSupplier = useCallback(async (id: string, name: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    await warehouseService.deleteSupplier(id);
    showToast('info', `Proveedor "${name}" eliminado`);
  }, [showToast]);

  return {
    warehouseItems,
    suppliers,
    addWarehouseItem,
    removeWarehouseItem,
    registerStockMovement,
    addSupplier,
    removeSupplier
  };
}
