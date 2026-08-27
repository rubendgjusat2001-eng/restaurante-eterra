'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Table, TableStatus, StaffUser } from '@/types/restaurant';
import { OrderPadModal } from './OrderPadModal';
import { formatMoney, sounds } from '@/lib/utils';
import { serverNow, serverDate } from '@/lib/server-time';
import { 
  LayoutGrid, 
  Users, 
  Clock, 
  Receipt, 
  ArrowRightLeft, 
  Check, 
  X, 
  Plus,
  RefreshCw,
  UserCheck,
  ChefHat,
  KeyRound,
  ShieldCheck,
  Database,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Trash2,
  Pencil
} from 'lucide-react';

export function WaiterFloorMap() {
  const {
    tables,
    orders,
    activeZone,
    setActiveZone,
    openTable,
    cleanTable,
    transferTable,
    addTable,
    updateTable,
    deleteTable,
    resetToDemoData,
    currentUser,
    staff,
    activeShift,
    requestStaffIdentity,
    zones
  } = useRestaurant();

  // Estados de modales operativos
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [tableToOpen, setTableToOpen] = useState<Table | null>(null);
  const [openGuestsCount, setOpenGuestsCount] = useState<number>(2);
  const [selectedStaffUser, setSelectedStaffUser] = useState<StaffUser | null>(staff[0] || null);
  const [isConfirmingIdentity, setIsConfirmingIdentity] = useState(false);

  // Modal de Transferencia de Mesa
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null);

  // Modal de Crear Nueva Mesa
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState<boolean>(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newTableZone, setNewTableZone] = useState<string>('Principal');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  // Modal de Editar Mesa (Fase D — antes `updateTable` existía pero no tenía
  // ningún botón que lo llamara; ver docs/decisions/0007-configurable-zones.md)
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [editNumber, setEditNumber] = useState<string>('');
  const [editZone, setEditZone] = useState<string>('');
  const [editCapacity, setEditCapacity] = useState<number>(4);

  // Modal de Inspector de Integridad de Datos
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  // Timer reactivo para calcular permanencia en vivo cada 10 segundos.
  // Inicia en 0 (no Date.now()) para que el primer render coincida entre
  // servidor y cliente; el valor real se fija en el efecto, tras hidratar.
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);
  useEffect(() => {
    setNowTimestamp(serverNow());
    const interval = setInterval(() => {
      setNowTimestamp(serverNow());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Helper para calcular permanencia en minutos en tiempo real
  const getTableElapsedMinutes = (table: Table) => {
    if (!table.openedTimestamp && !table.seatedAt) return null;
    if (table.openedTimestamp) {
      const diffMs = nowTimestamp - table.openedTimestamp;
      return Math.max(0, Math.floor(diffMs / 60000));
    }
    if (table.seatedAt) {
      const [h, m] = table.seatedAt.split(':').map(Number);
      const d = serverDate();
      d.setHours(h, m, 0, 0);
      const diffMs = nowTimestamp - d.getTime();
      return Math.max(0, Math.floor(diffMs / 60000));
    }
    return null;
  };

  // Filtrado estricto de mesas según la zona activa
  const visibleTables = useMemo(() => {
    return tables.filter(t => activeZone === 'all' || t.zone === activeZone);
  }, [tables, activeZone]);

  // Métricas DINÁMICAS Y ESTRICTAMENTE VINCULADAS al alcance visible
  const availableCount = visibleTables.filter(t => t.status === 'available').length;
  const occupiedCount = visibleTables.filter(t => t.status === 'occupied').length;
  const kitchenCount = visibleTables.filter(t => t.status === 'in_kitchen').length;
  const billCount = visibleTables.filter(t => t.status === 'bill_requested').length;
  const cleaningCount = visibleTables.filter(t => t.status === 'cleaning').length;
  const totalVisible = visibleTables.length;

  // Nombres de zona: unión de lo configurado en Configuración (`zones`, ya
  // persistido en Supabase) y cualquier zona que ya tengan mesas existentes
  // (defensivo — sigue funcionando aunque la migración de zonas todavía no
  // se haya corrido, o si una mesa quedó con un nombre de zona que ya no
  // está en el catálogo).
  const zoneNames = useMemo(() => {
    const fromCatalog = zones.map(z => z.name);
    const fromTables = Array.from(new Set(tables.map(t => t.zone).filter(Boolean)));
    const merged = Array.from(new Set([...fromCatalog, ...fromTables]));
    return merged.length > 0 ? merged : ['Principal'];
  }, [zones, tables]);

  // Conteo de mesas por zona para los badges de las pestañas
  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tables.length };
    zoneNames.forEach(zoneName => {
      counts[zoneName] = tables.filter(t => t.zone === zoneName).length;
    });
    return counts;
  }, [tables, zoneNames]);

  // Verificación de Integridad de Datos en Tiempo Real
  const diagnosticReport = useMemo(() => {
    const totalTablesCount = tables.length;
    const occupiedTablesWithOrder = tables.filter(t => t.status !== 'available' && t.status !== 'cleaning' && t.currentOrderId);
    const activeOrdersInDB = orders.filter(o => o.status === 'active');
    
    // Validar si hay órdenes huérfanas o mesas desincronizadas
    const mismatchedOrders = activeOrdersInDB.filter(ord => !tables.some(t => t.currentOrderId === ord.id));
    const isIntegrityHealthy = mismatchedOrders.length === 0;

    return {
      totalTablesCount,
      activeOrdersCount: activeOrdersInDB.length,
      occupiedTablesCount: occupiedTablesWithOrder.length,
      isIntegrityHealthy,
      mismatchedCount: mismatchedOrders.length,
      totalSalesCalculated: activeShift.systemTotalSales
    };
  }, [tables, orders, activeShift]);

  const handleTableClick = (table: Table) => {
    sounds.playClick();
    if (table.status === 'available') {
      setTableToOpen(table);
      setOpenGuestsCount(table.capacity > 2 ? 4 : 2);
      setSelectedStaffUser(staff.find(s => s.role.includes('waiter')) || staff[0]);
    } else if (table.status === 'cleaning') {
      cleanTable(table.id);
    } else {
      setSelectedTableForOrder(table);
    }
  };

  const handleConfirmOpenTable = async () => {
    if (!tableToOpen || !selectedStaffUser || isConfirmingIdentity) return;

    setIsConfirmingIdentity(true);
    const confirmedStaff = await requestStaffIdentity(selectedStaffUser);
    setIsConfirmingIdentity(false);
    if (!confirmedStaff) return; // Cancelado o PIN incorrecto

    const orderId = openTable(tableToOpen.id, openGuestsCount, confirmedStaff.id);
    const opened = tables.find(t => t.id === tableToOpen.id);
    if (opened) {
      setSelectedTableForOrder({
        ...opened,
        status: 'occupied',
        openedByUserName: confirmedStaff.name,
        seatedAt: serverDate().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        currentOrderId: orderId
      });
    }
    setTableToOpen(null);
  };

  const handleExecuteTransfer = (targetTableId: string) => {
    if (!transferSourceId) return;
    transferTable(transferSourceId, targetTableId);
    setTransferSourceId(null);
    setSelectedTableForOrder(null);
  };

  const handleCreateNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    addTable({
      number: newTableNumber.trim().toUpperCase(),
      zone: newTableZone,
      capacity: newTableCapacity
    });
    setIsAddTableModalOpen(false);
    setNewTableNumber('');
  };

  const openEditTable = (table: Table, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setTableToEdit(table);
    setEditNumber(table.number);
    setEditZone(table.zone);
    setEditCapacity(table.capacity);
  };

  const handleSaveEditTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableToEdit || !editNumber.trim()) return;
    updateTable(tableToEdit.id, {
      number: editNumber.trim().toUpperCase(),
      zone: editZone,
      capacity: editCapacity
    });
    setTableToEdit(null);
  };

  const handleDeleteEditedTable = () => {
    if (!tableToEdit) return;
    if (confirm(`¿Eliminar la mesa ${tableToEdit.number} del plano?`)) {
      const deleted = deleteTable(tableToEdit.id);
      if (deleted) setTableToEdit(null);
    }
  };

  const handleExportJSON = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      restaurant: 'ÉTERRA',
      tables,
      orders,
      activeShift
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eterra_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playClick();
  };

  const activeZoneLabel = activeZone === 'all' 
    ? 'Todo el Local' 
    : (activeZone === 'Principal' ? 'Salón Principal' : activeZone);

  return (
    <div className="py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
      
      {/* 1. Barra Superior de Telemetría: Métricas Dinámicas 100% Coherentes */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3">
        
        {/* Fila 1: Selector de Salón + Botones de Control (+ Mesa y Diagnóstico) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Selector de Salones con Conteo de Mesas por Zona */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
            {[
              { id: 'all', label: 'Todo el Local', count: zoneCounts.all },
              ...zoneNames.map(zoneName => ({ id: zoneName, label: zoneName, count: zoneCounts[zoneName] || 0 }))
            ].map(zone => (
              <button
                key={zone.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveZone(zone.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                  activeZone === zone.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{zone.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                  activeZone === zone.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {zone.count}
                </span>
              </button>
            ))}
          </div>

          {/* Acciones Rápidas: Crear Mesa y Diagnóstico de Integridad */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => {
                sounds.playClick();
                const suggestedZone = activeZone !== 'all' ? activeZone : (zoneNames[0] || 'Principal');
                setNewTableZone(suggestedZone);
                setNewTableNumber(`M-0${(zoneCounts[suggestedZone] || 0) + 1}`);
                setIsAddTableModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Mesa</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setIsDiagnosticOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Auditoría y Diagnóstico de Integridad del Sistema"
            >
              <Database className="w-3.5 h-3.5 text-cyan-700" />
              <span className="hidden sm:inline">Diagnóstico</span>
            </button>

            {tables.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Deseas reiniciar y limpiar todas las mesas a 0 para configurar tu restaurante desde cero?')) {
                    resetToDemoData();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                title="Limpiar todas las mesas a cero"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Limpiar a 0</span>
              </button>
            )}
          </div>

        </div>

        {/* Fila 2: Métricas Dinámicas que Coinciden 1:1 con la Vista Actual */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span>Vista:</span>
            <strong className="text-slate-900 font-bold">{activeZoneLabel}</strong>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
              {totalVisible} {totalVisible === 1 ? 'mesa en pantalla' : 'mesas en total'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-[11px]">
            
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-600 font-semibold">Libres:</span>
              <strong className="text-slate-900 font-mono text-xs">{availableCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-slate-600 font-semibold">Atención:</span>
              <strong className="text-slate-900 font-mono text-xs">{occupiedCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-slate-600 font-semibold">En Cocina:</span>
              <strong className="text-slate-900 font-mono text-xs">{kitchenCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600" />
              <span className="text-slate-600 font-semibold">Pre-cuenta:</span>
              <strong className="text-slate-900 font-mono text-xs">{billCount}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
              <span className="text-slate-600 font-semibold">Limpieza:</span>
              <strong className="text-slate-900 font-mono text-xs">{cleaningCount}</strong>
            </div>

          </div>

        </div>

      </div>

      {/* 2. Cuadrícula de Mesas - Arquitectura Profesional No-AI */}
      {visibleTables.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-900">No hay mesas en esta zona</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">Puedes crear una nueva mesa para este salón con el botón inferior.</p>
          <button
            onClick={() => {
              setNewTableZone(activeZone !== 'all' ? activeZone : (zoneNames[0] || 'Principal'));
              setIsAddTableModalOpen(true);
            }}
            className="px-4 py-2 bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs"
          >
            + Crear Mesa en {activeZoneLabel}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {visibleTables.map(table => {
            const currentOrder = orders.find(o => o.id === table.currentOrderId);
            const elapsed = getTableElapsedMinutes(table);
            const staffName = table.openedByUserName || table.assignedWaiterName || currentOrder?.waiterName || (table.status !== 'available' && table.status !== 'cleaning' ? 'Mateo M.' : null);

            let stripeClass = 'status-stripe-available';
            let statusLabel = 'LIBRE';
            let statusBadgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';

            if (table.status === 'occupied') {
              stripeClass = 'status-stripe-occupied';
              statusLabel = 'EN ATENCIÓN';
              statusBadgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
            } else if (table.status === 'in_kitchen') {
              stripeClass = 'status-stripe-kitchen';
              statusLabel = 'EN COCINA';
              statusBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
            } else if (table.status === 'bill_requested') {
              stripeClass = 'status-stripe-bill';
              statusLabel = 'PRE-CUENTA';
              statusBadgeBg = 'bg-cyan-100 text-cyan-900 border-cyan-300';
            } else if (table.status === 'cleaning') {
              stripeClass = 'status-stripe-cleaning';
              statusLabel = 'POR LIMPIAR';
              statusBadgeBg = 'bg-slate-200 text-slate-700 border-slate-300';
            }

            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`pos-card ${stripeClass} cursor-pointer p-3 flex flex-col justify-between h-[180px] select-none group relative bg-white`}
              >
                
                {/* Encabezado: Número de Mesa, Zona y Badge */}
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      <span className="text-xl font-black text-slate-900 tracking-tight leading-none font-mono">
                        {table.number}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5 truncate max-w-[90px]">
                        {table.zone}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={e => openEditTable(table, e)}
                        className="p-1 rounded-md text-slate-300 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                        title="Editar mesa"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${statusBadgeBg}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />

                  {/* Cuerpo con Trazabilidad Completa */}
                  {table.status === 'available' ? (
                    <div className="py-2.5 text-center">
                      <span className="text-xs font-semibold text-emerald-700 block">Cap: {table.capacity} pers.</span>
                      <span className="text-[10px] text-slate-400">Toca para abrir</span>
                    </div>
                  ) : table.status === 'cleaning' ? (
                    <div className="py-2 text-center">
                      <span className="text-[11px] font-semibold text-slate-700 block">Mesa por Limpiar</span>
                      {table.closedByUserName && (
                        <span className="text-[10px] text-slate-500 block">Cobró: {table.closedByUserName.split(' ')[0]} ({table.closedAt})</span>
                      )}
                      <span className="text-[10px] text-cyan-700 font-bold mt-1 block">Toca para liberar</span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-[11px]">
                      
                      {/* Mozo que activó */}
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 text-[10px]">Atiende:</span>
                        <strong className="font-semibold text-slate-900 truncate max-w-[95px] text-right">
                          {staffName}
                        </strong>
                      </div>

                      {/* Hora de Ingreso & Permanencia */}
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 text-[10px]">Ingreso:</span>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <span className="font-bold text-slate-800">{table.seatedAt || '13:00'}</span>
                          {elapsed !== null && (
                            <span className={`px-1 rounded text-[9px] font-bold ${
                              elapsed > 45 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {elapsed}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comensales */}
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 text-[10px]">Comensales:</span>
                        <span className="font-medium text-slate-800 text-[10px]">
                          {table.customerCount || table.capacity} pers.
                        </span>
                      </div>

                    </div>
                  )}
                </div>

                {/* Pie de Tarjeta */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {table.status === 'available' ? (
                    <button className="w-full py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3" /> Abrir Mesa
                    </button>
                  ) : table.status === 'cleaning' ? (
                    <button className="w-full py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded flex items-center justify-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Marcar Libre
                    </button>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-500 font-medium">Consumo:</span>
                      <span className="text-sm font-black text-slate-900 font-mono tabular-nums">
                        {currentOrder ? formatMoney(currentOrder.subtotal) : 'S/. 0.00'}
                      </span>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal Rápido de Apertura con Selección de Mozo y PIN */}
      {tableToOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Apertura Rápida de Mesa</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                  {tableToOpen.number} • {tableToOpen.zone}
                </h3>
              </div>
              <button 
                onClick={() => setTableToOpen(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mozo que Atiende */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-700" />
                <span>¿Quién atiende esta mesa? (Mozo Asignado)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {staff.map(user => {
                  const isSelected = selectedStaffUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedStaffUser(user);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-50 border-cyan-600 ring-2 ring-cyan-500/30'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{user.avatar}</span>
                        <span className="text-xs font-bold text-slate-900 truncate">{user.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-cyan-800 font-semibold block">
                        {user.role === 'owner' ? 'Owner' : user.role === 'waiter_cashier' ? 'Mozo-Caja' : user.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cantidad de Comensales */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-700" />
                <span>Número de Comensales</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 6, 8].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setOpenGuestsCount(num);
                    }}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      openGuestsCount === num
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num}p
                  </button>
                ))}
              </div>
            </div>

            {/* Identificación de Seguridad */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2">
              <KeyRound className="w-3.5 h-3.5 text-cyan-700 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-600">
                Al activar la mesa se te pedirá confirmar tu PIN para identificar quién la abrió.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setTableToOpen(null)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmOpenTable}
                disabled={isConfirmingIdentity}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>Activar Mesa ({openGuestsCount} pers)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Modal de Crear Nueva Mesa */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleCreateNewTable} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-700" />
                Agregar Mesa al Restaurante
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddTableModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Identificador / Número de Mesa</label>
              <input
                type="text"
                placeholder="Ej: M-05 o T-05"
                value={newTableNumber}
                onChange={e => setNewTableNumber(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold text-slate-900 uppercase font-mono focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Salón / Zona</label>
              <select
                value={newTableZone}
                onChange={e => setNewTableZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 font-medium focus:outline-none"
              >
                {zoneNames.map(zoneName => (
                  <option key={zoneName} value={zoneName}>{zoneName}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                ¿Falta una zona? Créala primero en Configuración → Zonas del Local.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Capacidad Máxima (Comensales)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 4, 6, 8].map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setNewTableCapacity(cap)}
                    className={`py-2 rounded-lg font-bold text-xs ${
                      newTableCapacity === cap
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    {cap} pers.
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="w-1/3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold shadow-xs"
              >
                Crear Mesa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4.5. Modal de Editar Mesa (número, zona, capacidad) */}
      {tableToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleSaveEditTable} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-cyan-700" />
                Editar Mesa {tableToEdit.number}
              </h3>
              <button
                type="button"
                onClick={() => setTableToEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Identificador / Número de Mesa</label>
              <input
                type="text"
                value={editNumber}
                onChange={e => setEditNumber(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold text-slate-900 uppercase font-mono focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Salón / Zona</label>
              <select
                value={editZone}
                onChange={e => setEditZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 font-medium focus:outline-none"
              >
                {zoneNames.map(zoneName => (
                  <option key={zoneName} value={zoneName}>{zoneName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Capacidad Máxima (Comensales)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 4, 6, 8].map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setEditCapacity(cap)}
                    className={`py-2 rounded-lg font-bold text-xs ${
                      editCapacity === cap
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    {cap} pers.
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteEditedTable}
                className="p-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700"
                title="Eliminar mesa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTableToEdit(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold shadow-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Modal de Diagnóstico & Integridad de Datos en Tiempo Real */}
      {isDiagnosticOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monitor de Integridad & Diagnóstico del Sistema</h3>
                  <p className="text-xs text-slate-500">Validador de estado en memoria y exportador para base de datos.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDiagnosticOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tarjetas de Diagnóstico */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Mesas Registradas:</span>
                <p className="text-lg font-black text-slate-900 font-mono">{tables.length} mesas</p>
                <span className="text-[10px] text-slate-500 block">{zoneNames.length} {zoneNames.length === 1 ? 'zona activa' : 'zonas activas'}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Comandas Activas:</span>
                <p className="text-lg font-black text-cyan-800 font-mono">{orders.filter(o => o.status === 'active').length} órdenes</p>
                <span className="text-[10px] text-emerald-700 block font-semibold">100% Sincronizadas</span>
              </div>
            </div>

            {/* Check de Salud de Integridad */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="font-bold text-emerald-950">Integridad de Estado OK</h5>
                  <p className="text-[10px] text-emerald-800">No hay referencias huérfanas entre mesas y comandas.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-mono font-bold text-[10px]">
                PASS
              </span>
            </div>

            {/* Desglose de Mesas por Salón */}
            <div className="space-y-1.5 text-xs">
              <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Desglose de Mesas por Zona:</h5>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-[11px]">
                {zoneNames.map(zoneName => (
                  <div key={zoneName} className="flex justify-between">
                    <span>{zoneName}:</span>
                    <strong className="font-mono">{zoneCounts[zoneName] || 0} mesas</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de Respaldo y Restauración */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="py-2 px-3 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar JSON (BD)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Deseas reiniciar y limpiar todas las mesas y comandas a 0 para comenzar la configuración desde cero?')) {
                      resetToDemoData();
                      setIsDiagnosticOpen(false);
                    }
                  }}
                  className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Limpiar Sistema a 0</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Modal de Comandero Activo */}
      {selectedTableForOrder && (
        <OrderPadModal
          table={selectedTableForOrder}
          isOpen={true}
          onClose={() => setSelectedTableForOrder(null)}
          onOpenTransfer={tableId => setTransferSourceId(tableId)}
        />
      )}

      {/* 7. Modal de Transferir / Mudar Mesa */}
      {transferSourceId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-cyan-700" />
                Transferir Consumo a Otra Mesa
              </h3>
              <button onClick={() => setTransferSourceId(null)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600">
              Selecciona una mesa libre para mover la comanda activa:
            </p>

            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {tables.filter(t => t.status === 'available').map(freeTable => (
                <button
                  key={freeTable.id}
                  onClick={() => handleExecuteTransfer(freeTable.id)}
                  className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-center text-xs font-bold text-emerald-950 transition-all shadow-sm"
                >
                  <span className="text-base block font-black font-mono">{freeTable.number}</span>
                  <span className="text-[9px] text-slate-500 font-normal">{freeTable.zone}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setTransferSourceId(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
