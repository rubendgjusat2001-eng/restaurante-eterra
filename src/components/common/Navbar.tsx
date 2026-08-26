'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { PinPadModal } from './PinPadModal';
import { 
  UtensilsCrossed, 
  Globe, 
  ShieldCheck, 
  Palette, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  Sparkles, 
  LogOut,
  ShoppingBag
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
    setIsPinModalOpen, 
    logoutStaff, 
    cart, 
    soundEnabled, 
    setSoundEnabled,
    activeShift
  } = useRestaurant();

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  };

  const isInternal = currentView === 'internal';

  return (
    <>
      <header className={`sticky top-0 z-40 w-full border-b transition-all ${
        isInternal 
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md' 
          : 'bg-[#040d1a]/85 border-white/10 text-white backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Slogan de Marca */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-black text-xl shadow-md border border-cyan-500/30">
              É
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black tracking-wider uppercase ${isInternal ? 'text-slate-900' : 'text-white'}`}>
                  {restaurant.name}
                </span>
                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  isInternal
                    ? 'bg-slate-100 text-cyan-800 border-slate-200'
                    : 'bg-white/10 text-amber-300 border-amber-500/30'
                }`}>
                  {restaurant.themePreset.toUpperCase()}
                </span>
              </div>
              <p className={`text-[10px] font-medium hidden md:block truncate max-w-[240px] ${
                isInternal ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {restaurant.slogan}
              </p>
            </div>
          </div>

          {/* Selector de Modo: Web Pública vs. ERP Interno */}
          <div className={`flex items-center p-1 rounded-2xl border shadow-inner ${
            isInternal ? 'bg-slate-100 border-slate-200' : 'bg-black/50 border-white/10'
          }`}>
            <button
              onClick={() => {
                sounds.playClick();
                onViewChange('public');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'public'
                  ? 'bg-cyan-700 text-white shadow-md scale-105'
                  : isInternal
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Clientes</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onViewChange('internal');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'internal'
                  ? 'bg-cyan-600 text-white shadow-md scale-105'
                  : isInternal
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sistema Interno</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          {/* Herramientas Rápidas & Perfil */}
          <div className="flex items-center gap-2.5">
            {/* Botón Carrito Público (solo visible en modo público si hay items) */}
            {currentView === 'public' && onOpenCart && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenCart();
                }}
                className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
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

            {/* Selector de Tema Gastronómico */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsThemeModalOpen(true);
              }}
              className={`p-2 rounded-xl border transition-colors ${
                isInternal 
                  ? 'bg-slate-100 border-slate-200 text-amber-600 hover:bg-slate-200' 
                  : 'bg-white/5 border-white/10 text-amber-300 hover:bg-white/10'
              }`}
              title="Personalizar Estética & Colores"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Switch de Sonidos Hápticos */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled 
                  ? (isInternal ? 'bg-slate-100 border-slate-200 text-cyan-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10') 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
              title={soundEnabled ? 'Sonidos Hápticos Activados' : 'Sonidos Silenciados'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Usuario Activo / Selector de PIN */}
            {currentUser ? (
              <div className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-2xl border transition-colors ${
                isInternal
                  ? 'bg-slate-100 border-slate-200 hover:border-cyan-400'
                  : 'bg-white/5 border-white/10 hover:border-cyan-500/40'
              }`}>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsPinModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-left"
                  title="Cambiar de usuario con PIN"
                >
                  <span className="text-base">{currentUser.avatar}</span>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-bold leading-tight truncate max-w-[90px] ${
                      isInternal ? 'text-slate-900' : 'text-white'
                    }`}>{currentUser.name.split(' ')[0]}</p>
                    <p className="text-[9px] uppercase tracking-wider text-cyan-600 font-semibold">{currentUser.role === 'owner' ? 'Owner' : currentUser.role}</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    logoutStaff();
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors ml-1"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsPinModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Acceder (PIN)</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Modal Selector de Temas */}
      <ThemeSwitcher
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Modal de PIN Pad */}
      <PinPadModal />
    </>
  );
}
