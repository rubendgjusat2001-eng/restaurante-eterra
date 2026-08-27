/**
 * Acceso a datos de `warehouse_items` / `warehouse_suppliers` /
 * `warehouse_movements` (Fase H, nuevo módulo). Mismo patrón que el resto de
 * servicios: mapRow + fetch + escrituras con try/catch silencioso.
 */

import { supabase } from '@/lib/supabase';
import { WarehouseItem, WarehouseSupplier, WarehouseMovement } from '@/types/restaurant';

// --- Insumos (warehouse_items) ---

function mapItemRow(row: any): WarehouseItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentStock: Number(row.current_stock) || 0,
    minStock: Number(row.min_stock) || 0,
    supplierId: row.supplier_id ?? undefined,
    notes: row.notes ?? undefined
  };
}

export async function fetchItems(): Promise<WarehouseItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('warehouse_items').select('*').order('name', { ascending: true });
  if (error || !data) return [];
  return data.map(mapItemRow);
}

export async function insertItem(item: {
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  notes?: string;
}): Promise<WarehouseItem | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .insert({
        name: item.name,
        category: item.category,
        unit: item.unit,
        current_stock: item.currentStock,
        min_stock: item.minStock,
        supplier_id: item.supplierId ?? null,
        notes: item.notes ?? null
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapItemRow(data);
  } catch {
    return null;
  }
}

export async function updateItemStock(id: string, newStock: number): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('warehouse_items').update({ current_stock: newStock }).eq('id', id);
  } catch {
    // Silencioso
  }
}

export async function deleteItem(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('warehouse_items').delete().eq('id', id);
  } catch {
    // Silencioso
  }
}

// --- Proveedores (warehouse_suppliers) ---

function mapSupplierRow(row: any): WarehouseSupplier {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined
  };
}

export async function fetchSuppliers(): Promise<WarehouseSupplier[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('warehouse_suppliers').select('*').order('name', { ascending: true });
  if (error || !data) return [];
  return data.map(mapSupplierRow);
}

export async function insertSupplier(supplier: {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<WarehouseSupplier | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('warehouse_suppliers')
      .insert({
        name: supplier.name,
        contact_name: supplier.contactName ?? null,
        phone: supplier.phone ?? null,
        email: supplier.email ?? null,
        notes: supplier.notes ?? null
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapSupplierRow(data);
  } catch {
    return null;
  }
}

export async function deleteSupplier(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('warehouse_suppliers').delete().eq('id', id);
  } catch {
    // Silencioso
  }
}

// --- Movimientos de stock (warehouse_movements) ---

function mapMovementRow(row: any): WarehouseMovement {
  return {
    id: row.id,
    itemId: row.item_id,
    movementType: row.movement_type,
    quantity: Number(row.quantity) || 0,
    reason: row.reason,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at
  };
}

export async function fetchItemMovements(itemId: string): Promise<WarehouseMovement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('warehouse_movements')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapMovementRow);
}

export async function insertMovement(movement: {
  itemId: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  createdBy?: string;
}): Promise<WarehouseMovement | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('warehouse_movements')
      .insert({
        item_id: movement.itemId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        reason: movement.reason,
        created_by: movement.createdBy ?? null
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return mapMovementRow(data);
  } catch {
    return null;
  }
}
