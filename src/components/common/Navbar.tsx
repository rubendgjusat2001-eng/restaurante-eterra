'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { 
  Volume2, 
  VolumeX, 
  ShoppingBag,
  PhoneCall,
  CalendarDays
} from 'lucide-react';
import { sounds } from '@/lib/utils';

interface NavbarProps {
  onOpenCart?: () => void;
}

export function Navbar({ onOpenCart }: NavbarProps) {
  const { 
    restaurant, 
    cart, 
    soundEnabled, 
    setSoundEnabled 
  } = useRestaurant();

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#040d1a]/95 border-white/10 text-white backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Slogan de Marca */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg border border-amber-400/30">
            É
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider uppercase text-white">
                {restaurant.name}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block truncate max-w-[240px]">
              {restaurant.slogan}
            </p>
          </div>
        </div>

        {/* Enlaces de Navegación Pública para Comensales */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
          <a href="#menu-section" className="hover:text-amber-400 transition-colors">
            Carta & Menú
          </a>
          <a href="#reservas-section" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            <span>Reservar Mesa</span>
          </a>
          <a href="#promociones-section" className="hover:text-amber-400 transition-colors">
            Festivales & Promos
          </a>
        </nav>

        {/* Acciones de la Web Pública */}
        <div className="flex items-center gap-3">
          
          {/* Teléfono Rápido */}
          <a 
            href={`tel:${restaurant.phone}`}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>{restaurant.phone}</span>
          </a>

          {/* Switch de Sonidos Hápticos */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled 
                ? 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
            title={soundEnabled ? 'Sonidos Activados' : 'Sonidos Silenciados'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Carrito de Pedidos Online */}
          {onOpenCart && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenCart();
              }}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              title="Bolsa de Pedidos"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pedido Online</span>
              {cart.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-white text-[10px] font-black flex items-center justify-center">
                  {cart.reduce((acc, it) => acc + it.quantity, 0)}
                </span>
              )}
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
