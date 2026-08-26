'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { InternalTab } from './InternalNavbar';
import { 
  Menu, 
  Settings, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Wifi,
  Coins,
  ChevronRight
} from 'lucide-react';
import { sounds, formatMoney } from '@/lib/utils';

interface InternalHeaderProps {
  activeTab: InternalTab;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenCashAudit: () => void;
}

export function InternalHeader({
  activeTab,
  onOpenSidebar,
  onOpenSettings,
  onOpenCashAudit
}: InternalHeaderProps) {
  const { 
    restaurant, 
    currentUser, 
    logoutStaff, 
    activeShift, 
    soundEnabled, 
    setSoundEnabled 
  } = useRestaurant();

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'waiter': return 'Salón & Comandero de Mesas';
      case 'kitchen': return 'KDS Pantalla de Cocina & Bar';
      case 'cashier': return 'Caja, Facturación & Cobros';
      case 'owner': return 'Dashboard de Administración & KPIs';
      default: return 'Sistema Gastronómico';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-3 shadow-xs">
      
      {/* Botón Menú Hamburguesa + Título de Sección */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenSidebar();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs border border-slate-200"
          title="Abrir Menú de Navegación"
        >
          <Menu className="w-4 h-4 text-cyan-700" />
          <span className="hidden sm:inline">Menú</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-400 hidden md:inline">
            {restaurant.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:inline" />
          <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
            {getTabTitle()}
          </h1>
        </div>
      </div>

      {/* Indicadores en Vivo & Controles Rápidos */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Indicador de Nube Sincronizada */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Supabase Nube OK</span>
        </div>

        {/* Turno de Caja */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenCashAudit();
          }}
          className="hidden sm:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 transition-colors cursor-pointer"
          title="Ver o cerrar arqueo de caja"
        >
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-slate-900">{activeShift.shiftName}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-bold text-emerald-600">{formatMoney(activeShift.systemTotalSales)}</span>
        </button>

        {/* Botón de Ajustes (Solo Owner) */}
        {currentUser?.role === 'owner' && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title="Configuración General"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-700" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        )}

        {/* Toggle de Sonido */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            soundEnabled 
              ? 'bg-slate-100 border-slate-200 text-cyan-700 hover:bg-slate-200' 
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}
          title={soundEnabled ? 'Sonidos Activados' : 'Sonidos Silenciados'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Usuario Activo & Logout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2 text-left">
              <span className="text-base">{currentUser.avatar || '👤'}</span>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-cyan-700 font-bold">
                  {currentUser.role === 'owner' ? 'Owner' : currentUser.role}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                logoutStaff();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </header>
  );
}
