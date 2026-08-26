'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { InternalTab } from './InternalNavbar';
import { 
  LayoutGrid, 
  ChefHat, 
  Receipt, 
  BarChart3, 
  Utensils, 
  Users, 
  Settings, 
  Globe, 
  LogOut, 
  X, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { sounds } from '@/lib/utils';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: InternalTab;
  onTabChange: (tab: InternalTab) => void;
  onOpenSettings: () => void;
  onOpenCashDrawer: () => void;
  onGoToPublic: () => void;
}

export function SidebarDrawer({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenCashDrawer,
  onGoToPublic
}: SidebarDrawerProps) {
  const { 
    restaurant, 
    currentUser, 
    logoutStaff, 
    tables, 
    orders, 
    staff 
  } = useRestaurant();

  // Contadores en vivo para badges
  const tablesOccupied = tables.filter(t => t.status !== 'available').length;
  const pendingKitchenItems = orders
    .filter(o => o.status === 'active')
    .flatMap(o => o.items)
    .filter(i => i.status === 'queued' || i.status === 'preparing').length;
  const billsRequested = tables.filter(t => t.status === 'bill_requested').length;

  const isOwnerOrManager = currentUser?.role === 'owner' || currentUser?.role === 'manager';

  const handleSelectTab = (tab: InternalTab) => {
    sounds.playClick();
    onTabChange(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    sounds.playClick();
    logoutStaff();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop oscuro para móviles y tablets */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Drawer Lateral Desplegable (Inspirado 1:1 en referencia de sistema empresarial) */}
      <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-white border-r border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 text-slate-900 font-sans select-none">
        
        {/* 1. Header de Marca */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white font-black text-xl flex items-center justify-center shadow-md shadow-cyan-600/20">
              É
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wider uppercase text-slate-900">
                  {restaurant.name}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 uppercase">
                  OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px]">
                Sistema Operativo Gastronómico
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Cuerpo de Navegación con Secciones */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          
          {/* SECCIÓN A: OPERACIONES */}
          <div>
            <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Operaciones
            </h4>
            <nav className="space-y-1">
              <button
                onClick={() => handleSelectTab('waiter')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'waiter'
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4" />
                  <span>Salón & Mesas</span>
                </div>
                {tablesOccupied > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'waiter' ? 'bg-white text-cyan-900' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {tablesOccupied} ocupadas
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('kitchen')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'kitchen'
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ChefHat className="w-4 h-4" />
                  <span>KDS Cocina & Bar</span>
                </div>
                {pendingKitchenItems > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingKitchenItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('cashier')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'cashier'
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4" />
                  <span>Caja & Facturación</span>
                </div>
                {billsRequested > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-600 text-white animate-bounce">
                    {billsRequested} cuentas
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* SECCIÓN B: GESTIÓN & ADMINISTRACIÓN (Solo Owner / Gerente) */}
          {isOwnerOrManager && (
            <div>
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Gestión
              </h4>
              <nav className="space-y-1">
                <button
                  onClick={() => handleSelectTab('owner')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'owner'
                      ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard & KPIs</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleSelectTab('owner');
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Carta & Platos</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleSelectTab('owner');
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-cyan-700" />
                    <span>Personal & Roles</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                    {staff.length}
                  </span>
                </button>
              </nav>
            </div>
          )}

          {/* SECCIÓN C: SISTEMA */}
          <div>
            <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Sistema
            </h4>
            <nav className="space-y-1">
              {currentUser?.role === 'owner' && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenSettings();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-cyan-700" />
                    <span>Configuración General</span>
                  </div>
                  <span className="text-[10px] text-cyan-700 font-black">⚙️</span>
                </button>
              )}

              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenCashDrawer();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Arqueo de Turno (X/Z)</span>
                </div>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onGoToPublic();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Ver Portal Clientes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </nav>
          </div>

        </div>

        {/* 3. Tarjeta de Usuario & Cerrar Sesión (Pie de Página estilo Imagen 3) */}
        {currentUser && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/80">
            <div className="flex items-center justify-between gap-3">
              
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white text-sm font-black flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </h5>
                  <p className="text-[10px] font-semibold text-cyan-800 uppercase tracking-wider truncate">
                    {currentUser.role === 'owner' ? '👑 Dueño / Owner' : currentUser.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Cerrar Sesión Completa"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>
          </div>
        )}

      </aside>
    </>
  );
}
