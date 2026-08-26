'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Navbar } from '@/components/common/Navbar';
import { ToastContainer } from '@/components/common/ToastContainer';

// Componentes Públicos
import { PublicHero } from '@/components/public/PublicHero';
import { PublicMenu } from '@/components/public/PublicMenu';
import { PublicReservations } from '@/components/public/PublicReservations';
import { PublicPromotions } from '@/components/public/PublicPromotions';
import { PublicCartDrawer } from '@/components/public/PublicCartDrawer';
import { PublicFooter } from '@/components/public/PublicFooter';

// Componentes Internos
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

export default function HomePage() {
  const { currentUser } = useRestaurant();

  // Modo de vista: 'public' (Clientes) vs 'internal' (Restaurant OS)
  const [viewMode, setViewMode] = useState<'public' | 'internal'>('internal');
  
  // Pestaña activa dentro del ERP interno
  const [internalTab, setInternalTab] = useState<InternalTab>('waiter');

  // Estado del Sidebar / Drawer Desplegable
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estado de los Modales
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  // Scroll helpers para la web pública
  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isInternal = viewMode === 'internal';

  return (
    <main className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isInternal ? 'bg-slate-50 text-slate-900' : 'bg-[#040d1a] text-white'
    }`}>
      
      {/* ========================================================================= */}
      {/* VISTA 1: PORTAL PÚBLICO (EXPERIENCIA DE CLIENTE DE ALTA GASTRONOMÍA)     */}
      {/* ========================================================================= */}
      {viewMode === 'public' && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-300">
          
          {/* Barra de Navegación Pública */}
          <Navbar
            currentView="public"
            onViewChange={mode => setViewMode(mode)}
            onOpenCart={() => setIsCartOpen(true)}
          />

          {/* Hero Gastronómico */}
          <PublicHero
            onGoToMenu={() => scrollToSection('menu-section')}
            onGoToReservations={() => scrollToSection('reservas-section')}
            onGoToPromos={() => scrollToSection('promociones-section')}
          />

          {/* Menú Sincronizado en Tiempo Real */}
          <PublicMenu />

          {/* Motor de Reservas */}
          <PublicReservations />

          {/* Promociones y Festivales */}
          <PublicPromotions onGoToReservations={() => scrollToSection('reservas-section')} />

          {/* Footer Gastronómico */}
          <PublicFooter onGoToInternal={() => setViewMode('internal')} />

          {/* Drawer Lateral de Pedidos Online / Delivery */}
          <PublicCartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: SISTEMA OPERATIVO INTERNO (RESTAURANT OS)                       */}
      {/* ========================================================================= */}
      {viewMode === 'internal' && (
        <>
          {/* Si NO hay usuario autenticado: Pantalla de Login 100% Aislada */}
          {!currentUser ? (
            <SystemLoginScreen onGoToPublic={() => setViewMode('public')} />
          ) : (
            <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900 animate-in fade-in duration-200">
              
              {/* Cabecera Interna Superior con Botón de Menú y Estado */}
              <InternalHeader
                activeTab={internalTab}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenCashAudit={() => setIsCashDrawerOpen(true)}
              />

              {/* Menú Lateral Desplegable (Sidebar Drawer inspirado en Imagen 3) */}
              <SidebarDrawer
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeTab={internalTab}
                onTabChange={tab => setInternalTab(tab)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
                onGoToPublic={() => setViewMode('public')}
              />

              {/* Área de Trabajo del Módulo Activo */}
              <div className="flex-1 overflow-x-hidden">
                {internalTab === 'waiter' && <WaiterFloorMap />}
                {internalTab === 'kitchen' && <KitchenKDS />}
                {internalTab === 'cashier' && <CashierDesk />}
                {internalTab === 'owner' && <OwnerDashboard />}
              </div>

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
        </>
      )}

      {/* Contenedor de Notificaciones Toast Hápticas */}
      <ToastContainer />

    </main>
  );
}
