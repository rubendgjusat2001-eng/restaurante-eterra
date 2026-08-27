'use client';

import { useCallback, useEffect, useState } from 'react';
import { Order, OrderItemStatus } from '@/types/restaurant';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { ToastMessage } from './use-toasts';
import * as ordersService from '@/services/orders.service';

interface UseOrdersDeps {
  /** true solo dentro de /sistema/* — ver RestaurantContext.tsx. */
  isPrivateRoute: boolean;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'dish_cancelled', description: string, metadata?: Record<string, any>) => void;
}

/**
 * Comandas y KDS. Extraído tal cual estaba en RestaurantContext.tsx (Fase 2a:
 * reorganización, sin cambiar comportamiento). `createOrderForTable`
 * (que también toca Mesas) vive en `use-table-lifecycle.ts`, no aquí.
 */
export function useOrders({ isPrivateRoute, showToast, addAuditLog }: UseOrdersDeps) {
  const [orders, setOrders] = useState<Order[]>(() => []);

  const persistOrderToCloud = useCallback(async (order: Order) => {
    await ordersService.persistOrderToCloud(order);
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;
    ordersService.fetchOrders().then(mapped => setOrders(mapped));
  }, [isPrivateRoute]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !isPrivateRoute) return;

    const ordersChannel = supabase
      .channel('realtime_orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newOrder = payload.new as any;
            setOrders(prev => {
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [...prev, {
                id: newOrder.id,
                code: newOrder.code,
                tableId: newOrder.table_id,
                tableNumber: newOrder.table_number,
                waiterId: newOrder.waiter_id,
                waiterName: newOrder.waiter_name,
                openedByUserId: newOrder.opened_by_user_id,
                openedByUserName: newOrder.opened_by_user_name,
                closedByUserId: newOrder.closed_by_user_id,
                closedByUserName: newOrder.closed_by_user_name,
                closedAt: newOrder.closed_at,
                orderType: newOrder.order_type,
                items: Array.isArray(newOrder.items) ? newOrder.items : [],
                subtotal: Number(newOrder.subtotal) || 0,
                tax: Number(newOrder.tax) || 0,
                tip: Number(newOrder.tip) || 0,
                discount: Number(newOrder.discount) || 0,
                total: Number(newOrder.total) || 0,
                status: newOrder.status,
                paymentMethod: newOrder.payment_method,
                invoiceType: newOrder.invoice_type,
                createdAt: newOrder.created_at
              }];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as any;
            setOrders(prev => prev.map(o => o.id === updated.id ? {
              ...o,
              status: updated.status,
              items: Array.isArray(updated.items) ? updated.items : o.items,
              subtotal: Number(updated.subtotal) || o.subtotal,
              tax: Number(updated.tax) || o.tax,
              tip: Number(updated.tip) || o.tip,
              discount: Number(updated.discount) || o.discount,
              total: Number(updated.total) || o.total,
              paymentMethod: updated.payment_method || o.paymentMethod,
              invoiceType: updated.invoice_type || o.invoiceType,
              closedAt: updated.closed_at || o.closedAt
            } : o));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(ordersChannel);
    };
  }, [isPrivateRoute]);

  const updateOrderItemStatus = (orderId: string, itemId: string, status: OrderItemStatus) => {
    let updatedTargetOrder: Order | null = null;

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => {
          if (item.id === itemId) {
            const now = serverDate().toISOString();
            return {
              ...item,
              status,
              startedAt: status === 'preparing' ? now : item.startedAt,
              readyAt: status === 'ready' ? now : item.readyAt,
              servedAt: status === 'served' ? now : item.servedAt,
            };
          }
          return item;
        });
        updatedTargetOrder = { ...order, items: updatedItems };
        return updatedTargetOrder;
      }
      return order;
    }));

    if (updatedTargetOrder) {
      persistOrderToCloud(updatedTargetOrder);
    }

    if (status === 'ready') {
      sounds.playKitchenBell();
      showToast('success', '¡Plato listo para ser servido!', 'KDS Cocina');
    } else {
      sounds.playClick();
    }
  };

  const cancelOrderItem = (orderId: string, itemId: string, reason: string, authorizedBy: string) => {
    let updatedTargetOrder: Order | null = null;

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const cancelledItem = order.items.find(i => i.id === itemId);
        const remainingItems = order.items.filter(i => i.id !== itemId);
        const newSubtotal = remainingItems.reduce((acc, it) => acc + it.totalPrice, 0);

        addAuditLog(
          'dish_cancelled',
          `Plato "${cancelledItem?.name}" anulado de la orden ${order.code}. Motivo: ${reason}`,
          { orderId, itemId, authorizedBy, itemPrice: cancelledItem?.totalPrice }
        );

        updatedTargetOrder = {
          ...order,
          items: remainingItems,
          subtotal: newSubtotal,
          tax: Number((newSubtotal * 0.18).toFixed(2)),
          total: newSubtotal
        };
        return updatedTargetOrder;
      }
      return order;
    }));

    if (updatedTargetOrder) {
      persistOrderToCloud(updatedTargetOrder);
    }

    sounds.playAlert();
    showToast('warning', `Plato anulado por ${authorizedBy}. Motivo: ${reason}`, 'Control de Comandas');
  };

  return { orders, setOrders, persistOrderToCloud, updateOrderItemStatus, cancelOrderItem };
}
