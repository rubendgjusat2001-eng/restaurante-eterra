'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { WarehouseItem, WarehouseMovement } from '@/types/restaurant';
import * as warehouseService from '@/services/warehouse.service';
import { sounds } from '@/lib/utils';
import {
  Package,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  X,
  AlertTriangle,
  Truck,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings2,
  Eye
} from 'lucide-react';

export function AlmacenView() {
  const {
    currentThemeColors,
    warehouseItems,
    suppliers,
    addWarehouseItem,
    removeWarehouseItem,
    registerStockMovement,
    addSupplier,
    removeSupplier,
    showToast
  } = useRestaurant();

  const primaryColor = currentThemeColors.primary || '#0284c7';

  const [activeTab, setActiveTab] = useState<'items' | 'suppliers'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Formulario nuevo insumo
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemStock, setNewItemStock] = useState('0');
  const [newItemMinStock, setNewItemMinStock] = useState('0');
  const [newItemSupplierId, setNewItemSupplierId] = useState('');

  // Formulario nuevo proveedor
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');

  // Modal de movimiento de stock
  const [movementItem, setMovementItem] = useState<WarehouseItem | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementHistory, setMovementHistory] = useState<WarehouseMovement[]>([]);

  useEffect(() => {
    if (!movementItem) return;
    warehouseService.fetchItemMovements(movementItem.id).then(setMovementHistory);
  }, [movementItem]);

  const categories = Array.from(new Set(warehouseItems.map(i => i.category).filter(Boolean)));

  const filteredItems = warehouseItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesLowStock = !showLowStockOnly || item.currentStock <= item.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = warehouseItems.filter(i => i.currentStock <= i.minStock).length;

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCategory.trim()) {
      showToast('error', 'Nombre y categoría son requeridos');
      sounds.playAlert();
      return;
    }
    addWarehouseItem({
      name: newItemName.trim(),
      category: newItemCategory.trim(),
      unit: newItemUnit.trim() || 'unidad',
      currentStock: parseFloat(newItemStock) || 0,
      minStock: parseFloat(newItemMinStock) || 0,
      supplierId: newItemSupplierId || undefined
    });
    setNewItemName('');
    setNewItemCategory('');
    setNewItemStock('0');
    setNewItemMinStock('0');
    setNewItemSupplierId('');
    setIsAddItemOpen(false);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    addSupplier({
      name: newSupplierName.trim(),
      phone: newSupplierPhone.trim() || undefined,
      contactName: newSupplierContact.trim() || undefined
    });
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierContact('');
    setIsAddSupplierOpen(false);
  };

  const openMovementModal = (item: WarehouseItem) => {
    setMovementItem(item);
    setMovementType('in');
    setMovementQuantity('');
    setMovementReason('');
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementItem) return;
    const qty = parseFloat(movementQuantity);
    if (!qty || qty < 0 || !movementReason.trim()) {
      showToast('error', 'Completa la cantidad y el motivo');
      sounds.playAlert();
      return;
    }
    await registerStockMovement({ itemId: movementItem.id, movementType, quantity: qty, reason: movementReason.trim() });
    const updated = await warehouseService.fetchItemMovements(movementItem.id);
    setMovementHistory(updated);
    setMovementQuantity('');
    setMovementReason('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Inicio</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">Almacén</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Almacén e Insumos</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Control de stock, movimientos de entrada/salida y proveedores.
            {lowStockCount > 0 && (
              <span className="ml-2 text-rose-600 font-bold">
                {lowStockCount} {lowStockCount === 1 ? 'insumo' : 'insumos'} con stock bajo
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        {[
          { id: 'items', label: `Insumos (${warehouseItems.length})` },
          { id: 'suppliers', label: `Proveedores (${suppliers.length})` }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={isActive ? { backgroundColor: primaryColor, color: '#fff' } : {}}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive ? '' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'items' ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddItemOpen(!isAddItemOpen)}
              style={{ backgroundColor: primaryColor }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90"
            >
              {isAddItemOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAddItemOpen ? 'Cerrar' : '+ Nuevo Insumo'}</span>
            </button>
          </div>

          {isAddItemOpen && (
            <form onSubmit={handleCreateItem} className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Insumo</label>
                  <input type="text" required placeholder="Ej: Filete de pescado" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <input type="text" required placeholder="Ej: Pescados y Mariscos" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <input type="text" placeholder="kg, lt, unidad, caja..." value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Inicial</label>
                  <input type="number" step="0.01" min="0" value={newItemStock} onChange={e => setNewItemStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Mínimo (alerta)</label>
                  <input type="number" step="0.01" min="0" value={newItemMinStock} onChange={e => setNewItemMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Proveedor (opcional)</label>
                  <select value={newItemSupplierId} onChange={e => setNewItemSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400">
                    <option value="">Sin asignar</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddItemOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Cancelar</button>
                <button type="submit" style={{ backgroundColor: primaryColor }} className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer hover:opacity-90">Guardar Insumo</button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <button onClick={() => setCategoryFilter('all')} style={categoryFilter === 'all' ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${categoryFilter === 'all' ? '' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Todos</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} style={categoryFilter === cat ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                  className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${categoryFilter === cat ? '' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{cat}</button>
              ))}
              <button onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`ml-auto flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${showLowStockOnly ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>
                <AlertTriangle className="w-3 h-3" /> Solo stock bajo
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Insumo</th>
                    <th className="py-3.5 px-4 sm:px-6">Categoría</th>
                    <th className="py-3.5 px-4 sm:px-6">Stock Actual</th>
                    <th className="py-3.5 px-4 sm:px-6">Stock Mínimo</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="font-semibold text-xs">No hay insumos que coincidan</p></td></tr>
                  ) : (
                    filteredItems.map(item => {
                      const isLow = item.currentStock <= item.minStock;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">{item.name}</td>
                          <td className="py-4 px-4 sm:px-6 text-slate-600">{item.category}</td>
                          <td className="py-4 px-4 sm:px-6">
                            <span className={`font-mono font-bold ${isLow ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {item.currentStock} {item.unit}
                            </span>
                            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 inline ml-1.5" />}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-slate-500 font-mono">{item.minStock} {item.unit}</td>
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openMovementModal(item)} className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-colors cursor-pointer" title="Registrar entrada/salida">
                                <Settings2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeWarehouseItem(item.id, item.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" title="Eliminar insumo">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={() => setIsAddSupplierOpen(!isAddSupplierOpen)} style={{ backgroundColor: primaryColor }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90">
              {isAddSupplierOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAddSupplierOpen ? 'Cerrar' : '+ Nuevo Proveedor'}</span>
            </button>
          </div>

          {isAddSupplierOpen && (
            <form onSubmit={handleCreateSupplier} className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre / Razón Social</label>
                  <input type="text" required value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contacto</label>
                  <input type="text" value={newSupplierContact} onChange={e => setNewSupplierContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input type="text" value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddSupplierOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Cancelar</button>
                <button type="submit" style={{ backgroundColor: primaryColor }} className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer hover:opacity-90">Guardar Proveedor</button>
              </div>
            </form>
          )}

          <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
            {suppliers.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400"><Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />No hay proveedores registrados todavía</p>
            ) : (
              suppliers.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{[s.contactName, s.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
                  </div>
                  <button onClick={() => removeSupplier(s.id, s.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal de Movimiento de Stock */}
      {movementItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Movimiento de Stock — {movementItem.name}</h3>
              <button onClick={() => setMovementItem(null)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Stock actual: <strong className="text-slate-900">{movementItem.currentStock} {movementItem.unit}</strong>
            </p>

            <form onSubmit={handleRegisterMovement} className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                <button type="button" onClick={() => setMovementType('in')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold ${movementType === 'in' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <ArrowUpCircle className="w-3.5 h-3.5" /> Entrada
                </button>
                <button type="button" onClick={() => setMovementType('out')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold ${movementType === 'out' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <ArrowDownCircle className="w-3.5 h-3.5" /> Salida
                </button>
                <button type="button" onClick={() => setMovementType('adjustment')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold ${movementType === 'adjustment' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Settings2 className="w-3.5 h-3.5" /> Ajuste
                </button>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {movementType === 'adjustment' ? `Nuevo stock (${movementItem.unit})` : `Cantidad (${movementItem.unit})`}
                </label>
                <input type="number" step="0.01" min="0" value={movementQuantity} onChange={e => setMovementQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo</label>
                <input type="text" placeholder="Ej: Compra semanal, merma, conteo físico..." value={movementReason} onChange={e => setMovementReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400" />
              </div>
              <button type="submit" style={{ backgroundColor: primaryColor }} className="w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-90">
                Registrar Movimiento
              </button>
            </form>

            <div>
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Historial reciente
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {movementHistory.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin movimientos registrados todavía.</p>
                ) : movementHistory.map(m => (
                  <div key={m.id} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                    <span>
                      <strong className={m.movementType === 'in' ? 'text-emerald-700' : m.movementType === 'out' ? 'text-rose-700' : 'text-amber-700'}>
                        {m.movementType === 'in' ? 'Entrada' : m.movementType === 'out' ? 'Salida' : 'Ajuste'}
                      </strong> · {m.reason} {m.createdBy && `· ${m.createdBy}`}
                    </span>
                    <span className="font-mono font-bold">{m.quantity} {movementItem.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
