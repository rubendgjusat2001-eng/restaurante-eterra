'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ToastContainer } from '@/components/common/ToastContainer';

// Componentes Internos del Sistema
import { SidebarDrawer } from '@/components/internal/SidebarDrawer';
import { InternalHeader } from '@/components/internal/InternalHeader';
import { InternalTab } from '@/components/internal/InternalNavbar';
import { WaiterFloorMap } from '@/components/internal/WaiterFloorMap';
import { KitchenKDS } from '@/components/internal/KitchenKDS';
import { CashierDesk } from '@/components/internal/CashierDesk';
import { CashDrawerModal } from '@/components/internal/CashDrawerModal';
import { OwnerDashboard } from '@/components/internal/OwnerDashboard';
import { SystemSettingsModal } from '@/components/internal/SystemSettingsModal';
import { SystemLoginScreen } from '@/components/common/SystemLoginScreen';

export default function SistemaPrivadoPage() {
  const { currentUser } = useRestaurant();

  // Pestaña activa dentro del ERP interno
  const [internalTab, setInternalTab] = useState<InternalTab>('waiter');

  // Estado del Sidebar / Drawer Desplegable
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modales de Gestión
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

  // Sincronizar automáticamente la pestaña según el rol del usuario autenticado
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'kitchen' || currentUser.role === 'bar') {
      setInternalTab('kitchen');
    } else if (currentUser.role === 'cashier') {
      setInternalTab('cashier');
    } else if (currentUser.role === 'waiter' && internalTab === 'owner') {
      setInternalTab('waiter');
    }
  }, [currentUser]);

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
          
          {/* Cabecera Superior con Botón de Menú Hamburguesa y Estado */}
          <InternalHeader
            activeTab={internalTab}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenCashAudit={() => setIsCashDrawerOpen(true)}
          />

          {/* Menú Lateral Desplegable (Sidebar Drawer) */}
          <SidebarDrawer
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeTab={internalTab}
            onTabChange={tab => setInternalTab(tab)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
            onGoToPublic={() => {
              if (typeof window !== 'undefined') {
                window.open('/', '_blank');
              }
            }}
          />

          {/* Área de Trabajo Operativa */}
          <main className="flex-1 overflow-x-hidden">
            {internalTab === 'waiter' && <WaiterFloorMap />}
            {internalTab === 'kitchen' && <KitchenKDS />}
            {internalTab === 'cashier' && <CashierDesk />}
            {internalTab === 'owner' && <OwnerDashboard />}
          </main>

          {/* Modal de Configuración General (⚙️) */}
          <SystemSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />

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
