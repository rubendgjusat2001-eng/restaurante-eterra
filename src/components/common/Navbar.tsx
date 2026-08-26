'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { 
  Globe, 
  ShieldCheck, 
  Palette, 
  Volume2, 
  VolumeX, 
  ShoppingBag,
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { sounds } from '@/lib/utils';

interface NavbarProps {
  currentView: 'public' | 'internal';
  onViewChange: (view: 'public' | 'internal') => void;
  onOpenCart?: () => void;
}

export function Navbar({ currentView, onViewChange, onOpenCart }: NavbarProps) {
  const { 
    restaurant, 
    currentUser, 
    cart, 
    soundEnabled, 
    setSoundEnabled 
  } = useRestaurant();

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-[#040d1a]/90 border-white/10 text-white backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-black text-xl shadow-lg border border-cyan-400/30">
              É
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider uppercase text-white">
                  {restaurant.name}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-amber-300 border border-amber-500/30">
                  {restaurant.themePreset.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block truncate max-w-[240px]">
                {restaurant.slogan}
              </p>
            </div>
          </div>

          {/* Enlaces de Navegación Pública */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#menu-section" className="hover:text-white transition-colors">Carta & Menú</a>
            <a href="#reservas-section" className="hover:text-white transition-colors">Reservas</a>
            <a href="#promociones-section" className="hover:text-white transition-colors">Festivales & Promos</a>
          </nav>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2.5">
            
            {/* Bolsa de Pedido / Carrito */}
            {onOpenCart && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenCart();
                }}
                className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Bolsa de Pedido"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg animate-bounce">
                    {cart.reduce((acc, it) => acc + it.quantity, 0)}
                  </span>
                )}
              </button>
            )}

            {/* Selector de Estética / Paletas */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsThemeModalOpen(true);
              }}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-amber-300 transition-colors cursor-pointer"
              title="Personalizar Estética & Colores"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Sonidos Hápticos */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
              title={soundEnabled ? 'Sonidos Hápticos Activados' : 'Sonidos Silenciados'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Botón Acceso al Sistema Interno / Login */}
            <button
              onClick={() => {
                sounds.playClick();
                onViewChange('internal');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso Sistema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </header>

      {/* Modal de Paletas */}
      <ThemeSwitcher
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
}
