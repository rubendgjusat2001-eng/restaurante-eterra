'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  RestaurantInfo,
  ThemeColors,
  GastroThemePreset,
  StaffUser,
  UserRole,
  MenuItem,
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
import { supabase } from '@/lib/supabase';
import { syncServerTime } from '@/lib/server-time';

import { useToasts, ToastMessage } from '@/hooks/use-toasts';
import { useAuditLog } from '@/hooks/use-audit-log';
import { useStaff } from '@/hooks/use-staff';
import { useStaffPositions } from '@/hooks/use-staff-positions';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';
import { useMenu } from '@/hooks/use-menu';
import { useTables } from '@/hooks/use-tables';
import { useZones } from '@/hooks/use-zones';
import { useOrders } from '@/hooks/use-orders';
import { useTableLifecycle } from '@/hooks/use-table-lifecycle';
import { useCashShifts } from '@/hooks/use-cash-shifts';
import { useCheckout } from '@/hooks/use-checkout';
import { useReservations } from '@/hooks/use-reservations';
import { useCart, CartItem } from '@/hooks/use-cart';

export type { CartItem, ToastMessage };

/**
 * FASE 2a — Este archivo pasó de ser un único componente de ~1940 líneas a
 * ser solo el "punto de composición": llama a un hook por dominio (cada uno
 * en `src/hooks/`, con su propio acceso a datos en `src/services/`) y junta
 * todo en un solo objeto de contexto con LA MISMA FORMA que antes — por eso
 * ningún componente que use `useRestaurant()` necesitó cambiar.
 *
 * Ver CLAUDE.md §3 y §6, y docs/decisions/ para el porqué de este diseño
 * (en particular, por qué `currentUserRef` existe — Auth, Personal y
 * Auditoría se necesitan mutuamente y un ref evita que un hook tenga que
 * llamar a otro directamente).
 */
interface RestaurantContextType {
  // Configuración & Theme
  restaurant: RestaurantInfo;
  currentThemeColors: ThemeColors;
  setThemePreset: (preset: GastroThemePreset) => void;
  updateCustomTheme: (colors: ThemeColors) => void;
  updateRestaurantInfo: (info: Partial<RestaurantInfo>) => void;

  // Personal & Auth — Nivel 1 (cuentas de acceso: usuario+contraseña) y
  // Nivel 2 (PIN de colaborador, para identificar quién hace una acción)
  staff: StaffUser[];
  currentUser: StaffUser | null;
  isAuthLoaded: boolean;
  mustChangePassword: boolean;
  completeAccountSetup: (payload: {
    currentPassword: string;
    newPassword: string;
    newUsername?: string;
    email?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<boolean>;
  updateOwnerPassword: (currentPass: string, newPass: string) => Promise<boolean>;
  switchUser: (user: StaffUser) => void;
  logoutStaff: () => void;
  addStaffUser: (user: { name: string; role: UserRole; pin: string; avatar?: string }) => void;
  deleteStaffUser: (userId: string) => void;
  updateUserPin: (userId: string, newPin: string) => void;
  updateStaffProfile: (staffId: string, updates: {
    name?: string;
    positionId?: string | null;
    phone?: string;
    documentId?: string;
    email?: string;
    hireDate?: string;
    address?: string;
    notes?: string;
  }) => void;
  positions: { id: string; name: string; description?: string; sortOrder: number }[];
  addPosition: (name: string, description?: string) => Promise<{ id: string; name: string; description?: string; sortOrder: number } | null>;
  removePosition: (id: string) => Promise<void>;
  verifyStaffPin: (staffId: string, pin: string) => Promise<StaffUser | null>;
  requestStaffIdentity: (preselect?: StaffUser | null) => Promise<StaffUser | null>;
  resolveStaffIdentity: (result: StaffUser | null) => void;
  forceLogoutAllDevices: () => Promise<void>;
  purgeAllDataToZero: () => Promise<void>;
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
  deleteDish: (id: string) => void;

  // Mesas y Salones
  tables: Table[];
  activeZone: string;
  setActiveZone: (zone: string) => void;
  openTable: (tableId: string, customerCount: number, waiterId: string) => string;
  transferTable: (sourceId: string, targetId: string) => boolean;
  requestTableBill: (tableId: string) => void;
  cleanTable: (tableId: string) => void;
  addTable: (tableData: { number: string; zone: string; capacity: number }) => void;
  updateTable: (tableId: string, updates: Partial<Table>) => void;
  deleteTable: (tableId: string) => boolean;
  resetToDemoData: () => void;

  // Zonas del local (Fase D, configurables)
  zones: { id: string; name: string; sortOrder: number }[];
  addZone: (name: string) => Promise<{ id: string; name: string; sortOrder: number } | null>;
  renameZone: (id: string, name: string) => Promise<void>;
  removeZone: (id: string) => Promise<void>;

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
    },
    attributedStaff?: { id: string; name: string }
  ) => Order | null;
  saveCashAudit: (breakdown: CashDenominationCount, notes?: string) => void;
  closeCurrentShift: (countedCash: number, countedCards: number, countedYape: number, notes?: string, attributedStaffName?: string) => void;
  openNewShift: (shiftName: string, initialCash: number) => void;
  registerCashMovement: (input: { movementType: 'expense' | 'income'; category: string; concept: string; amount: number }) => Promise<void>;

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
  // currentUserRef rompe el ciclo Auth ↔ Personal ↔ Auditoría: los tres se
  // necesitan mutuamente (Auth usa `staff`, Personal usa `currentUser` para
  // permisos, Auditoría usa `currentUser` para atribuir), y un ref permite
  // que Personal/Auditoría lean el valor más reciente sin que ningún hook
  // tenga que llamar a otro hook directamente.
  const currentUserRef = useRef<StaffUser | null>(null);

  // El portal público (/) y el ERP (/sistema/*) comparten este mismo
  // Provider (montado una vez en layout.tsx). Los dominios operativos del
  // ERP (mesas, pedidos, personal) no necesitan cargar datos ni abrir canales
  // Realtime cuando un visitante anónimo está solo viendo el menú público —
  // isPrivateRoute se pasa a esos hooks para que omitan su fetch inicial y su
  // suscripción mientras la ruta no empiece con /sistema. Ver
  // docs/decisions/0006-public-route-realtime-scoping.md.
  const pathname = usePathname();
  const isPrivateRoute = pathname?.startsWith('/sistema') ?? false;

  const toastsApi = useToasts();
  const auditApi = useAuditLog(currentUserRef);
  const staffApi = useStaff({
    currentUserRef,
    isPrivateRoute,
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });
  const staffPositionsApi = useStaffPositions({ isPrivateRoute });
  const authApi = useAuth({
    staff: staffApi.staff,
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });

  useEffect(() => {
    currentUserRef.current = authApi.currentUser;
  }, [authApi.currentUser]);

  const restaurantProfileApi = useRestaurantProfile({
    showToast: toastsApi.showToast,
    onRestaurantRealtimeSignal: authApi.checkSessionValidity
  });
  const menuApi = useMenu({
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });
  const tablesApi = useTables({
    isPrivateRoute,
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });
  const zonesApi = useZones({ isPrivateRoute });
  const ordersApi = useOrders({
    isPrivateRoute,
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });
  const tableLifecycleApi = useTableLifecycle({
    tables: tablesApi.tables,
    setTables: tablesApi.setTables,
    persistTableToCloud: tablesApi.persistTableToCloud,
    orders: ordersApi.orders,
    setOrders: ordersApi.setOrders,
    persistOrderToCloud: ordersApi.persistOrderToCloud,
    staff: staffApi.staff,
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });
  const cashShiftsApi = useCashShifts({
    currentUserRef,
    isPrivateRoute,
    showToast: toastsApi.showToast,
    addAuditLog: auditApi.addAuditLog
  });
  const checkoutApi = useCheckout({
    tables: tablesApi.tables,
    setTables: tablesApi.setTables,
    persistTableToCloud: tablesApi.persistTableToCloud,
    orders: ordersApi.orders,
    setOrders: ordersApi.setOrders,
    persistOrderToCloud: ordersApi.persistOrderToCloud,
    staff: staffApi.staff,
    activeShiftId: cashShiftsApi.activeShift.id,
    setActiveShift: cashShiftsApi.setActiveShift,
    showToast: toastsApi.showToast
  });
  const reservationsApi = useReservations({ showToast: toastsApi.showToast });
  const cartApi = useCart({
    setOrders: ordersApi.setOrders,
    persistOrderToCloud: ordersApi.persistOrderToCloud,
    showToast: toastsApi.showToast
  });

  // Sincroniza el reloj corregido contra el servidor (ver src/lib/server-time.ts)
  // para que ningún registro del negocio quede atado a la hora del dispositivo.
  useEffect(() => {
    syncServerTime();
    const interval = setInterval(() => {
      syncServerTime();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Limpieza automática (histórica) de caché local antiguo del navegador —
  // se preserva tal cual estaba, toca varios dominios a propósito (es una
  // migración de una sola vez, no una operación normal de ningún dominio).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isClean = localStorage.getItem('eterra_clean_v3');
      if (!isClean) {
        localStorage.removeItem('eterra_tables');
        localStorage.removeItem('eterra_orders');
        localStorage.removeItem('eterra_menu_items');
        localStorage.setItem('eterra_clean_v3', 'true');
        tablesApi.setTables([]);
        ordersApi.setOrders([]);
        menuApi.setMenuItems([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reinicio total del sistema — acción de sistema que toca varios dominios a
  // propósito (no es un bug de organización, es lo que la función hace).
  const purgeAllDataToZero = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eterra_tables');
      localStorage.removeItem('eterra_orders');
      localStorage.removeItem('eterra_active_shift');
      localStorage.removeItem('eterra_menu_items');
      localStorage.setItem('eterra_clean_v3', 'true');
    }
    tablesApi.setTables([]);
    menuApi.setMenuItems([]);
    ordersApi.setOrders([]);
    reservationsApi.setReservations([]);
    tablesApi.setActiveZone('all');

    if (supabase) {
      await supabase.from('orders').delete().neq('id', '___none___');
      await supabase.from('tables').delete().neq('id', '___none___');
      await supabase.from('menu_items').delete().neq('id', '___none___');
    }

    // Reutiliza sonido/alerta del módulo de utils directamente para no
    // depender de otro hook solo para esto.
    toastsApi.showToast('success', 'El sistema ha sido reiniciado a 0 mesas y 0 comandas');
  };

  const resetToDemoData = () => {
    purgeAllDataToZero();
  };

  const value: RestaurantContextType = {
    ...restaurantProfileApi,
    ...staffApi,
    ...staffPositionsApi,
    ...authApi,
    purgeAllDataToZero,
    resetToDemoData,
    ...menuApi,
    ...tablesApi,
    ...zonesApi,
    ...ordersApi,
    ...tableLifecycleApi,
    ...cashShiftsApi,
    ...checkoutApi,
    ...reservationsApi,
    ...cartApi,
    ...auditApi,
    ...toastsApi
  };

  return (
    <RestaurantContext.Provider value={value}>
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
