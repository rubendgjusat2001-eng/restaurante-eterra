// Initial Data & Theme Constants for ÉTERRA & Multi-Tenant Gastro OS
import { 
  GastroThemePreset, 
  ThemeColors, 
  RestaurantInfo, 
  StaffUser, 
  MenuCategory, 
  MenuItem, 
  Table, 
  Promotion, 
  CashShift 
} from '@/types/restaurant';

export const GASTRO_THEMES: Record<GastroThemePreset, { name: string; icon: string; description: string; colors: ThemeColors }> = {
  marisqueria: {
    name: 'Marisquería & Alta Cocina (ÉTERRA)',
    icon: '🌊',
    description: 'Fondo blanco pulcro, azul océano y acentos dorados.',
    colors: {
      primary: '#0284c7',       // Azul océano profundo
      primaryHover: '#0369a1',
      secondary: '#0f172a',     // Slate profundo
      accent: '#d97706',        // Ámbar / Oro tostado
      bgLight: '#f8fafc',       // Blanco puro / Slate-50
      bgCard: '#ffffff',        // Blanco puro
      textMain: '#0f172a',      // Texto oscuro de alto contraste
      textMuted: '#64748b',     // Texto secundario
      border: '#e2e8f0',        // Borde suave
    }
  },
  brasas: {
    name: 'Brasas, Carnes & Pollerías',
    icon: '🔥',
    description: 'Fondo blanco cálido, carbón y naranja fuego.',
    colors: {
      primary: '#ea580c',       // Naranja fuego
      primaryHover: '#c2410c',
      secondary: '#18181b',
      accent: '#d97706',
      bgLight: '#fafaf9',
      bgCard: '#ffffff',
      textMain: '#1c1917',
      textMuted: '#78716c',
      border: '#e7e5e4',
    }
  },
  cafeteria: {
    name: 'Cafetería, Brunch & Bakery',
    icon: '☕',
    description: 'Fondo lino claro, espresso y crema avellana.',
    colors: {
      primary: '#9a3412',       // Caramelo tostado
      primaryHover: '#7c2d12',
      secondary: '#292524',
      accent: '#b45309',
      bgLight: '#fdfbf7',
      bgCard: '#ffffff',
      textMain: '#292524',
      textMuted: '#78716c',
      border: '#e7e5e4',
    }
  },
  chifa: {
    name: 'Chifa & Cocina Oriental',
    icon: '🥢',
    description: 'Fondo marfil suave, borgoña imperial y jade.',
    colors: {
      primary: '#be123c',       // Rojo imperial
      primaryHover: '#9f1239',
      secondary: '#1f2937',
      accent: '#059669',        // Jade
      bgLight: '#fef2f2',
      bgCard: '#ffffff',
      textMain: '#111827',
      textMuted: '#6b7280',
      border: '#fecdd3',
    }
  },
  restobar: {
    name: 'Restobar & Coctelería Nocturna',
    icon: '🍸',
    description: 'Fondo blanco nítido, verde esmeralda y violeta.',
    colors: {
      primary: '#059669',       // Verde esmeralda
      primaryHover: '#047857',
      secondary: '#09090b',
      accent: '#7c3aed',        // Violeta
      bgLight: '#f8fafc',
      bgCard: '#ffffff',
      textMain: '#09090b',
      textMuted: '#71717a',
      border: '#e4e4e7',
    }
  },
  trattoria: {
    name: 'Pizzería & Trattoria Italiana',
    icon: '🍕',
    description: 'Fondo blanco limpio, verde albahaca y pomodoro.',
    colors: {
      primary: '#15803d',       // Verde albahaca
      primaryHover: '#166534',
      secondary: '#1c1917',
      accent: '#dc2626',        // Rojo pomodoro
      bgLight: '#fafaf9',
      bgCard: '#ffffff',
      textMain: '#1c1917',
      textMuted: '#78716c',
      border: '#e7e5e4',
    }
  },
  custom: {
    name: 'Paleta Personalizada',
    icon: '🎨',
    description: 'Configuración a medida de colores primarios y acentos.',
    colors: {
      primary: '#0284c7',
      primaryHover: '#0369a1',
      secondary: '#0f172a',
      accent: '#d97706',
      bgLight: '#f8fafc',
      bgCard: '#ffffff',
      textMain: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
    }
  }
};

export const INITIAL_RESTAURANT: RestaurantInfo = {
  id: 'rest-eterra-01',
  slug: 'eterra',
  name: 'ÉTERRA',
  slogan: 'Alta Cocina Marina & Gastronomía de Vanguardia',
  story: 'Inspirados en las corrientes del Pacífico Sur y las técnicas ancestrales de la costa peruana, ÉTERRA rinde homenaje al mar con una propuesta sensorial de producto fresco, brasas marinas y coctelería botánica de autor.',
  phone: '+51 (01) 748-9200',
  whatsapp: '+51 987 654 321',
  email: 'reservas@eterra.pe',
  address: 'Malecón de la Reserva 1080, Miraflores',
  city: 'Lima, Perú',
  currency: 'PEN',
  taxRate: 18.0,
  themePreset: 'marisqueria',
  heroImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1600&auto=format&fit=crop',
  openingHours: {
    days: 'Lunes a Domingo',
    lunch: '12:00 PM – 4:30 PM',
    dinner: '7:00 PM – 11:30 PM'
  },
  tableCount: 16
};

export const STAFF_MEMBERS: StaffUser[] = [
  {
    id: 'user-01',
    name: 'Rubén Valdivia',
    role: 'owner',
    pin: '1234',
    avatar: '👑',
    color: 'from-amber-500 to-amber-700',
    active: true
  },
  {
    id: 'user-02',
    name: 'Carlos Mendoza',
    role: 'manager',
    pin: '2222',
    avatar: '👔',
    color: 'from-blue-600 to-indigo-700',
    active: true
  },
  {
    id: 'user-03',
    name: 'Valeria Quispe',
    role: 'cashier',
    pin: '3333',
    avatar: '💳',
    color: 'from-emerald-600 to-teal-700',
    active: true
  },
  {
    id: 'user-04',
    name: 'Mateo Morales',
    role: 'waiter_cashier',
    pin: '4444',
    avatar: '⚡',
    color: 'from-cyan-500 to-blue-600',
    active: true
  },
  {
    id: 'user-05',
    name: 'Lucía Benítez',
    role: 'waiter',
    pin: '5555',
    avatar: '🍽️',
    color: 'from-purple-500 to-indigo-600',
    active: true
  },
  {
    id: 'user-06',
    name: 'Chef Mitsuharu',
    role: 'kitchen',
    pin: '6666',
    avatar: '👨‍🍳',
    color: 'from-red-500 to-orange-600',
    active: true
  },
  {
    id: 'user-07',
    name: 'Renzo Bartender',
    role: 'bar',
    pin: '7777',
    avatar: '🍸',
    color: 'from-pink-500 to-rose-600',
    active: true
  }
];

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat-01', name: 'Ceviches & Tiraditos', slug: 'ceviches', iconName: 'Fish', sortOrder: 1 },
  { id: 'cat-02', name: 'Brasas & Arroces', slug: 'arroces', iconName: 'Flame', sortOrder: 2 },
  { id: 'cat-03', name: 'Entradas & Causas', slug: 'entradas', iconName: 'Sparkles', sortOrder: 3 },
  { id: 'cat-04', name: 'Especialidades ÉTERRA', slug: 'especialidades', iconName: 'Crown', sortOrder: 4 },
  { id: 'cat-05', name: 'Coctelería Marina & Bar', slug: 'cocteleria', iconName: 'Wine', sortOrder: 5 },
  { id: 'cat-06', name: 'Postres de Autor', slug: 'postres', iconName: 'Cake', sortOrder: 6 }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dish-01',
    categoryId: 'cat-01',
    name: 'Ceviche ÉTERRA Clásico',
    description: 'Corvina salvaje fresca del día, leche de tigre al ají limo, choclo tierno desgranado, camote glaseado en naranja y canchita chulpi crocante.',
    price: 58.00,
    costPrice: 16.50,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?q=80&w=800&auto=format&fit=crop',
    station: 'kitchen_cold',
    isAvailable: true,
    isFeatured: true,
    preparationMinutes: 8,
    tags: ['Recomendado', 'Picante Graduable', 'Sin Gluten'],
    modifierGroups: [
      {
        id: 'mod-picante',
        name: 'Nivel de Picante',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'p0', name: 'Sin Picante (Leche de tigre suave)', extraPrice: 0 },
          { id: 'p1', name: 'Poco Picante', extraPrice: 0 },
          { id: 'p2', name: 'Picante Medio (Clásico)', extraPrice: 0 },
          { id: 'p3', name: 'Picante Bravo (Ají Limo puro)', extraPrice: 0 }
        ]
      },
      {
        id: 'mod-guarnicion',
        name: 'Extras & Acompañamientos',
        required: false,
        minSelect: 0,
        maxSelect: 3,
        options: [
          { id: 'e1', name: 'Porción Extra de Chicharrón de Calamar', extraPrice: 14.00 },
          { id: 'e2', name: 'Canchita Chulpi Extra', extraPrice: 4.00 },
          { id: 'e3', name: 'Camote Glaseado Adicional', extraPrice: 5.00 }
        ]
      }
    ]
  },
  {
    id: 'dish-02',
    categoryId: 'cat-01',
    name: 'Tiradito Nikkei de Atún & Trufa',
    description: 'Láminas finas de atún aleta amarilla sellado, emulsión de salsa ponzu con ají amarillo y rocoto ahumado, aceite de trufa blanca y quinua crocante.',
    price: 64.00,
    costPrice: 19.00,
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800&auto=format&fit=crop',
    station: 'kitchen_cold',
    isAvailable: true,
    isFeatured: true,
    preparationMinutes: 7,
    tags: ['Fusión Nikkei', 'Favorito del Chef'],
    modifierGroups: [
      {
        id: 'mod-cebolla',
        name: 'Preferencias de Preparación',
        required: false,
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'c1', name: 'Sin cebolla china', extraPrice: 0 },
          { id: 'c2', name: 'Extra quinua crocante', extraPrice: 3.00 }
        ]
      }
    ]
  },
  {
    id: 'dish-03',
    categoryId: 'cat-02',
    name: 'Arroz Meloso con Mariscos & Pulpo a la Brasa',
    description: 'Arroz norteño aromatizado con ají panca y cerveza negra, salteado al wok con langostinos, calamares y coronado con tentáculo de pulpo a la brasa.',
    price: 72.00,
    costPrice: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop',
    station: 'kitchen_hot',
    isAvailable: true,
    isFeatured: true,
    preparationMinutes: 14,
    tags: ['Especialidad al Wok', 'Mariscos'],
    modifierGroups: [
      {
        id: 'mod-cremas',
        name: 'Salsas al Gusto',
        required: false,
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 's1', name: 'Salsa Tártara Marina de la Casa', extraPrice: 0 },
          { id: 's2', name: 'Crema de Rocoto de Carretilla', extraPrice: 0 },
          { id: 's3', name: 'Salsa Criolla Extra', extraPrice: 4.00 }
        ]
      }
    ]
  },
  {
    id: 'dish-04',
    categoryId: 'cat-02',
    name: 'Chicharrón de Pulpo & Pescado con Yuca Frita',
    description: 'Trozos crocantes de corvina y pulpo marinados en mostaza dijon y especias peruanas, acompañados de yucas doradas y salsa tártara de maracuyá.',
    price: 56.00,
    costPrice: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1559742811-822873691df8?q=80&w=800&auto=format&fit=crop',
    station: 'kitchen_hot',
    isAvailable: true,
    isFeatured: false,
    preparationMinutes: 11,
    tags: ['Para Compartir', 'Crocante'],
  },
  {
    id: 'dish-05',
    categoryId: 'cat-03',
    name: 'Trío de Causas Limeñas de Vanguardia',
    description: 'Papa amarilla prensada con ají amarillo y lima, en tres versiones: Cangrejo reventado, Pulpo al olivo con cenizas de ají y Tartar de salmón ahumado.',
    price: 49.00,
    costPrice: 12.00,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop',
    station: 'kitchen_cold',
    isAvailable: true,
    isFeatured: false,
    preparationMinutes: 6,
    tags: ['Entrada Tradicional', 'Degustación']
  },
  {
    id: 'dish-06',
    categoryId: 'cat-04',
    name: 'Parihuela ÉTERRA en Olla de Barro',
    description: 'Concentrado marino de pescados de roca, cangrejo entero, langostinos, calamares y conchas negras flameadas con pisco quebranta y hierba buena.',
    price: 78.00,
    costPrice: 24.00,
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop',
    station: 'kitchen_hot',
    isAvailable: true,
    isFeatured: true,
    preparationMinutes: 16,
    tags: ['Plato Insignia', 'Reconstituyente']
  },
  {
    id: 'dish-07',
    categoryId: 'cat-05',
    name: 'Pisco Sour ÉTERRA Reserva 1615',
    description: 'Pisco Quebranta Granizo, zumo fresco de limón criollo recién exprimido, jarabe de goma perfumado con cáscara de naranja y clara pasteurizada.',
    price: 34.00,
    costPrice: 7.50,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop',
    station: 'bar',
    isAvailable: true,
    isFeatured: true,
    preparationMinutes: 4,
    tags: ['Cóctel Insignia', 'Coctelería de Autor'],
    modifierGroups: [
      {
        id: 'mod-pisco',
        name: 'Variedad de Pisco Sour',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'ps1', name: 'Clásico Quebranta', extraPrice: 0 },
          { id: 'ps2', name: 'Maracuyá Sour', extraPrice: 2.00 },
          { id: 'ps3', name: 'Chicha Morada Sour', extraPrice: 2.00 },
          { id: 'ps4', name: 'Macerado de Coca y Muña', extraPrice: 4.00 }
        ]
      }
    ]
  },
  {
    id: 'dish-08',
    categoryId: 'cat-05',
    name: 'Chilcano de Pisco con Macerado de Hierbaluisa',
    description: 'Pisco acholado infusionado con hierbaluisa silvestre, ginger ale artesanal, gotas de bitter de angostura y piel de lima.',
    price: 30.00,
    costPrice: 6.00,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop',
    station: 'bar',
    isAvailable: true,
    isFeatured: false,
    preparationMinutes: 3,
    tags: ['Refrescante']
  },
  {
    id: 'dish-09',
    categoryId: 'cat-06',
    name: 'Esfera de Chocolate Amazónico & Lúcuma',
    description: 'Cúpula de cacao orgánico de Tarapoto 70%, rellena de mousse de lúcuma de seda, coulis de aguaymanto y tierra crocante de quinua tostada.',
    price: 36.00,
    costPrice: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop',
    station: 'dessert',
    isAvailable: true,
    isFeatured: true,
    preparationMinutes: 5,
    tags: ['Postre Gourmet', 'Cacao Peruano']
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: 'tbl-01', number: 'M-01', zone: 'Principal', capacity: 2, status: 'available' },
  { 
    id: 'tbl-02', 
    number: 'M-02', 
    zone: 'Principal', 
    capacity: 4, 
    status: 'occupied', 
    currentOrderId: 'cmd-101', 
    customerCount: 3, 
    seatedAt: '13:10', 
    openedByUserId: 'usr-03', 
    openedByUserName: 'Mateo Morales', 
    assignedWaiterId: 'usr-03', 
    assignedWaiterName: 'Mateo Morales',
    openedTimestamp: Date.now() - 35 * 60000 
  },
  { 
    id: 'tbl-03', 
    number: 'M-03', 
    zone: 'Principal', 
    capacity: 4, 
    status: 'in_kitchen', 
    currentOrderId: 'cmd-102', 
    customerCount: 4, 
    seatedAt: '13:25', 
    openedByUserId: 'usr-04', 
    openedByUserName: 'Sofía Valdivia', 
    assignedWaiterId: 'usr-04', 
    assignedWaiterName: 'Sofía Valdivia',
    openedTimestamp: Date.now() - 20 * 60000 
  },
  { 
    id: 'tbl-04', 
    number: 'M-04', 
    zone: 'Principal', 
    capacity: 6, 
    status: 'bill_requested', 
    currentOrderId: 'cmd-100', 
    customerCount: 5, 
    seatedAt: '12:40', 
    openedByUserId: 'usr-03', 
    openedByUserName: 'Mateo Morales', 
    assignedWaiterId: 'usr-03', 
    assignedWaiterName: 'Mateo Morales',
    openedTimestamp: Date.now() - 65 * 60000 
  },
  { id: 'tbl-05', number: 'T-01', zone: 'Terraza Marina', capacity: 2, status: 'available' },
  { 
    id: 'tbl-06', 
    number: 'T-02', 
    zone: 'Terraza Marina', 
    capacity: 4, 
    status: 'occupied', 
    currentOrderId: 'cmd-103', 
    customerCount: 2, 
    seatedAt: '13:30', 
    openedByUserId: 'usr-05', 
    openedByUserName: 'Renato Cárdenas', 
    assignedWaiterId: 'usr-05', 
    assignedWaiterName: 'Renato Cárdenas',
    openedTimestamp: Date.now() - 15 * 60000 
  },
  { id: 'tbl-07', number: 'T-03', zone: 'Terraza Marina', capacity: 4, status: 'available' },
  { id: 'tbl-08', number: 'T-04', zone: 'Terraza Marina', capacity: 6, status: 'cleaning' },
  { id: 'tbl-09', number: 'VIP-01', zone: 'Zona VIP', capacity: 8, status: 'available' },
  { id: 'tbl-10', number: 'VIP-02', zone: 'Zona VIP', capacity: 12, status: 'available' },
  { id: 'tbl-11', number: 'B-01', zone: 'Barra', capacity: 2, status: 'available' },
  { id: 'tbl-12', number: 'B-02', zone: 'Barra', capacity: 2, status: 'available' }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-01',
    title: 'Festival Marino ÉTERRA (Para 2 a 3 Personas)',
    subtitle: '1 Ceviche Clásico + 1 Arroz Meloso con Mariscos + 2 Pisco Sours',
    description: 'La experiencia completa de nuestra cocina marina a un precio de celebración exclusivo para reservas y pedidos online.',
    price: 139.00,
    originalPrice: 198.00,
    discountPercent: 30,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
    badge: '30% DSCTO',
    includes: [
      '1 Ceviche ÉTERRA Clásico en Corvina Fresca',
      '1 Arroz Meloso con Mariscos y Pulpo a la Brasa',
      '2 Pisco Sours de Reserva 1615',
      'Canchita Chulpi y Chifles Ilimitados'
    ],
    validUntil: '31 de Octubre',
    active: true
  },
  {
    id: 'promo-02',
    title: 'Experiencia Nikkei & Coctelería de Autor',
    subtitle: 'Tiradito de Atún & Trufa + Causa de Cangrejo + 2 Chilcanos Botánicos',
    description: 'Un viaje sensorial por la costa peruana y la influencia japonesa con nuestra coctelería infusionada.',
    price: 119.00,
    originalPrice: 173.00,
    discountPercent: 31,
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800&auto=format&fit=crop',
    badge: 'TOP VENTAS',
    includes: [
      '1 Tiradito Nikkei de Atún & Trufa Blanca',
      '1 Trío de Causas Limeñas de Vanguardia',
      '2 Chilcanos de Pisco con Hierbaluisa Silvestre'
    ],
    validUntil: 'Domingo de 12pm a 5pm',
    active: true
  }
];

export const INITIAL_SHIFT: CashShift = {
  id: 'shift-today-01',
  shiftName: 'Turno Almuerzo',
  openedBy: 'Valeria Quispe',
  openedAt: '11:30 AM',
  initialCash: 350.00,
  systemCashSales: 1240.00,
  systemCardSales: 2180.00,
  systemYapePlinSales: 940.00,
  systemOtherSales: 0.00,
  systemTotalSales: 4360.00,
  manualCashWithdrawals: 50.00, // Compra de hielo
  manualCashEntries: 0.00,
  status: 'open'
};
