'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { 
  LayoutGrid, 
  ChefHat, 
  Receipt, 
  BarChart3, 
  Coins
} from 'lucide-react';
import { sounds, formatMoney } from '@/lib/utils';

export type InternalTab = 'waiter' | 'kitchen' | 'cashier' | 'owner' | 'dishes' | 'staff' | 'warehouse' | 'settings' | 'shift';

interface InternalNavbarProps {
  activeTab: InternalTab;
  onTabChange: (tab: InternalTab) => void;
  onOpenCashAudit: () => void;
}

export function InternalNavbar({ activeTab, onTabChange, onOpenCashAudit }: InternalNavbarProps) {
  const { currentUser, activeShift, orders, tables } = useRestaurant();

  // Contadores en vivo
  const tablesOccupied = tables.filter(t => t.status !== 'available').length;
  const pendingKitchenItems = orders
    .filter(o => o.status === 'active')
    .flatMap(o => o.items)
    .filter(i => i.status === 'queued' || i.status === 'preparing').length;
  const billsRequested = tables.filter(t => t.status === 'bill_requested').length;

  const tabs: { id: InternalTab; label: string; icon: any; badge?: number; badgeColor?: string; roleAllowed?: string[] }[] = [
    {
      id: 'waiter',
      label: 'Comandero & Mesas',
      icon: LayoutGrid,
      badge: tablesOccupied > 0 ? tablesOccupied : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
      roleAllowed: ['owner', 'manager', 'waiter', 'waiter_cashier', 'cashier']
    },
    {
      id: 'kitchen',
      label: 'KDS Cocina & Bar',
      icon: ChefHat,
      badge: pendingKitchenItems > 0 ? pendingKitchenItems : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      roleAllowed: ['owner', 'manager', 'kitchen', 'bar', 'waiter', 'waiter_cashier']
    },
    {
      id: 'cashier',
      label: 'Caja & Facturación',
      icon: Receipt,
      badge: billsRequested > 0 ? billsRequested : undefined,
      badgeColor: 'bg-cyan-600 text-white animate-bounce',
      roleAllowed: ['owner', 'manager', 'cashier', 'waiter_cashier']
    },
    {
      id: 'owner',
      label: 'Dashboard & CMS Web',
      icon: BarChart3,
      roleAllowed: ['owner', 'manager']
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Pestañas de Módulos Operativos (Filtradas por Rol de Seguridad) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {tabs
            .filter(tab => !currentUser || !tab.roleAllowed || tab.roleAllowed.includes(currentUser.role))
            .map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    onTabChange(tab.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20 scale-105'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Resumen del Turno & Acceso a Arqueo de Caja */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          
          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-700">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Turno:</span>
            <span className="font-bold text-cyan-800 truncate max-w-[130px]">{activeShift.shiftName}</span>
            <span className="text-slate-300">|</span>
            <span className="text-[10px] text-slate-500">Ventas:</span>
            <span className="font-mono font-bold text-emerald-600">{formatMoney(activeShift.systemTotalSales)}</span>
          </div>

          {/* Arqueo de Caja (Solo visible para Cajeros, Administradores y Dueño) */}
          {(!currentUser || currentUser.role === 'owner' || currentUser.role === 'manager' || currentUser.role === 'cashier' || currentUser.role === 'waiter_cashier') && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenCashAudit();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>Arqueo (X/Z)</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
