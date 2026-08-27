'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ToastContainer } from '@/components/common/ToastContainer';
import { PinPadModal } from '@/components/common/PinPadModal';

import { SidebarDrawer } from '@/components/internal/SidebarDrawer';
import { InternalHeader } from '@/components/internal/InternalHeader';
import { InternalTab } from '@/components/internal/InternalNavbar';
import { WaiterFloorMap } from '@/components/internal/WaiterFloorMap';
import { KitchenKDS } from '@/components/internal/KitchenKDS';
import { CashierDesk } from '@/components/internal/CashierDesk';
import { CashDrawerModal } from '@/components/internal/CashDrawerModal';
import { OwnerDashboard } from '@/components/internal/OwnerDashboard';
import { StaffManagementView } from '@/components/internal/StaffManagementView';
import { AlmacenView } from '@/components/internal/AlmacenView';
import { DishManagementView } from '@/components/internal/DishManagementView';
import { SettingsView } from '@/components/internal/SettingsView';
import { SystemLoginScreen } from '@/components/common/SystemLoginScreen';
import { AccountSetupScreen } from '@/components/common/AccountSetupScreen';

const TAB_TO_PATH: Record<InternalTab, string> = {
  waiter: 'mesas',
  kitchen: 'cocina',
  cashier: 'caja',
  owner: 'dashboard',
  dishes: 'carta',
  staff: 'personal',
  warehouse: 'almacen',
  settings: 'configuracion',
  shift: 'caja'
};

const PATH_TO_TAB: Record<string, InternalTab> = {
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
  menu: 'dishes',
  personal: 'staff',
  roles: 'staff',
  usuarios: 'staff',
  almacen: 'warehouse',
  inventario: 'warehouse',
  configuracion: 'settings',
  ajustes: 'settings'
};

interface SistemaAppProps {
  /** Sección resuelta desde la URL por /sistema/[section]/page.tsx. Si no se
   * pasa (ruta raíz /sistema), se resuelve del pathname/query en el cliente. */
  initialSection?: string;
}

/**
 * ÚNICA implementación del shell del ERP interno (cabecera, sidebar, candado
 * de autenticación de dos niveles + configuración obligatoria, y las 7
 * vistas). Tanto `src/app/sistema/page.tsx` como
 * `src/app/sistema/[section]/page.tsx` renderizan este mismo componente —
 * Next.js exige un archivo de página por cada ruta, pero TODA la lógica vive
 * acá para que sea estructuralmente imposible que las dos rutas se
 * desincronicen entre sí (ver docs/decisions/0005-forced-account-setup.md,
 * sección "Bug encontrado durante la verificación").
 */
export function SistemaApp({ initialSection }: SistemaAppProps) {
  const { currentUser, isAuthLoaded, mustChangePassword } = useRestaurant();

  const [internalTab, setInternalTab] = useState<InternalTab>(
    (initialSection && PATH_TO_TAB[initialSection.toLowerCase()]) || 'waiter'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

  // Ruta raíz (/sistema, sin section param): resuelve la pestaña inicial desde
  // el pathname o el query string en el cliente.
  useEffect(() => {
    if (initialSection || typeof window === 'undefined') return;
    const pathParts = window.location.pathname.split('/');
    const sectionInPath = pathParts[pathParts.length - 1]?.toLowerCase();

    if (sectionInPath && PATH_TO_TAB[sectionInPath]) {
      setInternalTab(PATH_TO_TAB[sectionInPath]);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam && PATH_TO_TAB[tabParam]) {
      setInternalTab(PATH_TO_TAB[tabParam]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ruta /sistema/[section]: resincroniza si el parámetro de ruta cambia.
  useEffect(() => {
    if (initialSection && PATH_TO_TAB[initialSection.toLowerCase()]) {
      setInternalTab(PATH_TO_TAB[initialSection.toLowerCase()]);
    }
  }, [initialSection]);

  const handleTabChange = useCallback((tab: InternalTab) => {
    setInternalTab(tab);
    if (typeof window !== 'undefined') {
      const sectionPath = TAB_TO_PATH[tab] || 'mesas';
      const newUrl = `/sistema/${sectionPath}`;
      if (window.location.pathname !== newUrl) {
        window.history.pushState({ tab }, '', newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const parts = window.location.pathname.split('/');
      const currentSection = parts[parts.length - 1]?.toLowerCase();
      if (currentSection && PATH_TO_TAB[currentSection]) {
        setInternalTab(PATH_TO_TAB[currentSection]);
      } else {
        setInternalTab('waiter');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-[#050c18] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            É
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Verificando Sesión Segura...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">

      {/* 1. Sin sesión: Login blindado. 2. Con sesión pero contraseña provisional
          de fábrica: configuración obligatoria, sin excepción. 3. ERP normal. */}
      {!currentUser ? (
        <SystemLoginScreen onGoToPublic={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }} />
      ) : mustChangePassword ? (
        <AccountSetupScreen />
      ) : (
        <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-200">
          <InternalHeader
            activeTab={internalTab}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenSettings={() => handleTabChange('settings')}
            onOpenCashAudit={() => setIsCashDrawerOpen(true)}
          />

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

          <main className="flex-1 overflow-x-hidden">
            {internalTab === 'waiter' && <WaiterFloorMap />}
            {internalTab === 'kitchen' && <KitchenKDS />}
            {internalTab === 'cashier' && <CashierDesk />}
            {internalTab === 'owner' && <OwnerDashboard />}
            {internalTab === 'dishes' && <DishManagementView />}
            {internalTab === 'staff' && <StaffManagementView />}
            {internalTab === 'warehouse' && <AlmacenView />}
            {internalTab === 'settings' && <SettingsView />}
          </main>

          <CashDrawerModal
            isOpen={isCashDrawerOpen}
            onClose={() => setIsCashDrawerOpen(false)}
          />
        </div>
      )}

      <PinPadModal />
      <ToastContainer />
    </div>
  );
}
