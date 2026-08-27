'use client';

import { Table, Order, OrderPaymentMethod, InvoiceType, StaffUser, CashShift } from '@/types/restaurant';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { ToastMessage } from './use-toasts';

interface UseCheckoutDeps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  persistTableToCloud: (table: Table) => Promise<void>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  persistOrderToCloud: (order: Order) => Promise<void>;
  staff: StaffUser[];
  /** Turno de caja activo — se graba en cada orden cobrada (Fase F, reporte por mesero/cajero). */
  activeShiftId: string;
  setActiveShift: React.Dispatch<React.SetStateAction<CashShift>>;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
}

/**
 * Orquestador: cobrar una mesa — toca Mesas + Pedidos + Personal + Caja a la
 * vez (es la función con más dominios cruzados de todo el sistema). Extraído
 * tal cual estaba en RestaurantContext.tsx (Fase 2a: reorganización, sin
 * cambiar comportamiento).
 */
export function useCheckout({
  tables, setTables, persistTableToCloud,
  orders, setOrders, persistOrderToCloud,
  staff, activeShiftId, setActiveShift, showToast
}: UseCheckoutDeps) {

  const processTablePayment = (
    tableId: string,
    paymentMethod: OrderPaymentMethod,
    invoiceType: InvoiceType,
    details: {
      customerDoc?: string;
      customerName?: string;
      tip?: number;
      discount?: number;
      paidAmount?: number;
    },
    attributedStaff?: { id: string; name: string }
  ): Order | null => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) {
      showToast('error', 'La mesa no tiene una comanda activa');
      return null;
    }

    const order = orders.find(o => o.id === table.currentOrderId);
    if (!order) return null;

    const tip = details.tip || 0;
    const discount = details.discount || 0;
    const finalTotal = Math.max(0, order.subtotal - discount + tip);
    const cashier = attributedStaff || staff[0];
    const now = serverDate();

    const completedOrder: Order = {
      ...order,
      status: 'completed',
      paymentMethod,
      invoiceType,
      tip,
      discount,
      total: finalTotal,
      customerDocument: details.customerDoc,
      customerName: details.customerName,
      closedByUserId: cashier.id,
      closedByUserName: cashier.name,
      closedAt: now.toISOString(),
      shiftId: activeShiftId
    };

    const updatedTable: Table = {
      ...table,
      status: 'cleaning',
      currentOrderId: undefined,
      customerCount: undefined,
      seatedAt: undefined,
      openedTimestamp: undefined,
      closedByUserId: cashier.id,
      closedByUserName: cashier.name,
      closedAt: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };

    setOrders(prev => prev.map(o => o.id === completedOrder.id ? completedOrder : o));
    setTables(prev => prev.map(tbl => tbl.id === tableId ? updatedTable : tbl));

    persistOrderToCloud(completedOrder);
    persistTableToCloud(updatedTable);

    setActiveShift(prev => {
      let cashDelta = 0;
      let cardDelta = 0;
      let yapeDelta = 0;

      if (paymentMethod === 'cash') cashDelta = finalTotal;
      else if (paymentMethod === 'card') cardDelta = finalTotal;
      else if (paymentMethod === 'yape_plin') yapeDelta = finalTotal;
      else if (paymentMethod === 'split') {
        cashDelta = (details.paidAmount || finalTotal) / 2;
        cardDelta = finalTotal - cashDelta;
      }

      return {
        ...prev,
        systemCashSales: prev.systemCashSales + cashDelta,
        systemCardSales: prev.systemCardSales + cardDelta,
        systemYapePlinSales: prev.systemYapePlinSales + yapeDelta,
        systemTotalSales: prev.systemTotalSales + finalTotal
      };
    });

    sounds.playCashRegister();
    showToast(
      'success',
      `Mesa ${table.number} cobrada exitosamente (${invoiceType.toUpperCase()} - Total: S/. ${finalTotal.toFixed(2)})`,
      'Caja Registrada'
    );
    return completedOrder;
  };

  return { processTablePayment };
}
