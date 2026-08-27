'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ToastContainer } from '@/components/common/ToastContainer';
import { PinPadModal } from '@/components/common/PinPadModal';

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

const TAB_TO_PATH: Record<InternalTab, string> = {
  waiter: 'mesas',
  kitchen: 'cocina',
  cashier: 'caja',
  owner: 'dashboard',
  dishes: 'carta',
  staff: 'personal',
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
  configuracion: 'settings',
  ajustes: 'settings'
};

export default function SistemaPrivadoPage() {
  const { currentUser, isAuthLoaded } = useRestaurant();

  // Pestaña o Vista activa dentro del ERP interno
  const [internalTab, setInternalTab] = useState<InternalTab>('waiter');

  // Estado del Sidebar / Drawer Desplegable
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal de Arqueo Físico de Caja
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

  // 1. Leer ruta inicial desde el path o query
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
  }, []);

  // 2. Función para cambiar pestaña y actualizar limpiamente la URL como /sistema/personal, /sistema/carta, etc.
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

  // 3. Soporte para botones Atrás / Adelante del navegador
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

  // Si la autenticación aún se está verificando desde storage, mostrar splash de carga instantáneo
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

      {/* Modal Global de Identificación de Colaborador (Nivel 2: PIN) */}
      <PinPadModal />

      {/* Contenedor de Toasts Hápticos */}
      <ToastContainer />

    </div>
  );
}
