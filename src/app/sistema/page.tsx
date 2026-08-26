'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ToastContainer } from '@/components/common/ToastContainer';

// Componentes y Vistas Completas del Sistema Interno
import { SidebarDrawer } from '@/components/internal/SidebarDrawer';
import { InternalHeader } from '@/components/internal/InternalHeader';
import { InternalTab } from '@/components/internal/InternalNavbar';
import { WaiterFloorMap } from '@/components/internal/WaiterFloorMap';
import { KitchenKDS } from '@/components/internal/KitchenKDS';
import { CashierDesk } from '@/components/internal/CashierDesk';
import { CashDrawerModal } from '@/components/internal/CashDrawerModal';
import { OwnerDashboard } from '@/components/internal/OwnerDashboard';
import { StaffManagementView } from '@/components/internal/StaffManagementView';
import { DishManagementView } from '@/components/internal/DishManagementView';
import { SettingsView } from '@/components/internal/SettingsView';
import { SystemLoginScreen } from '@/components/common/SystemLoginScreen';

// Mapeo entre pestañas internas y slugs de URL
const TAB_TO_SLUG: Record<InternalTab, string> = {
  waiter: 'mesas',
  kitchen: 'cocina',
  cashier: 'caja',
  owner: 'dashboard',
  dishes: 'carta',
  staff: 'personal',
  settings: 'configuracion',
  shift: 'caja'
};

const SLUG_TO_TAB: Record<string, InternalTab> = {
  mesas: 'waiter',
  salon: 'waiter',
  cocina: 'kitchen',
  kds: 'kitchen',
  caja: 'cashier',
  facturacion: 'cashier',
  dashboard: 'owner',
  kpis: 'owner',
  carta: 'dishes',
  platos: 'dishes',
  personal: 'staff',
  roles: 'staff',
  usuarios: 'staff',
  configuracion: 'settings',
  ajustes: 'settings'
};

export default function SistemaPrivadoPage() {
  const { currentUser } = useRestaurant();

  // Pestaña o Vista activa dentro del ERP interno
  const [internalTab, setInternalTab] = useState<InternalTab>('waiter');

  // Estado del Sidebar / Drawer Desplegable
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal de Arqueo Físico de Caja
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

  // 1. Leer pestaña inicial desde la URL al cargar la página
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam && SLUG_TO_TAB[tabParam]) {
      setInternalTab(SLUG_TO_TAB[tabParam]);
    }
  }, []);

  // 2. Función para cambiar pestaña y actualizar dinámicamente la URL en el navegador
  const handleTabChange = useCallback((tab: InternalTab) => {
    setInternalTab(tab);
    if (typeof window !== 'undefined') {
      const slug = TAB_TO_SLUG[tab] || 'mesas';
      const newUrl = `/sistema?tab=${slug}`;
      if (window.location.search !== `?tab=${slug}`) {
        window.history.pushState({ tab }, '', newUrl);
      }
    }
  }, []);

  // 3. Soporte para botones Atrás / Adelante del navegador
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab')?.toLowerCase();
      if (tabParam && SLUG_TO_TAB[tabParam]) {
        setInternalTab(SLUG_TO_TAB[tabParam]);
      } else {
        setInternalTab('waiter');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 4. Sincronizar automáticamente la pestaña según el rol del usuario autenticado si no hay URL previa
  useEffect(() => {
    if (!currentUser) return;
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasExplicitTab = params && params.get('tab');
    if (!hasExplicitTab) {
      if (currentUser.role === 'kitchen' || currentUser.role === 'bar') {
        handleTabChange('kitchen');
      } else if (currentUser.role === 'cashier') {
        handleTabChange('cashier');
      } else if (currentUser.role === 'waiter') {
        handleTabChange('waiter');
      }
    }
  }, [currentUser, handleTabChange]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
      
      {/* 1. Si NO hay usuario autenticado: Pantalla de Login 100% Blindada */}
      {!currentUser ? (
        <SystemLoginScreen onGoToPublic={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }} />
      ) : (
        <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-200">
          
          {/* Cabecera Superior con Botón de Menú y Estado */}
          <InternalHeader
            activeTab={internalTab}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenSettings={() => handleTabChange('settings')}
            onOpenCashAudit={() => setIsCashDrawerOpen(true)}
          />

          {/* Menú Lateral Desplegable (Sidebar Drawer) */}
          <SidebarDrawer
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeTab={internalTab}
            onTabChange={tab => handleTabChange(tab)}
            onOpenSettings={() => handleTabChange('settings')}
            onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
            onGoToPublic={() => {
              if (typeof window !== 'undefined') {
                window.open('/', '_blank');
              }
            }}
          />

          {/* Área de Trabajo Operativa por Pantalla Completa Dedicada */}
          <main className="flex-1 overflow-x-hidden">
            {internalTab === 'waiter' && <WaiterFloorMap />}
            {internalTab === 'kitchen' && <KitchenKDS />}
            {internalTab === 'cashier' && <CashierDesk />}
            {internalTab === 'owner' && <OwnerDashboard />}
            {internalTab === 'dishes' && <DishManagementView />}
            {internalTab === 'staff' && <StaffManagementView />}
            {internalTab === 'settings' && <SettingsView />}
          </main>

          {/* Modal de Control y Arqueo Físico de Caja (Corte X y Z) */}
          <CashDrawerModal
            isOpen={isCashDrawerOpen}
            onClose={() => setIsCashDrawerOpen(false)}
          />

        </div>
      )}

      {/* Contenedor de Toasts Hápticos */}
      <ToastContainer />

    </div>
  );
}
