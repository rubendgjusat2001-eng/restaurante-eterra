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

// Build Version & Security Stamp
export const SYSTEM_BUILD_VERSION = 'v2026.08.26.1510_ENTERPRISE_SECURE';
export const BUILD_TIMESTAMP = Date.now();

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
  }
];

export const INITIAL_TABLES: Table[] = [];

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat-01', name: 'Ceviches & Tiraditos', slug: 'ceviches', iconName: 'Fish', sortOrder: 1 },
  { id: 'cat-02', name: 'Brasas & Arroces', slug: 'arroces', iconName: 'Flame', sortOrder: 2 },
  { id: 'cat-03', name: 'Entradas & Causas', slug: 'entradas', iconName: 'Sparkles', sortOrder: 3 },
  { id: 'cat-04', name: 'Especialidades ÉTERRA', slug: 'especialidades', iconName: 'Crown', sortOrder: 4 },
  { id: 'cat-05', name: 'Coctelería Marina & Bar', slug: 'cocteleria', iconName: 'Wine', sortOrder: 5 },
  { id: 'cat-06', name: 'Postres de Autor', slug: 'postres', iconName: 'Cake', sortOrder: 6 }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_PROMOTIONS: Promotion[] = [];

export const INITIAL_SHIFT: CashShift = {
  id: 'shift-01',
  shiftName: 'Turno Principal',
  openedBy: 'Rubén Valdivia',
  openedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  initialCash: 0.00,
  systemCashSales: 0.00,
  systemCardSales: 0.00,
  systemYapePlinSales: 0.00,
  systemOtherSales: 0.00,
  systemTotalSales: 0.00,
  manualCashWithdrawals: 0.00,
  manualCashEntries: 0.00,
  status: 'open'
};
