'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { ToastContainer } from '@/components/common/ToastContainer';

// Componentes de la Experiencia Pública de Clientes
import { PublicHero } from '@/components/public/PublicHero';
import { PublicMenu } from '@/components/public/PublicMenu';
import { PublicReservations } from '@/components/public/PublicReservations';
import { PublicPromotions } from '@/components/public/PublicPromotions';
import { PublicCartDrawer } from '@/components/public/PublicCartDrawer';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function PublicRestaurantPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#040d1a] text-white selection:bg-amber-500 selection:text-black">
      
      {/* 1. Barra de Navegación Pública Exclusiva para Comensales */}
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      {/* 2. Hero Culinario de Alta Experiencia */}
      <PublicHero
        onGoToMenu={() => scrollToSection('menu-section')}
        onGoToReservations={() => scrollToSection('reservas-section')}
        onGoToPromos={() => scrollToSection('promociones-section')}
      />

      {/* 3. Carta y Menú en Vivo (Sincronizado con Supabase) */}
      <PublicMenu />

      {/* 4. Motor de Reservas de Mesas */}
      <PublicReservations />

      {/* 5. Festivales Gastronómicos & Promociones */}
      <PublicPromotions onGoToReservations={() => scrollToSection('reservas-section')} />

      {/* 6. Footer Gastronómico */}
      <PublicFooter />

      {/* 7. Drawer Lateral de Pedidos Online / Delivery */}
      <PublicCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* 8. Notificaciones Hápticas */}
      <ToastContainer />

    </main>
  );
}
