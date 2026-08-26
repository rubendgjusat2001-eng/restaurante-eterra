'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  RestaurantInfo, 
  GastroThemePreset, 
  ThemeColors, 
  StaffUser, 
  UserRole, 
  MenuItem, 
  DishStation,
  MenuCategory, 
  Table, 
  Order, 
  OrderItem, 
  OrderItemStatus, 
  OrderPaymentMethod, 
  InvoiceType, 
  Reservation, 
  Promotion, 
  CashShift, 
  CashDenominationCount, 
  AuditLog 
} from '@/types/restaurant';
import { 
  GASTRO_THEMES, 
  INITIAL_RESTAURANT, 
  STAFF_MEMBERS, 
  MENU_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_TABLES, 
  INITIAL_PROMOTIONS, 
  INITIAL_SHIFT 
} from '@/lib/constants';
import { sounds } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: any[];
  notes?: string;
  totalPrice: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface RestaurantContextType {
  // Configuración & Theme
  restaurant: RestaurantInfo;
  currentThemeColors: ThemeColors;
  setThemePreset: (preset: GastroThemePreset) => void;
  updateCustomTheme: (colors: ThemeColors) => void;
  updateRestaurantInfo: (info: Partial<RestaurantInfo>) => void;

  // Personal & Auth
  staff: StaffUser[];
  currentUser: StaffUser | null;
  loginWithPin: (pin: string, user?: StaffUser) => boolean;
  switchUser: (user: StaffUser) => void;
  logoutStaff: () => void;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  pendingActionUser: StaffUser | null;
  setPendingActionUser: (user: StaffUser | null) => void;

  // Menú y Stock (86-List)
  categories: MenuCategory[];
  menuItems: MenuItem[];
  toggleDishAvailability: (id: string) => void;
  updateDish: (dish: MenuItem) => void;
  addDish: (dish: MenuItem) => void;

  // Mesas y Salones
  tables: Table[];
  activeZone: string;
  setActiveZone: (zone: string) => void;
  openTable: (tableId: string, customerCount: number, waiterId: string) => string;
  transferTable: (sourceId: string, targetId: string) => boolean;
  requestTableBill: (tableId: string) => void;
  cleanTable: (tableId: string) => void;
  addTable: (tableData: { number: string; zone: 'Principal' | 'Terraza Marina' | 'Zona VIP' | 'Barra'; capacity: number }) => void;
  updateTable: (tableId: string, updates: Partial<Table>) => void;
  deleteTable: (tableId: string) => boolean;
  resetToDemoData: () => void;

  // Comandas y Pedidos
  orders: Order[];
  createOrderForTable: (tableId: string, items: OrderItem[], notes?: string) => Order;
  addItemsToTableOrder: (tableId: string, newItems: OrderItem[]) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  cancelOrderItem: (orderId: string, itemId: string, reason: string, authorizedBy: string) => void;
  
  // Caja y Turnos
  activeShift: CashShift;
  shiftHistory: CashShift[];
  processTablePayment: (
    tableId: string, 
    paymentMethod: OrderPaymentMethod, 
    invoiceType: InvoiceType, 
    details: {
      customerDoc?: string;
      customerName?: string;
      tip?: number;
      discount?: number;
      paidAmount?: number;
    }
  ) => Order | null;
  saveCashAudit: (breakdown: CashDenominationCount, notes?: string) => void;
  closeCurrentShift: (countedCash: number, countedCards: number, countedYape: number, notes?: string) => void;
  openNewShift: (shiftName: string, initialCash: number) => void;

  // Reservas & Promociones
  reservations: Reservation[];
  createReservation: (resData: Omit<Reservation, 'id' | 'code' | 'createdAt' | 'status' | 'paymentStatus'>) => Reservation;
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
  promotions: Promotion[];
  updatePromotion: (promo: Promotion) => void;

  // Carrito Público y Checkout Online
  cart: CartItem[];
  addToCart: (menuItem: MenuItem, quantity: number, selectedModifiers?: any[], notes?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  submitOnlineOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerDoc?: string;
    deliveryType: 'delivery' | 'takeout';
    address?: string;
    paymentMethod: OrderPaymentMethod;
    notes?: string;
  }) => Order;

  // Auditoría & Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditLog['action'], description: string, metadata?: Record<string, any>) => void;

  // Notificaciones Toast y Sonidos
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  removeToast: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  // Estado de Restaurante & Theming
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eterra_restaurant_info');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_RESTAURANT;
  });

  // Estado de Personal
  const [staff] = useState<StaffUser[]>(STAFF_MEMBERS);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => STAFF_MEMBERS[0]); // Default Rubén (Owner)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingActionUser, setPendingActionUser] = useState<StaffUser | null>(null);

  // Menú y Categorías
  const [categories] = useState<MenuCategory[]>(MENU_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eterra_menu_items');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_MENU_ITEMS;
  });

  // Mesas
  const [tables, setTables] = useState<Table[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eterra_tables');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_TABLES;
  });
  const [activeZone, setActiveZone] = useState<string>('all');

  // Comandas Iniciales
  const [orders, setOrders] = useState<Order[]>(() => {
    // Comanda semilla de prueba para Mesa 2
    const seedOrder: Order = {
      id: 'cmd-101',
      code: 'CMD-101',
      tableId: 'tbl-02',
      tableNumber: 'M-02',
      waiterId: 'user-04',
      waiterName: 'Mateo Morales',
      orderType: 'dine_in',
      status: 'active',
      subtotal: 194.00,
      tax: 34.92,
      tip: 0,
      discount: 0,
      total: 194.00,
      paymentMethod: 'pending',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'item-01',
          menuItemId: 'dish-01',
          name: 'Ceviche ÉTERRA Clásico',
          quantity: 2,
          unitPrice: 58.00,
          totalPrice: 116.00,
          station: 'kitchen_cold',
          course: 'starter',
          status: 'preparing',
          selectedModifiers: [{ groupId: 'mod-picante', groupName: 'Nivel de Picante', optionId: 'p2', optionName: 'Picante Medio (Clásico)', extraPrice: 0 }],
          orderedAt: new Date(Date.now() - 6 * 60000).toISOString()
        },
        {
          id: 'item-02',
          menuItemId: 'dish-07',
          name: 'Pisco Sour ÉTERRA Reserva 1615',
          quantity: 2,
          unitPrice: 34.00,
          totalPrice: 68.00,
          station: 'bar',
          course: 'drink',
          status: 'ready',
          selectedModifiers: [{ groupId: 'mod-pisco', groupName: 'Variedad', optionId: 'ps1', optionName: 'Clásico Quebranta', extraPrice: 0 }],
          orderedAt: new Date(Date.now() - 6 * 60000).toISOString()
        },
        {
          id: 'item-03',
          menuItemId: 'dish-08',
          name: 'Chilcano de Pisco con Macerado',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
          station: 'bar',
          course: 'drink',
          status: 'served',
          selectedModifiers: [],
          orderedAt: new Date(Date.now() - 6 * 60000).toISOString()
        }
      ]
    };
    return [seedOrder];
  });

  // Caja & Turnos
  const [activeShift, setActiveShift] = useState<CashShift>(() => INITIAL_SHIFT);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);

  // Reservas & Promociones
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: 'res-01',
      code: 'RES-801',
      customerName: 'Dra. Patricia Alarcón',
      customerPhone: '+51 984 123 456',
      customerEmail: 'patricia@clinica.pe',
      partySize: 4,
      reservationDate: new Date().toISOString().split('T')[0],
      reservationTime: '14:00',
      zonePreference: 'Terraza Marina',
      status: 'confirmed',
      specialRequests: 'Mesa con vista al malecón. Es aniversario.',
      depositAmount: 50.00,
      paymentStatus: 'paid',
      createdAt: new Date().toISOString()
    }
  ]);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);

  // Carrito Público
  const [cart, setCart] = useState<CartItem[]>([]);

  // Logs de Auditoría
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Toasts y Sonido
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Helper para sonidos y toasts
  const showToast = useCallback((type: ToastMessage['type'], message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);

    if (type === 'success') sounds.playClick();
    if (type === 'error') sounds.playAlert();
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Aplicar Variables CSS Dinámicas según el Tema Seleccionado
  const currentThemeColors: ThemeColors = restaurant.themePreset === 'custom' && restaurant.customTheme 
    ? restaurant.customTheme 
    : GASTRO_THEMES[restaurant.themePreset]?.colors || GASTRO_THEMES.marisqueria.colors;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', currentThemeColors.primary);
      root.style.setProperty('--color-primary-hover', currentThemeColors.primaryHover);
      root.style.setProperty('--color-secondary', currentThemeColors.secondary);
      root.style.setProperty('--color-accent', currentThemeColors.accent);
      root.style.setProperty('--color-bg-light', currentThemeColors.bgLight || '#f8fafc');
      root.style.setProperty('--color-bg-card', currentThemeColors.bgCard || '#ffffff');
      root.style.setProperty('--color-text-main', currentThemeColors.textMain || '#0f172a');
      root.style.setProperty('--color-text-muted', currentThemeColors.textMuted || '#64748b');
      root.style.setProperty('--color-border', currentThemeColors.border || '#e2e8f0');
    }
  }, [currentThemeColors]);

  // Persistencia en LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eterra_restaurant_info', JSON.stringify(restaurant));
    }
  }, [restaurant]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eterra_menu_items', JSON.stringify(menuItems));
    }
  }, [menuItems]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eterra_tables', JSON.stringify(tables));
    }
  }, [tables]);

  // Persistencia de Mesas y Órdenes en la Nube de Supabase
  const persistTableToCloud = useCallback(async (table: Table) => {
    if (!supabase) return;
    try {
      await supabase.from('tables').upsert({
        id: table.id,
        number: table.number,
        zone: table.zone,
        capacity: table.capacity,
        status: table.status,
        customer_count: table.customerCount ?? null,
        current_order_id: table.currentOrderId ?? null,
        seated_at: table.seatedAt ?? null,
        opened_timestamp: table.openedTimestamp ?? null,
        opened_by_user_id: table.openedByUserId ?? null,
        opened_by_user_name: table.openedByUserName ?? null,
        assigned_waiter_id: table.assignedWaiterId ?? null,
        assigned_waiter_name: table.assignedWaiterName ?? null,
        closed_by_user_id: table.closedByUserId ?? null,
        closed_by_user_name: table.closedByUserName ?? null,
        closed_at: table.closedAt ?? null
      });
    } catch (e) {
      console.warn('Persist table cloud error:', e);
    }
  }, []);

  const persistOrderToCloud = useCallback(async (order: Order) => {
    if (!supabase) return;
    try {
      await supabase.from('orders').upsert({
        id: order.id,
        code: order.code,
        table_id: order.tableId ?? null,
        table_number: order.tableNumber ?? null,
        waiter_id: order.waiterId,
        waiter_name: order.waiterName,
        opened_by_user_id: order.openedByUserId ?? null,
        opened_by_user_name: order.openedByUserName ?? null,
        closed_by_user_id: order.closedByUserId ?? null,
        closed_by_user_name: order.closedByUserName ?? null,
        closed_at: order.closedAt ?? null,
        order_type: order.orderType || 'dine_in',
        status: order.status || 'active',
        items: order.items || [],
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        tip: order.tip || 0,
        discount: order.discount || 0,
        total: order.total || 0,
        payment_method: order.paymentMethod || 'pending',
        invoice_type: order.invoiceType ?? null,
        customer_document: order.customerDocument ?? null,
        customer_name: order.customerName ?? null,
        customer_phone: order.customerPhone ?? null
      });
    } catch (e) {
      console.warn('Persist order cloud error:', e);
    }
  }, []);

  // Sincronización Inicial y Tiempo Real Bidireccional con Supabase (Nube)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let isMounted = true;

    // 1. Cargar o Sembrar Mesas, Órdenes y Menú en la Nube
    async function syncCloudData() {
      try {
        // Cargar Mesas
        const { data: cloudTables, error: tableErr } = await supabase!.from('tables').select('*');
        if (!tableErr && cloudTables && cloudTables.length > 0 && isMounted) {
          const mappedTables: Table[] = cloudTables.map((t: any) => ({
            id: t.id,
            number: t.number,
            zone: t.zone,
            capacity: t.capacity,
            status: t.status,
            customerCount: t.customer_count,
            currentOrderId: t.current_order_id,
            seatedAt: t.seated_at,
            openedTimestamp: t.opened_timestamp,
            openedByUserId: t.opened_by_user_id,
            openedByUserName: t.opened_by_user_name,
            assignedWaiterId: t.assigned_waiter_id,
            assignedWaiterName: t.assigned_waiter_name,
            closedByUserId: t.closed_by_user_id,
            closedByUserName: t.closed_by_user_name,
            closedAt: t.closed_at
          }));
          setTables(mappedTables);
        } else if (!tableErr && cloudTables && cloudTables.length === 0) {
          // Sembrar datos iniciales de mesas
          const tablesToInsert = INITIAL_TABLES.map(t => ({
            id: t.id,
            number: t.number,
            zone: t.zone,
            capacity: t.capacity,
            status: t.status,
            customer_count: t.customerCount || null,
            current_order_id: t.currentOrderId || null,
            seated_at: t.seatedAt || null,
            opened_timestamp: t.openedTimestamp || null,
            opened_by_user_id: t.openedByUserId || null,
            opened_by_user_name: t.openedByUserName || null,
            assigned_waiter_id: t.assignedWaiterId || null,
            assigned_waiter_name: t.assignedWaiterName || null
          }));
          await supabase!.from('tables').insert(tablesToInsert);
        }

        // Cargar Órdenes
        const { data: cloudOrders, error: orderErr } = await supabase!.from('orders').select('*');
        if (!orderErr && cloudOrders && cloudOrders.length > 0 && isMounted) {
          const mappedOrders: Order[] = cloudOrders.map((o: any) => ({
            id: o.id,
            code: o.code,
            tableId: o.table_id,
            tableNumber: o.table_number,
            waiterId: o.waiter_id,
            waiterName: o.waiter_name,
            openedByUserId: o.opened_by_user_id,
            openedByUserName: o.opened_by_user_name,
            closedByUserId: o.closed_by_user_id,
            closedByUserName: o.closed_by_user_name,
            closedAt: o.closed_at,
            orderType: o.order_type,
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: Number(o.subtotal) || 0,
            tax: Number(o.tax) || 0,
            tip: Number(o.tip) || 0,
            discount: Number(o.discount) || 0,
            total: Number(o.total) || 0,
            status: o.status,
            paymentMethod: o.payment_method,
            invoiceType: o.invoice_type,
            customerDocument: o.customer_document,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            createdAt: o.created_at
          }));
          setOrders(mappedOrders);
        }

        // Cargar Menú
        const { data: cloudMenu, error: menuErr } = await supabase!.from('menu_items').select('*');
        if (!menuErr && cloudMenu && cloudMenu.length > 0 && isMounted) {
          const mappedMenu: MenuItem[] = cloudMenu.map((m: any) => ({
            id: m.id,
            categoryId: m.category_id,
            name: m.name,
            description: m.description || '',
            price: Number(m.price) || 0,
            costPrice: Number(m.cost_price) || Math.round((Number(m.price) || 0) * 0.35),
            imageUrl: m.image_url || 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&auto=format&fit=crop&q=80',
            station: (m.station as DishStation) || 'kitchen_cold',
            isAvailable: m.is_available ?? true,
            isFeatured: m.is_featured ?? false,
            preparationMinutes: m.preparation_minutes || 12,
            tags: m.tags || ['Especialidad de la Casa'],
            modifierGroups: m.modifier_groups || []
          }));
          setMenuItems(mappedMenu);
        } else if (!menuErr && cloudMenu && cloudMenu.length === 0) {
          const menuToInsert = INITIAL_MENU_ITEMS.map(m => ({
            id: m.id,
            category_id: m.categoryId,
            name: m.name,
            description: m.description,
            price: m.price,
            image_url: m.imageUrl || null,
            station: m.station,
            is_available: m.isAvailable,
            is_featured: m.isFeatured || false
          }));
          await supabase!.from('menu_items').insert(menuToInsert);
        }
      } catch (err) {
        console.error('Error sincronizando con Supabase:', err);
      }
    }

    syncCloudData();

    // 2. Suscripción en Tiempo Real Global (WebSockets para Mesas y Órdenes)
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
      isMounted = false;
      supabase?.removeChannel(tablesChannel);
      supabase?.removeChannel(ordersChannel);
    };
  }, []);

  // Métodos de Configuración y Tema
  const setThemePreset = (preset: GastroThemePreset) => {
    sounds.playClick();
    setRestaurant(prev => ({ ...prev, themePreset: preset }));
    showToast('success', `Estilo visual cambiado a: ${GASTRO_THEMES[preset].name}`);
  };

  const updateCustomTheme = (colors: ThemeColors) => {
    setRestaurant(prev => ({ ...prev, themePreset: 'custom', customTheme: colors }));
    showToast('success', 'Paleta personalizada aplicada con éxito');
  };

  const updateRestaurantInfo = (info: Partial<RestaurantInfo>) => {
    setRestaurant(prev => ({ ...prev, ...info }));
    showToast('success', 'Configuración de ÉTERRA actualizada');
  };

  // Métodos de Auth y PIN
  const loginWithPin = (pin: string, targetUser?: StaffUser): boolean => {
    const userToVerify = targetUser || pendingActionUser;
    if (!userToVerify) {
      // Buscar usuario con ese PIN
      const match = staff.find(u => u.pin === pin && u.active);
      if (match) {
        setCurrentUser(match);
        setIsPinModalOpen(false);
        setPendingActionUser(null);
        sounds.playClick();
        showToast('success', `Sesión iniciada como: ${match.name} (${match.role.toUpperCase()})`);
        return true;
      }
    } else {
      if (userToVerify.pin === pin) {
        setCurrentUser(userToVerify);
        setIsPinModalOpen(false);
        setPendingActionUser(null);
        sounds.playClick();
        showToast('success', `Sesión activa: ${userToVerify.name}`);
        return true;
      }
    }
    sounds.playAlert();
    showToast('error', 'PIN incorrecto. Inténtelo nuevamente.');
    return false;
  };

  const switchUser = (user: StaffUser) => {
    setPendingActionUser(user);
    setIsPinModalOpen(true);
  };

  const logoutStaff = () => {
    setCurrentUser(null);
    sounds.playClick();
    showToast('info', 'Sesión de personal cerrada');
  };

  // 86-List y Menú
  const toggleDishAvailability = (dishId: string) => {
    setMenuItems(prev => prev.map(dish => {
      if (dish.id === dishId) {
        const nextState = !dish.isAvailable;
        sounds.playClick();
        showToast(
          nextState ? 'success' : 'warning',
          `${dish.name} marcado como ${nextState ? 'DISPONIBLE' : 'AGOTADO (86-List)'}`,
          'Actualización de Stock en Vivo'
        );
        addAuditLog('stock_depleted', `${dish.name} cambiado a ${nextState ? 'Disponible' : 'Agotado'}`);
        if (supabase) {
          supabase.from('menu_items').update({ is_available: nextState }).eq('id', dishId).then();
        }
        return { ...dish, isAvailable: nextState };
      }
      return dish;
    }));
  };

  const updateDish = (dish: MenuItem) => {
    setMenuItems(prev => prev.map(d => d.id === dish.id ? dish : d));
    showToast('success', `Plato "${dish.name}" actualizado`);
    if (supabase) {
      supabase.from('menu_items').update({
        name: dish.name,
        description: dish.description,
        price: dish.price,
        station: dish.station,
        is_available: dish.isAvailable,
        is_featured: dish.isFeatured
      }).eq('id', dish.id).then();
    }
  };

  const addDish = (dish: MenuItem) => {
    setMenuItems(prev => [...prev, dish]);
    showToast('success', `Nuevo plato "${dish.name}" agregado a la carta`);
    if (supabase) {
      supabase.from('menu_items').insert({
        id: dish.id,
        category_id: dish.categoryId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        image_url: dish.imageUrl || null,
        station: dish.station,
        is_available: dish.isAvailable,
        is_featured: dish.isFeatured || false
      }).then();
    }
  };

  // Gestión de Mesas con Trazabilidad de Personal y Horas
  const openTable = (tableId: string, customerCount: number, waiterId: string): string => {
    const targetTable = tables.find(t => t.id === tableId);
    const waiter = staff.find(s => s.id === waiterId) || currentUser || staff[0];
    const orderCode = `CMD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderId = `cmd-${Date.now()}`;
    const now = new Date();
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

    // Persistir en Supabase en la nube
    persistOrderToCloud(newOrder);
    persistTableToCloud(updatedTable);

    sounds.playClick();
    showToast('success', `Mesa ${newOrder.tableNumber} activada por ${waiter.name} a las ${formattedSeatedAt} (${customerCount} comensales)`);
    return newOrderId;
  };

  const createOrderForTable = (tableId: string, items: OrderItem[], notes?: string): Order => {
    const table = tables.find(t => t.id === tableId);
    const existingOrder = orders.find(o => o.id === table?.currentOrderId);
    const waiter = currentUser || staff[0];

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
        createdAt: new Date().toISOString()
      };
      setOrders(prev => [...prev, targetOrder]);
    }

    const updatedTable: Table = {
      ...(table || { id: tableId, number: 'M-??', zone: 'Principal', capacity: 4 }),
      status: 'in_kitchen',
      currentOrderId: targetOrder.id
    };

    setTables(prev => prev.map(tbl => tbl.id === tableId ? updatedTable : tbl));

    // Persistir en Supabase
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

  const addTable = (tableData: { number: string; zone: 'Principal' | 'Terraza Marina' | 'Zona VIP' | 'Barra'; capacity: number }) => {
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
    if (supabase) {
      supabase.from('tables').delete().eq('id', tableId).then();
    }
    sounds.playClick();
    showToast('info', `Mesa ${table.number} eliminada del plano`);
    addAuditLog('system_action', `Mesa ${table.number} eliminada`);
    return true;
  };

  const resetToDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eterra_tables');
      localStorage.removeItem('eterra_orders');
      localStorage.removeItem('eterra_active_shift');
      localStorage.removeItem('eterra_menu_items');
    }
    setTables(INITIAL_TABLES);
    setMenuItems(INITIAL_MENU_ITEMS);
    setActiveShift(INITIAL_SHIFT);
    setActiveZone('all');
    
    // Resincronizar mesas demo a Supabase
    if (supabase) {
      supabase.from('tables').delete().neq('id', 'null').then(() => {
        const tablesToInsert = INITIAL_TABLES.map(t => ({
          id: t.id,
          number: t.number,
          zone: t.zone,
          capacity: t.capacity,
          status: t.status,
          customer_count: t.customerCount || null,
          current_order_id: t.currentOrderId || null,
          seated_at: t.seatedAt || null,
          opened_timestamp: t.openedTimestamp || null,
          opened_by_user_id: t.openedByUserId || null,
          opened_by_user_name: t.openedByUserName || null,
          assigned_waiter_id: t.assignedWaiterId || null,
          assigned_waiter_name: t.assignedWaiterName || null
        }));
        supabase!.from('tables').insert(tablesToInsert).then();
      });
    }

    sounds.playClick();
    showToast('success', 'Datos y mesas restaurados al estado original verificado');
  };

  // KDS & Platos
  const updateOrderItemStatus = (orderId: string, itemId: string, status: OrderItemStatus) => {
    let updatedTargetOrder: Order | null = null;

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => {
          if (item.id === itemId) {
            const now = new Date().toISOString();
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

  // Caja y Cobros
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
    }
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
    const cashier = currentUser || staff[0];
    const now = new Date();

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
      closedAt: now.toISOString()
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

    // Actualizar orden y mesa
    setOrders(prev => prev.map(o => o.id === completedOrder.id ? completedOrder : o));
    setTables(prev => prev.map(tbl => tbl.id === tableId ? updatedTable : tbl));

    // Persistir en Supabase
    persistOrderToCloud(completedOrder);
    persistTableToCloud(updatedTable);

    // Actualizar ventas en la caja del turno activo
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

  const saveCashAudit = (breakdown: CashDenominationCount, notes?: string) => {
    // Calcular total contado en efectivo
    const totalCounted = 
      (breakdown.b200 * 200) +
      (breakdown.b100 * 100) +
      (breakdown.b50 * 50) +
      (breakdown.b20 * 20) +
      (breakdown.b10 * 10) +
      (breakdown.m5 * 5) +
      (breakdown.m2 * 2) +
      (breakdown.m1 * 1) +
      (breakdown.m050 * 0.50) +
      (breakdown.m020 * 0.20) +
      (breakdown.m010 * 0.10);

    const expectedCash = activeShift.initialCash + activeShift.systemCashSales + activeShift.manualCashEntries - activeShift.manualCashWithdrawals;
    const difference = totalCounted - expectedCash;

    setActiveShift(prev => ({
      ...prev,
      countedCashBreakdown: breakdown,
      countedCashTotal: totalCounted,
      expectedCashTotal: expectedCash,
      cashDifference: difference,
      notes: notes || prev.notes
    }));

    sounds.playCashRegister();
    showToast(
      difference === 0 ? 'success' : (difference > 0 ? 'info' : 'warning'),
      `Arqueo guardado: Contado S/. ${totalCounted.toFixed(2)} | Diferencia: S/. ${difference >= 0 ? '+' : ''}${difference.toFixed(2)}`,
      'Arqueo de Turno (Corte X)'
    );
  };

  const closeCurrentShift = (countedCash: number, countedCards: number, countedYape: number, notes?: string) => {
    const expectedCash = activeShift.initialCash + activeShift.systemCashSales + activeShift.manualCashEntries - activeShift.manualCashWithdrawals;
    const diff = countedCash - expectedCash;

    const closed: CashShift = {
      ...activeShift,
      closedBy: currentUser?.name || 'Administrador',
      closedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      countedCashTotal: countedCash,
      countedCardTotal: countedCards,
      countedYapePlinTotal: countedYape,
      expectedCashTotal: expectedCash,
      cashDifference: diff,
      status: 'closed',
      notes
    };

    setShiftHistory(prev => [closed, ...prev]);
    sounds.playCashRegister();
    showToast('success', `Turno "${closed.shiftName}" cerrado correctamente (Corte Z)`, 'Cierre de Caja');
    addAuditLog('shift_closed', `Turno ${closed.shiftName} cerrado con diferencia de S/. ${diff.toFixed(2)}`);
  };

  const openNewShift = (shiftName: string, initialCash: number) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      shiftName,
      openedBy: currentUser?.name || 'Cajero',
      openedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      initialCash,
      systemCashSales: 0,
      systemCardSales: 0,
      systemYapePlinSales: 0,
      systemOtherSales: 0,
      systemTotalSales: 0,
      manualCashWithdrawals: 0,
      manualCashEntries: 0,
      status: 'open'
    };
    setActiveShift(newShift);
    sounds.playClick();
    showToast('success', `Nuevo turno "${shiftName}" aperturado con fondo inicial S/. ${initialCash.toFixed(2)}`);
  };

  // Reservas
  const createReservation = (resData: Omit<Reservation, 'id' | 'code' | 'createdAt' | 'status' | 'paymentStatus'>): Reservation => {
    const newRes: Reservation = {
      ...resData,
      id: `res-${Date.now()}`,
      code: `RES-${Math.floor(100 + Math.random() * 900)}`,
      status: 'confirmed',
      paymentStatus: resData.depositAmount > 0 ? 'paid' : 'none',
      createdAt: new Date().toISOString()
    };
    setReservations(prev => [newRes, ...prev]);
    sounds.playKitchenBell();
    showToast('success', `¡Reserva ${newRes.code} confirmada para ${newRes.customerName}!`, 'Reserva ÉTERRA');
    return newRes;
  };

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast('info', `Estado de reserva actualizado a: ${status.toUpperCase()}`);
  };

  const updatePromotion = (promo: Promotion) => {
    setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p));
    showToast('success', `Promoción "${promo.title}" actualizada`);
  };

  // Carrito Público & Online Order
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
      orderedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    sounds.playKitchenBell();
    showToast('success', `¡Pedido online ${newOrder.code} recibido y enviado a cocina!`, 'ÉTERRA Online');
    return newOrder;
  };

  const addAuditLog = (action: AuditLog['action'], description: string, metadata?: Record<string, any>) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Sistema',
      userRole: currentUser?.role || 'customer',
      action,
      description,
      metadata
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        currentThemeColors,
        setThemePreset,
        updateCustomTheme,
        updateRestaurantInfo,
        staff,
        currentUser,
        loginWithPin,
        switchUser,
        logoutStaff,
        isPinModalOpen,
        setIsPinModalOpen,
        pendingActionUser,
        setPendingActionUser,
        categories,
        menuItems,
        toggleDishAvailability,
        updateDish,
        addDish,
        tables,
        activeZone,
        setActiveZone,
        openTable,
        transferTable,
        requestTableBill,
        cleanTable,
        addTable,
        updateTable,
        deleteTable,
        resetToDemoData,
        orders,
        createOrderForTable,
        addItemsToTableOrder,
        updateOrderItemStatus,
        cancelOrderItem,
        activeShift,
        shiftHistory,
        processTablePayment,
        saveCashAudit,
        closeCurrentShift,
        openNewShift,
        reservations,
        createReservation,
        updateReservationStatus,
        promotions,
        updatePromotion,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        submitOnlineOrder,
        auditLogs,
        addAuditLog,
        toasts,
        showToast,
        removeToast,
        soundEnabled,
        setSoundEnabled
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
