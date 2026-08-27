'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { CashDenominationCount } from '@/types/restaurant';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  Coins, 
  Banknote, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  Lock, 
  Plus
} from 'lucide-react';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashDrawerModal({ isOpen, onClose }: CashDrawerModalProps) {
  const {
    activeShift,
    shiftHistory,
    saveCashAudit,
    closeCurrentShift,
    openNewShift,
    staff,
    restaurant,
    requestStaffIdentity
  } = useRestaurant();

  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  // Estados de conteo de billetes y monedas
  const [denominations, setDenominations] = useState<CashDenominationCount>({
    b200: activeShift.countedCashBreakdown?.b200 || 0,
    b100: activeShift.countedCashBreakdown?.b100 || 8,
    b50: activeShift.countedCashBreakdown?.b50 || 10,
    b20: activeShift.countedCashBreakdown?.b20 || 12,
    b10: activeShift.countedCashBreakdown?.b10 || 5,
    m5: activeShift.countedCashBreakdown?.m5 || 10,
    m2: activeShift.countedCashBreakdown?.m2 || 15,
    m1: activeShift.countedCashBreakdown?.m1 || 20,
    m050: activeShift.countedCashBreakdown?.m050 || 10,
    m020: activeShift.countedCashBreakdown?.m020 || 0,
    m010: activeShift.countedCashBreakdown?.m010 || 0
  });

  const [auditNotes, setAuditNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'audit' | 'history' | 'new_shift'>('audit');

  // Estados para nuevo turno
  const [newShiftName, setNewShiftName] = useState<string>('Turno Noche / Cena');
  const [newInitialCash, setNewInitialCash] = useState<number>(300);

  if (!isOpen) return null;

  const handleDenomChange = (key: keyof CashDenominationCount, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setDenominations(prev => ({ ...prev, [key]: num }));
  };

  // Cálculo de totales contados
  const totalBills = 
    (denominations.b200 * 200) +
    (denominations.b100 * 100) +
    (denominations.b50 * 50) +
    (denominations.b20 * 20) +
    (denominations.b10 * 10);

  const totalCoins = 
    (denominations.m5 * 5) +
    (denominations.m2 * 2) +
    (denominations.m1 * 1) +
    (denominations.m050 * 0.50) +
    (denominations.m020 * 0.20) +
    (denominations.m010 * 0.10);

  const totalCashCounted = totalBills + totalCoins;
  const expectedCash = activeShift.initialCash + activeShift.systemCashSales + activeShift.manualCashEntries - activeShift.manualCashWithdrawals;
  const cashDifference = totalCashCounted - expectedCash;

  const handleSaveAudit = () => {
    saveCashAudit(denominations, auditNotes);
  };

  const handleCloseShift = async () => {
    if (isConfirmingClose) return;
    if (!confirm(`¿Estás seguro de cerrar el turno "${activeShift.shiftName}"? Se registrará el cuadre final.`)) return;

    setIsConfirmingClose(true);
    const confirmedStaff = await requestStaffIdentity(staff[0] || null);
    setIsConfirmingClose(false);
    if (!confirmedStaff) return; // Cancelado o PIN incorrecto

    closeCurrentShift(
      totalCashCounted,
      activeShift.systemCardSales,
      activeShift.systemYapePlinSales,
      auditNotes,
      confirmedStaff.name
    );
    setActiveTab('history');
  };

  const handleCreateNewShift = () => {
    openNewShift(newShiftName, newInitialCash);
    setActiveTab('audit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Control de Caja & Arqueo de Turnos</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeShift.status === 'open' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {activeShift.status === 'open' ? '🟢 Turno Abierto' : '🔒 Cerrado'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activeShift.shiftName} • Aperturado por: <strong className="text-slate-800">{activeShift.openedBy}</strong> a las {activeShift.openedAt}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 border border-slate-200 rounded-2xl mb-6">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('audit');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Desglose de Billetes & Monedas (Corte X)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('history');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historial de Turnos & Cierres (Corte Z)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('new_shift');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'new_shift' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Aperturar Nuevo Turno
          </button>
        </div>

        {/* TAB 1: DESGLOSE FÍSICO DE CAJA (CORTE X) */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Grid Conteo: Billetes (Izq) vs Monedas (Der) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Billetes en Soles */}
              <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    Billetes (S/.)
                  </h4>
                  <span className="text-xs font-black text-slate-900">
                    Total: {formatMoney(totalBills)}
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'b200', label: 'Billetes de S/. 200', val: 200 },
                    { key: 'b100', label: 'Billetes de S/. 100', val: 100 },
                    { key: 'b50', label: 'Billetes de S/. 50', val: 50 },
                    { key: 'b20', label: 'Billetes de S/. 20', val: 20 },
                    { key: 'b10', label: 'Billetes de S/. 10', val: 10 }
                  ].map(b => (
                    <div key={b.key} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-700">{b.label}:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={denominations[b.key as keyof CashDenominationCount] || ''}
                          onChange={e => handleDenomChange(b.key as keyof CashDenominationCount, e.target.value)}
                          className="w-16 bg-white border border-slate-300 px-2 py-1 rounded-lg text-center font-bold text-slate-900 text-xs focus:outline-none focus:border-cyan-600 shadow-sm"
                        />
                        <span className="font-mono text-slate-600 text-right w-20">
                          {formatMoney((denominations[b.key as keyof CashDenominationCount] || 0) * b.val)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monedas en Soles */}
              <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h4 className="text-xs font-bold text-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    Monedas (S/.)
                  </h4>
                  <span className="text-xs font-black text-slate-900">
                    Total: {formatMoney(totalCoins)}
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'm5', label: 'Monedas de S/. 5.00', val: 5 },
                    { key: 'm2', label: 'Monedas de S/. 2.00', val: 2 },
                    { key: 'm1', label: 'Monedas de S/. 1.00', val: 1 },
                    { key: 'm050', label: 'Monedas de S/. 0.50', val: 0.50 },
                    { key: 'm020', label: 'Monedas de S/. 0.20', val: 0.20 },
                    { key: 'm010', label: 'Monedas de S/. 0.10', val: 0.10 }
                  ].map(m => (
                    <div key={m.key} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-700">{m.label}:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={denominations[m.key as keyof CashDenominationCount] || ''}
                          onChange={e => handleDenomChange(m.key as keyof CashDenominationCount, e.target.value)}
                          className="w-16 bg-white border border-slate-300 px-2 py-1 rounded-lg text-center font-bold text-slate-900 text-xs focus:outline-none focus:border-cyan-600 shadow-sm"
                        />
                        <span className="font-mono text-slate-600 text-right w-20">
                          {formatMoney((denominations[m.key as keyof CashDenominationCount] || 0) * m.val)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Cuadro de Cuadre del Sistema vs Conteo Físico */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-700" />
                Resumen de Cuadre de Caja
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Fondo Inicial:</span>
                  <span className="text-sm font-bold text-slate-900">{formatMoney(activeShift.initialCash)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">+ Ventas Efectivo:</span>
                  <span className="text-sm font-bold text-emerald-700">{formatMoney(activeShift.systemCashSales)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">= Efectivo Esperado:</span>
                  <span className="text-sm font-bold text-cyan-800">{formatMoney(expectedCash)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Conteo Real:</span>
                  <span className="text-base font-black text-slate-900">{formatMoney(totalCashCounted)}</span>
                </div>
              </div>

              {/* Indicador de Diferencia */}
              <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
                cashDifference === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : cashDifference > 0
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {cashDifference === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {cashDifference === 0 ? '¡Caja Cuadrada Perfectamente!' : (cashDifference > 0 ? 'Sobrante de Efectivo' : 'Faltante de Efectivo')}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {cashDifference === 0 ? 'El dinero contado coincide al 100% con las ventas del sistema.' : 'Revisar vouchers y monedas antes de cerrar turno.'}
                    </span>
                  </div>
                </div>

                <span className="text-lg font-black font-mono">
                  {cashDifference >= 0 ? '+' : ''}{formatMoney(cashDifference)}
                </span>
              </div>

              {/* Otras Formas de Pago */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Ventas Tarjeta POS:</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(activeShift.systemCardSales)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Ventas Yape / Plin:</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(activeShift.systemYapePlinSales)}</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveAudit}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm"
              >
                <Calculator className="w-4 h-4 text-cyan-700" />
                <span>Guardar Arqueo Parcial (Corte X)</span>
              </button>

              <button
                onClick={handleCloseShift}
                disabled={isConfirmingClose}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno Definitivo (Corte Z)</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: HISTORIAL DE TURNOS */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in">
            {shiftHistory.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900 mb-1">No hay cierres anteriores registrados hoy</h4>
                <p className="text-xs text-slate-500">Al cerrar un turno definitivo (Corte Z), quedará archivado aquí para auditoría.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shiftHistory.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{s.shiftName}</h4>
                        <span className="text-[10px] text-slate-500">({s.openedAt} - {s.closedAt})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Cerrado por: <strong className="text-slate-900">{s.closedBy}</strong> • Total Ventas: <span className="font-bold text-emerald-700">{formatMoney(s.systemTotalSales)}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Diferencia de Caja:</span>
                      <span className={`font-mono font-bold text-sm ${
                        (s.cashDifference || 0) === 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {formatMoney(s.cashDifference || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: APERTURAR NUEVO TURNO */}
        {activeTab === 'new_shift' && (
          <div className="space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl max-w-lg mx-auto animate-in fade-in shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Aperturar Nuevo Turno de Restaurante</h4>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Turno</label>
              <input
                type="text"
                value={newShiftName}
                onChange={e => setNewShiftName(e.target.value)}
                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Fondo de Caja Inicial (S/.)</label>
              <input
                type="number"
                value={newInitialCash}
                onChange={e => setNewInitialCash(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-cyan-600"
              />
            </div>

            <button
              onClick={handleCreateNewShift}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25"
            >
              Confirmar y Abrir Turno
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
