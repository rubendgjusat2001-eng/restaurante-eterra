// TypeScript Data Models for ÉTERRA & Multi-Tenant Restaurant OS

export type UserRole = 
  | 'owner'           // Dueño / Owner: Acceso total, CMS, Finanzas, Configuración
  | 'manager'         // Gerente / Administrador de Sede
  | 'cashier'         // Cajero: Cobro, Facturación SUNAT, Arqueo de Caja
  | 'waiter'          // Mozo / Mesero: Comandero táctil, Mesas
  | 'waiter_cashier'  // Rol Híbrido: Mozo y Cajero a la vez (para restaurantes pequeños)
  | 'kitchen'         // Cocinero / KDS Cocina (Fría y Caliente)
  | 'bar'             // Bartender / KDS Bar
  | 'customer';       // Cliente público

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // PIN de 4 dígitos
  avatar: string;
  color: string;
  active: boolean;
  // Expediente (Fase E) — todos opcionales, el Cargo es informativo/RRHH y
  // NO otorga permisos (eso lo hace `role`, la función operativa).
  positionId?: string;
  positionName?: string;
  phone?: string;
  documentId?: string;
  email?: string;
  hireDate?: string;
  address?: string;
  notes?: string;
}

export interface StaffPosition {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface StaffExpense {
  id: string;
  staffId: string;
  concept: string;
  amount: number;
  expenseDate: string;
  createdBy?: string;
  notes?: string;
  createdAt: string;
}

export type GastroThemePreset = 
  | 'marisqueria'  // ÉTERRA: Azul Abisal, Océano Profundo y Oro Tostado
  | 'brasas'       // Carnes y Pollerías: Carbón Negro, Naranja Fuego y Ámbar
  | 'cafeteria'    // Cafetería & Brunch: Espresso, Crema Avellana y Lino
  | 'chifa'        // Cocina Oriental: Borgoña Imperial, Jade y Oro
  | 'restobar'     // Coctelería & Bar: Dark OLED, Neón Esmeralda y Vidrio
  | 'trattoria'    // Italiana: Verde Albahaca, Terracota y Pomodoro
  | 'custom';      // Paleta personalizada

export interface ThemeColors {
  primary: string;      // Color dominante principal
  primaryHover: string; // Hover state
  secondary: string;    // Color secundario
  accent: string;       // Color de acento / botones destacados / badges
  bgLight: string;      // Fondo claro principal (Blanco puro / Slate-50)
  bgDark?: string;      // Fondo oscuro opcional
  bgCard: string;       // Fondo de tarjetas y paneles
  textMain: string;     // Color de texto principal
  textMuted: string;    // Color de texto secundario / subtítulos
  border: string;       // Bordes y divisores
}

export interface RestaurantInfo {
  id: string;
  slug: string;
  name: string;
  slogan: string;
  story: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  currency: string;      // 'PEN' (S/.) o 'USD' ($)
  taxRate: number;        // 18% IGV
  themePreset: GastroThemePreset;
  customTheme?: ThemeColors;
  logoUrl?: string;
  heroImageUrl: string;
  openingHours: {
    days: string;
    lunch: string;
    dinner: string;
  };
  tableCount: number;
}

export type DishStation = 'kitchen_cold' | 'kitchen_hot' | 'bar' | 'dessert';

export interface ModifierOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  imageUrl: string;
  station: DishStation;
  isAvailable: boolean; // 86-List toggle
  isFeatured: boolean;
  preparationMinutes: number;
  tags: string[];       // ['Picante', 'Mariscos', 'Recomendado del Chef', 'Sin Gluten']
  modifierGroups?: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  sortOrder: number;
}

export type TableStatus = 
  | 'available'      // 🟢 Libre
  | 'occupied'       // 🔴 Ocupada con comanda en curso
  | 'in_kitchen'     // 🟡 Pedido enviado a cocina (esperando platos)
  | 'bill_requested' // 🔵 Cuenta solicitada
  | 'cleaning';      // ⚪ En limpieza

export interface Table {
  id: string;
  number: string;
  /** Nombre de zona configurable (Fase D) — ver restaurant_zones / use-zones.ts. */
  zone: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  openedByUserId?: string;
  openedByUserName?: string;
  seatedAt?: string;             // Hora legible, e.g. "13:30"
  openedTimestamp?: number;       // Epoch ms para cálculo en vivo de permanencia
  closedByUserId?: string;
  closedByUserName?: string;
  closedAt?: string;
  customerCount?: number;
}

export type OrderItemStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderCourse = 'starter' | 'main' | 'drink' | 'dessert';

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  station: DishStation;
  course: OrderCourse;
  status: OrderItemStatus;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  orderedAt: string;
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export type OrderType = 'dine_in' | 'takeout' | 'delivery' | 'reservation_prepay';
export type OrderPaymentMethod = 'cash' | 'card' | 'yape_plin' | 'split' | 'pending';
export type InvoiceType = 'ticket' | 'boleta' | 'factura';

export interface Order {
  id: string;
  code: string; // Ej: "CMD-084"
  tableId?: string;
  tableNumber?: string;
  waiterId: string;
  waiterName: string;
  openedByUserId?: string;
  openedByUserName?: string;
  openedTimestamp?: number;
  closedByUserId?: string;
  closedByUserName?: string;
  closedAt?: string;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  tax: number; // IGV 18%
  tip: number;
  discount: number;
  total: number;
  status: 'active' | 'completed' | 'cancelled';
  cancellationReason?: string;
  cancelledBy?: string;
  paymentMethod: OrderPaymentMethod;
  invoiceType?: InvoiceType;
  customerDocument?: string; // DNI o RUC
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  code: string; // Ej: "RES-702"
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: number;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:MM
  zonePreference: string;
  tableId?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled';
  specialRequests?: string;
  depositAmount: number;
  paymentStatus: 'none' | 'paid' | 'refunded';
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  badge: string;
  includes: string[];
  validUntil: string;
  active: boolean;
}

// Conteo detallado de billetes y monedas (Perú Soles S/.)
export interface CashDenominationCount {
  // Billetes
  b200: number;
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  // Monedas
  m5: number;
  m2: number;
  m1: number;
  m050: number;
  m020: number;
  m010: number;
}

export interface CashShift {
  id: string;
  shiftName: string; // 'Turno Mañana / Almuerzo', 'Turno Noche'
  openedBy: string; // Nombre del cajero/administrador
  closedBy?: string;
  openedAt: string;
  closedAt?: string;
  initialCash: number; // Fondo de caja inicial
  // Métricas registradas por sistema
  systemCashSales: number;
  systemCardSales: number;
  systemYapePlinSales: number;
  systemOtherSales: number;
  systemTotalSales: number;
  manualCashWithdrawals: number; // Egresos menores (ej. compras de hielo)
  manualCashEntries: number;     // Ingresos varios
  // Conteo físico del cajero
  countedCashBreakdown?: CashDenominationCount;
  countedCashTotal?: number;
  countedCardTotal?: number;
  countedYapePlinTotal?: number;
  // Cuadre final
  expectedCashTotal?: number;
  cashDifference?: number; // (Contado - Esperado): Positivo = Sobrante, Negativo = Faltante
  status: 'open' | 'closed';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'dish_cancelled' | 'table_merged' | 'table_created' | 'table_deleted' | 'discount_applied' | 'price_changed' | 'shift_closed' | 'stock_depleted' | 'system_action';
  description: string;
  metadata?: Record<string, any>;
}
