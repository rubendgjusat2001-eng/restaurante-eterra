'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { MenuItem, DishStation } from '@/types/restaurant';
import { 
  Utensils, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  X, 
  CheckCircle2,
  DollarSign,
  Layers
} from 'lucide-react';
import { sounds, formatMoney } from '@/lib/utils';

export function DishManagementView() {
  const { 
    menuItems, 
    categories, 
    addDish, 
    deleteDish, 
    toggleDishAvailability, 
    showToast 
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Formulario Nuevo Plato
  const [dishName, setDishName] = useState('');
  const [dishCat, setDishCat] = useState(categories[0]?.id || 'cat-01');
  const [dishPrice, setDishPrice] = useState('35.00');
  const [dishStation, setDishStation] = useState<DishStation>('kitchen_cold');
  const [dishDesc, setDishDesc] = useState('');

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      showToast('error', 'Ingrese el nombre del plato');
      sounds.playAlert();
      return;
    }
    const priceNum = parseFloat(dishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('error', 'Ingrese un precio válido');
      sounds.playAlert();
      return;
    }

    const newDish: MenuItem = {
      id: `dish-${Date.now()}`,
      categoryId: dishCat,
      name: dishName.trim(),
      description: dishDesc.trim() || 'Elaborado con ingredientes frescos de primera calidad.',
      price: priceNum,
      costPrice: Math.round(priceNum * 0.35),
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      station: dishStation,
      isAvailable: true,
      isFeatured: false,
      preparationMinutes: 10,
      tags: ['Carta Nueva'],
      modifierGroups: []
    };

    addDish(newDish);
    setDishName('');
    setDishDesc('');
    setIsAddFormOpen(false);
    showToast('success', `Plato "${newDish.name}" registrado en la carta`);
    sounds.playClick();
  };

  const filteredDishes = menuItems.filter(dish => {
    const matchesCat = selectedCategory === 'all' || dish.categoryId === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumb Superior */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Inicio</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">Carta & Platos</span>
      </div>

      {/* 2. Título de Sección + Botón de Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Carta & Platos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Crea, edita y gestiona la disponibilidad en vivo (86-list) de tu carta gastronómica
          </p>
        </div>

        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          {isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAddFormOpen ? 'Cerrar Formulario' : '+ Nuevo Plato'}</span>
        </button>
      </div>

      {/* Formulario para Crear Plato */}
      {isAddFormOpen && (
        <form onSubmit={handleCreateDish} className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus className="w-4 h-4 text-amber-600" />
            Añadir Nuevo Plato a la Carta
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Plato</label>
              <input
                type="text"
                required
                placeholder="Ej: Ceviche Clásico de Corvina"
                value={dishName}
                onChange={e => setDishName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
              <select
                value={dishCat}
                onChange={e => setDishCat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Precio (PEN S/.)</label>
              <input
                type="number"
                step="0.50"
                required
                placeholder="48.00"
                value={dishPrice}
                onChange={e => setDishPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Estación de Cocina</label>
              <select
                value={dishStation}
                onChange={e => setDishStation(e.target.value as DishStation)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="kitchen_cold">❄️ Cocina Fría (Ceviches & Entradas)</option>
                <option value="kitchen_hot">🔥 Cocina Caliente (Brasas & Salteados)</option>
                <option value="bar">🍹 Bar & Coctelería</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Descripción / Ingredientes</label>
              <input
                type="text"
                placeholder="Ej: Pesca del día en cubos, limón sutil, cebolla roja, ají limo, choclo desgranado y camote glaseado."
                value={dishDesc}
                onChange={e => setDishDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Guardar Plato
            </button>
          </div>
        </form>
      )}

      {/* 3. Filtros por Categoría & Buscador */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        
        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de plato o descripción..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({menuItems.length})
          </button>
          {categories.map(c => {
            const count = menuItems.filter(d => d.categoryId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. Tabla de Platos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Plato</th>
                <th className="py-3.5 px-4 sm:px-6">Categoría</th>
                <th className="py-3.5 px-4 sm:px-6">Estación</th>
                <th className="py-3.5 px-4 sm:px-6">Precio</th>
                <th className="py-3.5 px-4 sm:px-6">Disponibilidad (86-List)</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDishes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs">No hay platos registrados</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Usa el botón "+ Nuevo Plato" para agregar tus primeras creaciones.</p>
                  </td>
                </tr>
              ) : (
                filteredDishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Plato & Foto */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={dish.imageUrl} 
                          alt={dish.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{dish.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{dish.description}</div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-700">
                      {categories.find(c => c.id === dish.categoryId)?.name || 'General'}
                    </td>

                    {/* Estación */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {dish.station === 'kitchen_cold' ? '❄️ Fría' : dish.station === 'kitchen_hot' ? '🔥 Caliente' : '🍹 Bar'}
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="py-3.5 px-4 sm:px-6 font-black font-mono text-slate-900 text-sm">
                      {formatMoney(dish.price)}
                    </td>

                    {/* Interruptor Disponibilidad */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <button
                        onClick={() => toggleDishAvailability(dish.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          dish.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${dish.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{dish.isAvailable ? 'Disponible' : 'Agotado (86)'}</span>
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => deleteDish(dish.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar Plato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
