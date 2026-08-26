'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { DishStation, OrderItemStatus, OrderCourse } from '@/types/restaurant';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  ChefHat, 
  Clock, 
  Check, 
  Flame, 
  Wine, 
  Sparkles, 
  X, 
  Ban, 
  CheckCircle2,
  UserCheck,
  Layers
} from 'lucide-react';

export function KitchenKDS() {
  const { 
    orders, 
    updateOrderItemStatus, 
    menuItems, 
    toggleDishAvailability 
  } = useRestaurant();

  const [activeStation, setActiveStation] = useState<DishStation | 'all'>('all');
  const [activeCourseFilter, setActiveCourseFilter] = useState<OrderCourse | 'all'>('all');
  const [is86ModalOpen, setIs86ModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Actualizar temporizadores cada 10 segundos
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'active' && o.items.length > 0);

  const getStationAndCourseFilteredItems = (items: typeof orders[0]['items']) => {
    return items.filter(i => {
      const matchStation = activeStation === 'all' || i.station === activeStation;
      const matchCourse = activeCourseFilter === 'all' || i.course === activeCourseFilter;
      return matchStation && matchCourse;
    });
  };

  const getElapsedMinutes = (dateStr: string) => {
    try {
      const diffMs = currentTime - new Date(dateStr).getTime();
      return Math.max(0, Math.floor(diffMs / 60000));
    } catch {
      return 0;
    }
  };

  const handleAdvanceStatus = (orderId: string, itemId: string, currentStatus: OrderItemStatus) => {
    sounds.playClick();
    if (currentStatus === 'queued') {
      updateOrderItemStatus(orderId, itemId, 'preparing');
    } else if (currentStatus === 'preparing') {
      updateOrderItemStatus(orderId, itemId, 'ready');
    } else if (currentStatus === 'ready') {
      updateOrderItemStatus(orderId, itemId, 'served');
    }
  };

  const handleMarkAllReady = (orderId: string, items: typeof orders[0]['items']) => {
    sounds.playKitchenBell();
    items.forEach(item => {
      if (item.status !== 'ready' && item.status !== 'served') {
        updateOrderItemStatus(orderId, item.id, 'ready');
      }
    });
  };

  return (
    <div className="py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
      
      {/* Barra de Control KDS Multiestación & Tiempos de Cocina */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Selector de Estación */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
            {[
              { id: 'all', label: 'Todas las Estaciones' },
              { id: 'kitchen_cold', label: '❄️ Cevichería (Fría)' },
              { id: 'kitchen_hot', label: '🔥 Cocina Caliente' },
              { id: 'bar', label: '🍹 Bar & Bebidas' }
            ].map(st => {
              const isSel = activeStation === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    sounds.playClick();
                    setActiveStation(st.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                    isSel
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Selector por Tiempos (1er vs 2do Tiempo) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
              <span className="text-[10px] text-slate-500 font-bold px-1.5 hidden sm:inline">Tiempos:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'starter', label: '1er Tiempo (Entradas)' },
                { id: 'main', label: '2do Tiempo (Fondos)' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    sounds.playClick();
                    setActiveCourseFilter(c.id as any);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    activeCourseFilter === c.id
                      ? 'bg-cyan-700 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Botón de Emergencia 86-List */}
            <button
              onClick={() => {
                sounds.playClick();
                setIs86ModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
            >
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              <span>86-List</span>
            </button>
          </div>

        </div>

      </div>

      {/* Grid de Tickets KDS */}
      {activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <ChefHat className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No hay comandas pendientes en cocina</h3>
          <p className="text-xs text-slate-500">Las nuevas comandas tomadas por los mozos aparecerán aquí en tiempo real.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map(order => {
            const stationItems = getStationAndCourseFilteredItems(order.items);
            if (stationItems.length === 0) return null;

            const elapsed = getElapsedMinutes(order.createdAt);
            const isCritical = elapsed >= 15;
            const isWarning = elapsed >= 8 && elapsed < 15;

            // Franja de estado del ticket
            let topBorder = 'border-t-4 border-slate-300';
            if (isCritical) topBorder = 'border-t-4 border-rose-500';
            else if (isWarning) topBorder = 'border-t-4 border-amber-500';
            else topBorder = 'border-t-4 border-emerald-500';

            return (
              <div
                key={order.id}
                className={`bg-white border border-slate-200 rounded-xl shadow-sm ${topBorder} p-4 flex flex-col justify-between h-full`}
              >
                <div>
                  
                  {/* Cabecera del Ticket */}
                  <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-xs font-mono">
                          {order.tableNumber || 'WEB'}
                        </span>
                        <span className="text-xs font-bold text-slate-900">#{order.code}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-cyan-700" />
                        Mozo: <strong className="text-slate-800">{order.waiterName}</strong>
                      </p>
                    </div>

                    {/* Cronómetro */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                        : isWarning
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m</span>
                    </div>
                  </div>

                  {/* Lista de Platos en Cocina */}
                  <div className="space-y-2 my-2 overflow-y-auto max-h-64 pr-1">
                    {stationItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleAdvanceStatus(order.id, item.id, item.status)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all active:scale-98 ${
                          item.status === 'ready'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : item.status === 'preparing'
                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-black text-cyan-800 mt-0.5 font-mono">{item.quantity}x</span>
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] px-1.5 rounded bg-slate-200 text-slate-700 font-bold uppercase">
                                  {item.course === 'starter' ? '1er T.' : item.course === 'main' ? '2do T.' : 'Bar'}
                                </span>
                                <h5 className="text-xs font-bold leading-tight">{item.name}</h5>
                              </div>
                              
                              {/* Modificadores */}
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedModifiers.map((m: any, idx: number) => (
                                    <span key={idx} className="px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-950 text-[9px] font-semibold border border-amber-300">
                                      {m.optionName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {item.notes && (
                                <p className="text-[10px] text-rose-700 font-semibold mt-0.5 italic">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Estado Actual */}
                          <div className="shrink-0">
                            {item.status === 'ready' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" /> Listo
                              </span>
                            ) : item.status === 'preparing' ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <Flame className="w-3 h-3" /> Cocinando
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[9px] uppercase tracking-wider">
                                En Cola
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Botón Acción Rápida Todo Listo */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400">
                    Toca ítem para avanzar
                  </span>

                  <button
                    onClick={() => handleMarkAllReady(order.id, stationItems)}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Todo Listo</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal 86-List */}
      {is86ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Control de Stock de Platos (86-List)</h3>
                  <p className="text-xs text-slate-500">Desactiva platos agotados en tiempo real para salón y web.</p>
                </div>
              </div>
              <button onClick={() => setIs86ModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {menuItems.map(dish => (
                <div
                  key={dish.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                    dish.isAvailable
                      ? 'bg-white border-slate-200'
                      : 'bg-rose-50 border-rose-300'
                  }`}
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{dish.name}</h5>
                    <span className="text-[10px] text-slate-500 block font-mono">{formatMoney(dish.price)}</span>
                  </div>

                  <button
                    onClick={() => toggleDishAvailability(dish.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                      dish.isAvailable
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {dish.isAvailable ? 'Disponible' : 'Agotado (86)'}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => setIs86ModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cerrar Gestor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
