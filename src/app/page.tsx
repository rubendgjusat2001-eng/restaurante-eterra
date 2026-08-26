'use client';

import React, { useState } from 'react';
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
import { InternalNavbar, InternalTab } from '@/components/internal/InternalNavbar';
import { WaiterFloorMap } from '@/components/internal/WaiterFloorMap';
import { KitchenKDS } from '@/components/internal/KitchenKDS';
import { CashierDesk } from '@/components/internal/CashierDesk';
import { CashDrawerModal } from '@/components/internal/CashDrawerModal';
import { OwnerDashboard } from '@/components/internal/OwnerDashboard';

export default function HomePage() {
  const { currentUser } = useRestaurant();

  // Vista activa: 'public' (Clientes) vs 'internal' (POS / KDS / Caja / Owner)
  const [viewMode, setViewMode] = useState<'public' | 'internal'>('internal');
  
  // Pestaña activa dentro del ERP interno
  const [internalTab, setInternalTab] = useState<InternalTab>('waiter');

  // Ajuste automático de pestaña según el rol del usuario autenticado
  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'kitchen' || currentUser.role === 'bar') {
      setInternalTab('kitchen');
    } else if (currentUser.role === 'cashier') {
      setInternalTab('cashier');
    } else if (currentUser.role === 'waiter' && internalTab === 'owner') {
      setInternalTab('waiter');
    }
  }, [currentUser]);

  // Estado del Carrito Público
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estado del Modal de Arqueo de Caja
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

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
      
      {/* Barra de Navegación Principal Universal */}
      <Navbar
        currentView={viewMode}
        onViewChange={mode => setViewMode(mode)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* VISTA 1: PORTAL PÚBLICO (EXPERIENCIA DE CLIENTE DE ALTO IMPACTO) */}
      {viewMode === 'public' && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-300">
          
          {/* Hero Gastronómico */}
          <PublicHero
            onGoToMenu={() => scrollToSection('menu-section')}
            onGoToReservations={() => scrollToSection('reservas-section')}
            onGoToPromos={() => scrollToSection('promociones-section')}
          />

          {/* Menú Sincronizado en Tiempo Real */}
          <PublicMenu />

          {/* Motor de Reservas con Fecha y Hora */}
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

      {/* VISTA 2: SISTEMA OPERATIVO INTERNO (POS / KDS / CAJA / OWNER ERP CON FONDO BLANCO PULCRO) */}
      {viewMode === 'internal' && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-300 bg-slate-50 min-h-[calc(100vh-4rem)]">
          
          {/* Sub-barra de Módulos Operativos */}
          <InternalNavbar
            activeTab={internalTab}
            onTabChange={tab => setInternalTab(tab)}
            onOpenCashAudit={() => setIsCashDrawerOpen(true)}
          />

          {/* Renderizado de Módulo Activo */}
          <div className="flex-1">
            {internalTab === 'waiter' && <WaiterFloorMap />}
            {internalTab === 'kitchen' && <KitchenKDS />}
            {internalTab === 'cashier' && <CashierDesk />}
            {internalTab === 'owner' && <OwnerDashboard />}
          </div>

          {/* Modal de Control y Arqueo Físico de Caja (Corte X y Z) */}
          <CashDrawerModal
            isOpen={isCashDrawerOpen}
            onClose={() => setIsCashDrawerOpen(false)}
          />

        </div>
      )}

      {/* Contenedor de Notificaciones Toast Hápticas */}
      <ToastContainer />

    </main>
  );
}
