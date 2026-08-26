'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { MenuItem, ModifierGroup } from '@/types/restaurant';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Clock, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  ShoppingBag,
  SlidersHorizontal
} from 'lucide-react';

export function PublicMenu() {
  const { categories, menuItems, addToCart } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('all');

  // Modal de Personalización de Plato para el Cliente
  const [modalDish, setModalDish] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [selectedMultiModifiers, setSelectedMultiModifiers] = useState<string[]>([]);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalNotes, setModalNotes] = useState<string>('');

  // Filtrado de Platos
  const filteredDishes = menuItems.filter(dish => {
    const matchesCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === 'all' || dish.tags.includes(activeTag);
    return matchesCategory && matchesSearch && matchesTag;
  });

  const handleOpenDishModal = (dish: MenuItem) => {
    if (!dish.isAvailable) return;
    sounds.playClick();
    setModalDish(dish);
    setModalQuantity(1);
    setModalNotes('');

    // Preseleccionar requeridos por defecto
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

  const handleConfirmAddToCart = () => {
    if (!modalDish) return;

    // Compilar modificadores seleccionados
    const compiledModifiers: any[] = [];

    if (modalDish.modifierGroups) {
      modalDish.modifierGroups.forEach(group => {
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

      // Multi-modifiers
      selectedMultiModifiers.forEach(optId => {
        for (const group of modalDish.modifierGroups || []) {
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

    addToCart(modalDish, modalQuantity, compiledModifiers, modalNotes);
    setModalDish(null);
  };

  return (
    <section id="menu-section" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header de Sección */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sincronización en Tiempo Real</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Nuestra Carta Sensorial
        </h2>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Cada plato es elaborado con pesca artesanal fresca del día e insumos autóctonos. 
          La disponibilidad se actualiza en vivo directamente con nuestra cocina.
        </p>
      </div>

      {/* Barra de Búsqueda & Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Buscador */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ceviches, tiraditos, arroces, cócteles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a1526] border border-white/15 pl-11 pr-4 py-3 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tags de Filtrado Rápido */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'Recomendado', label: '⭐ Recomendados' },
            { id: 'Picante Graduable', label: '🌶️ Picante' },
            { id: 'Sin Gluten', label: '🌾 Sin Gluten' },
            { id: 'Para Compartir', label: '👥 Para Compartir' }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => {
                sounds.playClick();
                setActiveTag(tag.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTag === tag.id
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categorías Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 border-b border-white/10">
        <button
          onClick={() => {
            sounds.playClick();
            setSelectedCategory('all');
          }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Todas las Categorías ({menuItems.length})
        </button>
        {categories.map(cat => {
          const count = menuItems.filter(i => i.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Platos (Double-Bezel Architecture) */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl p-8">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-white mb-1">No se encontraron platos</h3>
          <p className="text-xs text-slate-400">Prueba con otra palabra clave o selecciona otra categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map(dish => (
            <div
              key={dish.id}
              className={`group bezel-container transition-all duration-300 ${
                dish.isAvailable ? 'hover:-translate-y-1' : 'opacity-65 grayscale-[30%]'
              }`}
            >
              <div className="bezel-core p-4 flex flex-col h-full overflow-hidden">
                {/* Imagen del Plato con Badges */}
                <div className="relative w-full h-52 rounded-2xl overflow-hidden mb-4 bg-black/40">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Badge de Stock en Tiempo Real */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg border">
                    {dish.isAvailable ? (
                      <span className="bg-emerald-500/90 border-emerald-400/50 text-white flex items-center gap-1 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Disponible en Vivo
                      </span>
                    ) : (
                      <span className="bg-rose-600/90 border-rose-400/50 text-white flex items-center gap-1 px-2 py-0.5 rounded-full">
                        Agotado por hoy (86)
                      </span>
                    )}
                  </div>

                  {/* Badge de Tiempo de Preparación */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-slate-200 text-[10px] font-semibold backdrop-blur-md">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>~{dish.preparationMinutes} min</span>
                  </div>

                  {/* Tags */}
                  {dish.tags.length > 0 && (
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {dish.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[9px] font-bold shadow-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info del Plato */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight leading-snug mb-1.5 group-hover:text-amber-400 transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4 font-normal">
                      {dish.description}
                    </p>
                  </div>

                  {/* Precio & CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Precio</span>
                      <span className="text-xl font-black text-amber-400">{formatMoney(dish.price)}</span>
                    </div>

                    <button
                      onClick={() => handleOpenDishModal(dish)}
                      disabled={!dish.isAvailable}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                        dish.isAvailable
                          ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-amber-500/20'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{dish.modifierGroups && dish.modifierGroups.length > 0 ? 'Personalizar' : 'Agregar'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Personalización de Plato para Clientes */}
      {modalDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0a1526] border border-white/15 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            {/* Cerrar */}
            <button
              onClick={() => {
                sounds.playClick();
                setModalDish(null);
              }}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Plato */}
            <div className="flex gap-4 mb-5">
              <img
                src={modalDish.imageUrl}
                alt={modalDish.name}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/15"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white tracking-tight">{modalDish.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{modalDish.description}</p>
                <p className="text-base font-black text-amber-400 mt-2">{formatMoney(modalDish.price)}</p>
              </div>
            </div>

            {/* Grupos de Modificadores */}
            {modalDish.modifierGroups && modalDish.modifierGroups.map(group => (
              <div key={group.id} className="mb-5 bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{group.name}</h4>
                  {group.required && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Obligatorio
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.options.map(opt => {
                    const isSingleSelected = selectedModifiers[group.id] === opt.id;
                    const isMultiSelected = selectedMultiModifiers.includes(opt.id);

                    if (group.required) {
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedModifiers(prev => ({ ...prev, [group.id]: opt.id }));
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                            isSingleSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSingleSelected ? 'border-amber-400 bg-amber-400' : 'border-white/30'}`}>
                              {isSingleSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          {opt.extraPrice > 0 && <span className="font-bold text-amber-400">+{formatMoney(opt.extraPrice)}</span>}
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedMultiModifiers(prev => 
                              isMultiSelected ? prev.filter(id => id !== opt.id) : [...prev, opt.id]
                            );
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                            isMultiSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isMultiSelected ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-white/30'}`}>
                              {isMultiSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          {opt.extraPrice > 0 && <span className="font-bold text-cyan-400">+{formatMoney(opt.extraPrice)}</span>}
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            ))}

            {/* Notas Especiales */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-300 block mb-1">Notas especiales para la cocina (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Sin culantro, salsa al lado, poco hielo..."
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Cantidad & Total */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 bg-black/40 border border-white/15 p-1 rounded-xl">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setModalQuantity(prev => Math.max(1, prev - 1));
                  }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-sm font-bold text-white px-2">{modalQuantity}</span>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setModalQuantity(prev => prev + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleConfirmAddToCart}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar a la Bolsa</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
