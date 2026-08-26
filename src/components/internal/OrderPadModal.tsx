'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Table, MenuItem, OrderItem, OrderCourse, OrderItemStatus } from '@/types/restaurant';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Receipt, 
  Check, 
  Search, 
  Clock, 
  Flame, 
  ChefHat, 
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  UserCheck,
  Mic,
  MicOff,
  Volume2,
  Tag,
  Utensils
} from 'lucide-react';

interface OrderPadModalProps {
  table: Table;
  isOpen: boolean;
  onClose: () => void;
  onOpenTransfer: (tableId: string) => void;
}

const QUICK_KITCHEN_NOTES = [
  'Sin Sal',
  'Poco Picante',
  'Bien Picante',
  'Sin Culantro / Cebolla',
  'Bien Caliente',
  'Término Medio',
  'Para Llevar',
  'Urgente',
  'Alérgico a Mariscos',
  'Cortesía'
];

export function OrderPadModal({ table, isOpen, onClose, onOpenTransfer }: OrderPadModalProps) {
  const { 
    categories, 
    menuItems, 
    orders, 
    createOrderForTable, 
    addItemsToTableOrder, 
    requestTableBill, 
    currentUser, 
    cancelOrderItem,
    showToast 
  } = useRestaurant();

  const [selectedCourse, setSelectedCourse] = useState<OrderCourse>('starter');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Borrador de nuevos ítems que aún no han sido enviados a cocina
  const [draftItems, setDraftItems] = useState<OrderItem[]>([]);
  
  // Modificador activo
  const [activeModDish, setActiveModDish] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [selectedMultiModifiers, setSelectedMultiModifiers] = useState<string[]>([]);
  const [modQuantity, setModQuantity] = useState<number>(1);
  const [modNotes, setModNotes] = useState<string>('');

  // Reconocimiento de Voz / Dictado de Comanda
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');

  // Modal de anulación de plato
  const [cancelModalItem, setCancelModalItem] = useState<{ orderId: string; item: OrderItem } | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Error de pedido del cliente');

  if (!isOpen) return null;

  const existingOrder = orders.find(o => o.id === table.currentOrderId);
  const allCurrentItems = existingOrder ? existingOrder.items : [];

  // Filtrado de menú para el mozo
  const filteredDishes = menuItems.filter(dish => {
    const matchesCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
    const matchesSearch = searchQuery === '' || dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenModifier = (dish: MenuItem) => {
    if (!dish.isAvailable) return;
    sounds.playClick();
    setActiveModDish(dish);
    setModQuantity(1);
    setModNotes('');

    const initialMods: Record<string, string> = {};
    if (dish.modifierGroups) {
      dish.modifierGroups.forEach(group => {
        if (group.required && group.options.length > 0) {
          initialMods[group.id] = group.options[0].id;
        }
      });
    }
    setSelectedModifiers(initialMods);
    setSelectedMultiModifiers([]);
  };

  const handleAddDishToDraft = (dish: MenuItem, useDefaults: boolean = false) => {
    if (!dish.isAvailable) return;

    if (!useDefaults && dish.modifierGroups && dish.modifierGroups.length > 0) {
      handleOpenModifier(dish);
      return;
    }

    sounds.playClick();

    const compiledModifiers: any[] = [];
    if (activeModDish && activeModDish.id === dish.id) {
      if (dish.modifierGroups) {
        dish.modifierGroups.forEach(group => {
          if (group.required && selectedModifiers[group.id]) {
            const opt = group.options.find(o => o.id === selectedModifiers[group.id]);
            if (opt) {
              compiledModifiers.push({
                groupId: group.id,
                groupName: group.name,
                optionId: opt.id,
                optionName: opt.name,
                extraPrice: opt.extraPrice
              });
            }
          }
        });

        selectedMultiModifiers.forEach(optId => {
          for (const group of dish.modifierGroups || []) {
            const opt = group.options.find(o => o.id === optId);
            if (opt) {
              compiledModifiers.push({
                groupId: group.id,
                groupName: group.name,
                optionId: opt.id,
                optionName: opt.name,
                extraPrice: opt.extraPrice
              });
              break;
            }
          }
        });
      }
    }

    const extraPrice = compiledModifiers.reduce((acc, mod) => acc + mod.extraPrice, 0);
    const unitPrice = dish.price + extraPrice;
    const qty = activeModDish?.id === dish.id ? modQuantity : 1;
    const totalPrice = unitPrice * qty;

    const newItem: OrderItem = {
      id: `draft-${Date.now()}-${Math.random()}`,
      menuItemId: dish.id,
      name: dish.name,
      quantity: qty,
      unitPrice,
      totalPrice,
      station: dish.station,
      course: selectedCourse,
      status: 'queued',
      selectedModifiers: compiledModifiers,
      notes: activeModDish?.id === dish.id ? modNotes : undefined,
      orderedAt: new Date().toISOString()
    };

    setDraftItems(prev => [...prev, newItem]);
    setActiveModDish(null);
  };

  const handleRemoveDraftItem = (draftId: string) => {
    sounds.playClick();
    setDraftItems(prev => prev.filter(i => i.id !== draftId));
  };

  const handleSendDraftToKitchen = () => {
    if (draftItems.length === 0) return;
    addItemsToTableOrder(table.id, draftItems);
    setDraftItems([]);
  };

  const handleRequestBill = () => {
    requestTableBill(table.id);
    onClose();
  };

  const handleExecuteCancelItem = () => {
    if (!cancelModalItem || !existingOrder) return;
    cancelOrderItem(
      existingOrder.id,
      cancelModalItem.item.id,
      cancelReason,
      currentUser?.name || 'Supervisor'
    );
    setCancelModalItem(null);
  };

  // Simulación de Dictado de Comanda por Voz
  const handleToggleVoiceDictation = () => {
    if (!isListening) {
      sounds.playClick();
      setIsListening(true);
      setSpeechTranscript('Escuchando al mozo...');

      // Parser inteligente simulado de voz a comanda
      setTimeout(() => {
        setSpeechTranscript('"2 Ceviches ÉTERRA Clásicos poco picante y 1 Arroz con Mariscos"');
        sounds.playKitchenBell();
        
        // Agregar platos automáticamente al borrador
        const ceviche = menuItems.find(m => m.name.toLowerCase().includes('ceviche'));
        const arroz = menuItems.find(m => m.name.toLowerCase().includes('arroz'));
        
        const addedItems: OrderItem[] = [];
        if (ceviche) {
          addedItems.push({
            id: `draft-v1-${Date.now()}`,
            menuItemId: ceviche.id,
            name: ceviche.name,
            quantity: 2,
            unitPrice: ceviche.price,
            totalPrice: ceviche.price * 2,
            station: ceviche.station,
            course: 'starter',
            status: 'queued',
            selectedModifiers: [{ groupId: 'mod-picante', groupName: 'Picante', optionId: 'p2', optionName: 'Poco Picante', extraPrice: 0 }],
            notes: 'Dictado por voz IA',
            orderedAt: new Date().toISOString()
          });
        }
        if (arroz) {
          addedItems.push({
            id: `draft-v2-${Date.now()}`,
            menuItemId: arroz.id,
            name: arroz.name,
            quantity: 1,
            unitPrice: arroz.price,
            totalPrice: arroz.price,
            station: arroz.station,
            course: 'main',
            status: 'queued',
            selectedModifiers: [],
            notes: 'Dictado por voz IA',
            orderedAt: new Date().toISOString()
          });
        }

        setDraftItems(prev => [...prev, ...addedItems]);
        showToast('success', '¡Comanda dictada por voz agregada con éxito!', 'IA Voice-to-Order');
        setIsListening(false);
      }, 2200);
    } else {
      setIsListening(false);
      setSpeechTranscript('');
    }
  };

  const draftSubtotal = draftItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const currentSubtotal = existingOrder ? existingOrder.subtotal : 0;
  const grandTotal = currentSubtotal + draftSubtotal;
  const waiterName = table.openedByUserName || table.assignedWaiterName || existingOrder?.waiterName || currentUser?.name || 'Mateo Morales';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-900 flex flex-col overflow-hidden">
        
        {/* Cabecera del Comandero */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-sm font-mono">
              {table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{table.zone}</h3>
                <span className="text-xs text-slate-500 font-medium">({table.customerCount || table.capacity} Comensales)</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-700" />
                  Atendido por: <strong className="text-slate-900">{waiterName}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span>Ingreso: <strong className="text-slate-700 font-mono">{table.seatedAt || '13:00'}</strong></span>
                <span>•</span>
                <span>Comanda: <strong className="text-cyan-800 font-mono">{existingOrder?.code || 'NUEVA'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de Dictado de Comanda por Voz */}
            <button
              onClick={handleToggleVoiceDictation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-900'
              }`}
              title="Dictar comanda por voz"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-700" />}
              <span>{isListening ? 'Escuchando...' : 'Dictar por Voz (IA)'}</span>
            </button>

            {existingOrder && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenTransfer(table.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-700" />
                <span className="hidden sm:inline">Mudar Mesa</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Dictado por Voz Activo */}
        {speechTranscript && (
          <div className="bg-cyan-900 text-white px-5 py-2 text-xs flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-300 animate-bounce" />
              <span>{speechTranscript}</span>
            </div>
            {isListening && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">Procesando audio...</span>}
          </div>
        )}

        {/* Cuerpo Dividido */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LADO IZQUIERDO: Carta & Selección Táctil */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden p-4 bg-white">
            
            {/* Selector de Tiempos de Comanda */}
            <div className="flex items-center gap-1.5 mb-3 bg-slate-100 border border-slate-200 p-1 rounded-xl">
              {[
                { id: 'starter', label: '1er Tiempo (Entradas)', icon: '❄️' },
                { id: 'main', label: '2do Tiempo (Fondos)', icon: '🔥' },
                { id: 'drink', label: 'Bebidas & Bar', icon: '🍹' },
                { id: 'dessert', label: 'Postres', icon: '🍰' }
              ].map(course => (
                <button
                  key={course.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCourse(course.id as OrderCourse);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center truncate ${
                    selectedCourse === course.id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="mr-1">{course.icon}</span>
                  <span>{course.label}</span>
                </button>
              ))}
            </div>

            {/* Buscador & Categorías Rápidas */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar plato rápido..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto max-w-[50%]">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                    selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                      selectedCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Platos para Toma Rápida */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
              {filteredDishes.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center">
                  <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">Aún no hay platos registrados en esta categoría</p>
                  <p className="text-[11px] text-slate-500 mt-1">El administrador puede agregar platos y precios desde la sección de Menú.</p>
                </div>
              ) : (
                filteredDishes.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => handleAddDishToDraft(dish)}
                    disabled={!dish.isAvailable}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-32 relative overflow-hidden group ${
                      dish.isAvailable
                        ? 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-sm active:scale-98'
                        : 'bg-slate-100 border-slate-200 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-800">
                          {dish.station === 'kitchen_cold' ? '❄️ Fría' : dish.station === 'kitchen_hot' ? '🔥 Caliente' : '🍹 Bar'}
                        </span>
                        {dish.modifierGroups && dish.modifierGroups.length > 0 && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                            Opciones
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {dish.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-auto">
                      <span className="text-xs font-black text-slate-900 font-mono">{formatMoney(dish.price)}</span>
                      <div className="w-5 h-5 rounded bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xs group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                        +
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>

          {/* LADO DERECHO: Resumen de la Comanda Activa & Borrador */}
          <div className="w-full lg:w-96 bg-slate-50 flex flex-col justify-between p-4 overflow-hidden">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-cyan-700" />
                Resumen de Comanda
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                {allCurrentItems.length} En Cocina • {draftItems.length} Nuevos
              </span>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              
              {/* Platos Ya Enviados a Cocina */}
              {allCurrentItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Enviados a Cocina:
                  </span>
                  {allCurrentItems.map(item => (
                    <div key={item.id} className="p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">{item.quantity}x {item.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              item.status === 'ready' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : item.status === 'preparing' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.status === 'ready' ? 'Listo' : item.status === 'preparing' ? 'Preparando' : 'En cola'}
                            </span>
                            <span className="text-[10px] text-slate-900 font-mono font-bold">{formatMoney(item.totalPrice)}</span>
                          </div>
                        </div>

                        {/* Botón de Anulación */}
                        <button
                          onClick={() => {
                            if (existingOrder) {
                              setCancelModalItem({ orderId: existingOrder.id, item });
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 text-[10px]"
                          title="Anular plato con motivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Modificadores */}
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="text-[10px] text-amber-900 mt-1 pl-2 border-l border-amber-300">
                          {item.selectedModifiers.map((mod: any, i: number) => (
                            <span key={i} className="block">• {mod.optionName}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Platos Nuevos en Borrador */}
              {draftItems.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Nuevos por Enviar ({draftItems.length}):
                  </span>
                  {draftItems.map(item => (
                    <div key={item.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">{item.quantity}x {item.name}</span>
                          <span className="text-[10px] text-amber-900 font-mono font-bold block">{formatMoney(item.totalPrice)}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveDraftItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {allCurrentItems.length === 0 && draftItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Selecciona los platos a la izquierda para añadir a la comanda
                </div>
              )}

            </div>

            {/* Totales & Botones de Acción */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 text-xs uppercase">Total Consumo:</span>
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{formatMoney(grandTotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendDraftToKitchen}
                  disabled={draftItems.length === 0}
                  className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    draftItems.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Cocina ({draftItems.length})</span>
                </button>

                <button
                  onClick={handleRequestBill}
                  className="py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Pedir Pre-Cuenta</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modal de Modificadores del Plato con Chips Rápidos */}
      {activeModDish && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl text-slate-900 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">{activeModDish.name}</h3>
              <button onClick={() => setActiveModDish(null)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modificadores */}
            {activeModDish.modifierGroups?.map(group => (
              <div key={group.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <h4 className="text-xs font-bold text-slate-900 mb-2">{group.name}</h4>
                <div className="space-y-1">
                  {group.options.map(opt => {
                    const isSel = selectedModifiers[group.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedModifiers(prev => ({ ...prev, [group.id]: opt.id }));
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-medium ${
                          isSel ? 'bg-cyan-50 border-cyan-600 text-cyan-950 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{opt.name}</span>
                        {opt.extraPrice > 0 && <span className="text-cyan-800 font-bold font-mono">+{formatMoney(opt.extraPrice)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Chips de Notas Rápidas para Cocina */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-cyan-700" />
                <span>Notas Rápidas para Cocina</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_KITCHEN_NOTES.map(note => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setModNotes(prev => prev ? `${prev}, ${note}` : note);
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200"
                  >
                    +{note}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Escribe otra nota específica..."
                value={modNotes}
                onChange={e => setModNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>

            <button
              onClick={() => handleAddDishToDraft(activeModDish, true)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md"
            >
              Agregar a la Comanda ({formatMoney(activeModDish.price)})
            </button>
          </div>
        </div>
      )}

      {/* Modal de Anulación de Plato */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-rose-200 rounded-2xl p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Anulación de Plato</h3>
            </div>
            <p className="text-xs text-slate-600">
              ¿Deseas anular <strong className="text-rose-700">{cancelModalItem.item.name}</strong>? Se registrará en la auditoría.
            </p>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Motivo de Anulación</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-slate-900 focus:outline-none"
              >
                <option value="Error de pedido del cliente">Error de comanda del cliente</option>
                <option value="Demora excesiva en cocina">Demora excesiva en cocina</option>
                <option value="Plato no deseado / cambio">Cambio por otro plato</option>
                <option value="Problema de calidad / temperatura">Problema de calidad o sabor</option>
                <option value="Cortesía autorizada por gerencia">Cortesía de gerencia</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setCancelModalItem(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Volver
              </button>
              <button
                onClick={handleExecuteCancelItem}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
