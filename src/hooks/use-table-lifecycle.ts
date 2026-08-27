'use client';

import { Table, Order, OrderItem, StaffUser } from '@/types/restaurant';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { ToastMessage } from './use-toasts';

interface UseTableLifecycleDeps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  persistTableToCloud: (table: Table) => Promise<void>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  persistOrderToCloud: (order: Order) => Promise<void>;
  staff: StaffUser[];
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'table_merged', description: string) => void;
}

/**
 * Orquestador: acciones que abren/mueven una mesa y a la vez crean o
 * modifican su comanda — tocan Mesas + Pedidos + Personal a la vez, por eso
 * viven aparte de `use-tables.ts`/`use-orders.ts` en vez de forzarlas dentro
 * de un solo dominio. Extraído tal cual estaba en RestaurantContext.tsx
 * (Fase 2a: reorganización, sin cambiar comportamiento).
 */
export function useTableLifecycle({
  tables, setTables, persistTableToCloud,
  orders, setOrders, persistOrderToCloud,
  staff, showToast, addAuditLog
}: UseTableLifecycleDeps) {

  const openTable = (tableId: string, customerCount: number, waiterId: string): string => {
    const targetTable = tables.find(t => t.id === tableId);
    const waiter = staff.find(s => s.id === waiterId) || staff[0];
    const orderCode = `CMD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderId = `cmd-${Date.now()}`;
    const now = serverDate();
    const formattedSeatedAt = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const openedTimestamp = now.getTime();

    const newOrder: Order = {
      id: newOrderId,
      code: orderCode,
      tableId,
      tableNumber: targetTable?.number || 'M-??',
      waiterId: waiter.id,
      waiterName: waiter.name,
      openedByUserId: waiter.id,
      openedByUserName: waiter.name,
      openedTimestamp,
      orderType: 'dine_in',
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      discount: 0,
      total: 0,
      status: 'active',
      paymentMethod: 'pending',
      createdAt: now.toISOString()
    };

    const updatedTable: Table = {
      ...(targetTable || { id: tableId, number: 'M-??', zone: 'Principal', capacity: 4 }),
      status: 'occupied',
      currentOrderId: newOrderId,
      customerCount,
      seatedAt: formattedSeatedAt,
      openedTimestamp,
      assignedWaiterId: waiter.id,
      assignedWaiterName: waiter.name,
      openedByUserId: waiter.id,
      openedByUserName: waiter.name
    };

    setOrders(prev => [...prev, newOrder]);
    setTables(prev => prev.map(tbl => tbl.id === tableId ? updatedTable : tbl));

    persistOrderToCloud(newOrder);
    persistTableToCloud(updatedTable);

    sounds.playClick();
    showToast('success', `Mesa ${newOrder.tableNumber} activada por ${waiter.name} a las ${formattedSeatedAt} (${customerCount} comensales)`);
    return newOrderId;
  };

  const createOrderForTable = (tableId: string, items: OrderItem[], notes?: string): Order => {
    const table = tables.find(t => t.id === tableId);
    const existingOrder = orders.find(o => o.id === table?.currentOrderId);
    const waiter = staff.find(s => s.id === table?.assignedWaiterId) || staff[0];

    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    const total = subtotal;

    let targetOrder: Order;

    if (existingOrder) {
      targetOrder = {
        ...existingOrder,
        items: [...existingOrder.items, ...items],
        subtotal: existingOrder.subtotal + subtotal,
        tax: Number(((existingOrder.subtotal + subtotal) * 0.18).toFixed(2)),
        total: existingOrder.subtotal + subtotal,
        notes: notes ? (existingOrder.notes ? `${existingOrder.notes} | ${notes}` : notes) : existingOrder.notes
      };
      setOrders(prev => prev.map(o => o.id === targetOrder.id ? targetOrder : o));
    } else {
      const orderCode = `CMD-${Math.floor(100 + Math.random() * 900)}`;
      targetOrder = {
        id: `cmd-${Date.now()}`,
        code: orderCode,
        tableId,
        tableNumber: table?.number || 'M-??',
        waiterId: waiter.id,
        waiterName: waiter.name,
        orderType: 'dine_in',
        items,
        subtotal,
        tax,
        tip: 0,
        discount: 0,
        total,
        status: 'active',
        paymentMethod: 'pending',
        notes,
        createdAt: serverDate().toISOString()
      };
      setOrders(prev => [...prev, targetOrder]);
    }

    const updatedTable: Table = {
      ...(table || { id: tableId, number: 'M-??', zone: 'Principal', capacity: 4 }),
      status: 'in_kitchen',
      currentOrderId: targetOrder.id
    };

    setTables(prev => prev.map(tbl => tbl.id === tableId ? updatedTable : tbl));

    persistOrderToCloud(targetOrder);
    persistTableToCloud(updatedTable);

    sounds.playKitchenBell();
    showToast('success', `Comanda enviada a cocina (${items.length} platos) para Mesa ${table?.number}`);
    return targetOrder;
  };

  const addItemsToTableOrder = (tableId: string, newItems: OrderItem[]) => {
    createOrderForTable(tableId, newItems);
  };

  const transferTable = (sourceId: string, targetId: string): boolean => {
    const sourceTable = tables.find(t => t.id === sourceId);
    const targetTable = tables.find(t => t.id === targetId);

    if (!sourceTable || !targetTable || targetTable.status !== 'available' || !sourceTable.currentOrderId) {
      showToast('error', 'No se puede transferir a una mesa ocupada o sin orden activa');
      return false;
    }

    const orderId = sourceTable.currentOrderId;
    const existingOrder = orders.find(o => o.id === orderId);

    const updatedOrder = existingOrder ? { ...existingOrder, tableId: targetId, tableNumber: targetTable.number } : null;
    if (updatedOrder) {
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      persistOrderToCloud(updatedOrder);
    }

    const updatedSourceTable: Table = {
      ...sourceTable,
      status: 'available',
      currentOrderId: undefined,
      customerCount: undefined,
      seatedAt: undefined,
      openedTimestamp: undefined,
      openedByUserId: undefined,
      openedByUserName: undefined,
      assignedWaiterId: undefined,
      assignedWaiterName: undefined
    };

    const updatedTargetTable: Table = {
      ...targetTable,
      status: sourceTable.status,
      currentOrderId: orderId,
      customerCount: sourceTable.customerCount,
      seatedAt: sourceTable.seatedAt,
      openedTimestamp: sourceTable.openedTimestamp,
      openedByUserId: sourceTable.openedByUserId,
      openedByUserName: sourceTable.openedByUserName,
      assignedWaiterId: sourceTable.assignedWaiterId,
      assignedWaiterName: sourceTable.assignedWaiterName
    };

    setTables(prev => prev.map(tbl => {
      if (tbl.id === sourceId) return updatedSourceTable;
      if (tbl.id === targetId) return updatedTargetTable;
      return tbl;
    }));

    persistTableToCloud(updatedSourceTable);
    persistTableToCloud(updatedTargetTable);

    sounds.playClick();
    showToast('success', `Consumo transferido de Mesa ${sourceTable.number} a Mesa ${targetTable.number}`);
    addAuditLog('table_merged', `Mesa ${sourceTable.number} transferida a Mesa ${targetTable.number}`);
    return true;
  };

  return { openTable, createOrderForTable, addItemsToTableOrder, transferTable };
}
