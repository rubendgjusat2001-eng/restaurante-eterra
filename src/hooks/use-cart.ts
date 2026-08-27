'use client';

import { useState } from 'react';
import { MenuItem, Order, OrderItem, OrderPaymentMethod } from '@/types/restaurant';
import { sounds } from '@/lib/utils';
import { serverDate } from '@/lib/server-time';
import { ToastMessage } from './use-toasts';

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: any[];
  notes?: string;
  totalPrice: number;
}

interface UseCartDeps {
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
}

/**
 * Carrito público y pedidos online. Extraído tal cual estaba en
 * RestaurantContext.tsx (Fase 2a: reorganización, sin cambiar comportamiento)
 * — `submitOnlineOrder` **todavía no persiste el pedido en Supabase**
 * (inconsistente con el resto de comandas). Arreglarlo es el primer punto de
 * Fase 2b (ver el plan y CLAUDE.md §6), NO se hace en este paso.
 */
export function useCart({ setOrders, showToast }: UseCartDeps) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (menuItem: MenuItem, quantity: number, selectedModifiers: any[] = [], notes?: string) => {
    if (!menuItem.isAvailable) {
      showToast('error', 'Este plato se encuentra agotado por el momento.');
      return;
    }
    const extraPrice = selectedModifiers.reduce((acc, mod) => acc + (mod.extraPrice || 0), 0);
    const unitPrice = menuItem.price + extraPrice;
    const totalPrice = unitPrice * quantity;

    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id && JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers));
      if (existing) {
        return prev.map(item => item.id === existing.id
          ? { ...item, quantity: item.quantity + quantity, totalPrice: (item.quantity + quantity) * unitPrice }
          : item
        );
      }
      return [...prev, {
        id: `cart-${Date.now()}-${Math.random()}`,
        menuItem,
        quantity,
        selectedModifiers,
        notes,
        totalPrice
      }];
    });

    sounds.playClick();
    showToast('success', `${quantity}x ${menuItem.name} agregado a tu orden`, 'Bolsa de Pedido');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.id !== cartItemId));
    sounds.playClick();
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null as any;
        const extraPrice = item.selectedModifiers.reduce((acc: number, mod: any) => acc + (mod.extraPrice || 0), 0);
        const unitPrice = item.menuItem.price + extraPrice;
        return { ...item, quantity: newQty, totalPrice: newQty * unitPrice };
      }
      return item;
    }).filter(Boolean));
  };

  const clearCart = () => setCart([]);

  const submitOnlineOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    customerDoc?: string;
    deliveryType: 'delivery' | 'takeout';
    address?: string;
    paymentMethod: OrderPaymentMethod;
    notes?: string;
  }): Order => {
    const orderItems: OrderItem[] = cart.map(cartItem => ({
      id: `ord-item-${Date.now()}-${Math.random()}`,
      menuItemId: cartItem.menuItem.id,
      name: cartItem.menuItem.name,
      quantity: cartItem.quantity,
      unitPrice: cartItem.totalPrice / cartItem.quantity,
      totalPrice: cartItem.totalPrice,
      station: cartItem.menuItem.station,
      course: 'main',
      status: 'queued',
      selectedModifiers: cartItem.selectedModifiers,
      notes: cartItem.notes,
      orderedAt: serverDate().toISOString()
    }));

    const subtotal = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    const total = subtotal;

    const newOrder: Order = {
      id: `cmd-online-${Date.now()}`,
      code: `WEB-${Math.floor(100 + Math.random() * 900)}`,
      waiterId: 'web-customer',
      waiterName: 'Pedido Web Online',
      orderType: orderData.deliveryType === 'delivery' ? 'delivery' : 'takeout',
      items: orderItems,
      subtotal,
      tax,
      tip: 0,
      discount: 0,
      total,
      status: 'active',
      paymentMethod: orderData.paymentMethod,
      customerDocument: orderData.customerDoc,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.address,
      notes: orderData.notes,
      createdAt: serverDate().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    sounds.playKitchenBell();
    showToast('success', `¡Pedido online ${newOrder.code} recibido y enviado a cocina!`, 'ÉTERRA Online');
    return newOrder;
  };

  return { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, submitOnlineOrder };
}
