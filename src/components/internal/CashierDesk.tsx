'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Table, Order, OrderPaymentMethod, InvoiceType, StaffUser } from '@/types/restaurant';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  Receipt, 
  CreditCard, 
  Coins, 
  QrCode, 
  Users, 
  Scissors, 
  Printer, 
  CheckCircle2, 
  X, 
  UserCheck, 
  Calculator,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function CashierDesk() {
  const { 
    tables, 
    orders, 
    processTablePayment, 
    restaurant,
    currentUser,
    staff 
  } = useRestaurant();

  // Mesa seleccionada para cobro
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Cajero que procesa la transacción
  const [activeCashier, setActiveCashier] = useState<StaffUser>(
    currentUser || staff.find(s => s.role.includes('cashier')) || staff[0]
  );

  // Estados de cobro
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('boleta');
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('card');
  const [customerDoc, setCustomerDoc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  
  // Calculadora de Efectivo
  const [cashReceived, setCashReceived] = useState<string>('');

  // Modal de División de Cuentas (Split Bill)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitPersons, setSplitPersons] = useState<number>(2);

  // Comprobante emitido
  const [printedReceipt, setPrintedReceipt] = useState<Order | null>(null);

  // Mesas activas que tienen comanda
  const activeTables = tables.filter(t => t.status !== 'available' && t.currentOrderId);

  // Si no hay mesa seleccionada, preseleccionar la primera que pidió cuenta
  const currentTable = selectedTableId 
    ? tables.find(t => t.id === selectedTableId) 
    : (activeTables.find(t => t.status === 'bill_requested') || activeTables[0]);

  const currentOrder = currentTable ? orders.find(o => o.id === currentTable.currentOrderId) : null;

  const subtotal = currentOrder ? currentOrder.subtotal : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + tipAmount);
  const cashNum = parseFloat(cashReceived) || 0;
  const cashChange = Math.max(0, cashNum - grandTotal);

  const handleExecutePayment = () => {
    if (!currentTable) return;

    if (invoiceType === 'factura' && (!customerDoc || customerDoc.length !== 11)) {
      alert('Para Factura Electrónica debes ingresar un RUC válido de 11 dígitos.');
      return;
    }

    const orderRes = processTablePayment(
      currentTable.id,
      paymentMethod,
      invoiceType,
      {
        customerDoc,
        customerName: customerName || (invoiceType === 'factura' ? 'CLIENTE CON RUC' : 'CLIENTE VARIOS'),
        tip: tipAmount,
        discount: discountAmount,
        paidAmount: grandTotal
      }
    );

    if (orderRes) {
      setPrintedReceipt(orderRes);
      setSelectedTableId(null);
      setCustomerDoc('');
      setCustomerName('');
      setCashReceived('');
      setTipAmount(0);
      setDiscountAmount(0);
    }
  };

  return (
    <div className="py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">
      
      {/* Barra de Control de Caja & Cajero Activo */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Módulo de Cobro & Facturación Electrónica</h3>
            <p className="text-xs text-slate-500">Emisión directa de comprobantes de pago y cierre de mesas.</p>
          </div>
        </div>

        {/* Selector Rápido de Cajero en Turno */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">Cajero Responsable:</span>
          <select
            value={activeCashier.id}
            onChange={e => {
              const selected = staff.find(s => s.id === e.target.value);
              if (selected) setActiveCashier(selected);
            }}
            className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 focus:outline-none focus:border-cyan-600"
          >
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.avatar} {s.name} ({s.role === 'owner' ? 'Owner' : s.role === 'waiter_cashier' ? 'Mozo-Caja' : s.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA: Mesas por Cobrar (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Mesas Pendientes de Pago ({activeTables.length})
            </h4>
          </div>

          {activeTables.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No hay cuentas pendientes de cobro.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
              {activeTables.map(tbl => {
                const ord = orders.find(o => o.id === tbl.currentOrderId);
                const isSelected = currentTable?.id === tbl.id;
                const isBillReq = tbl.status === 'bill_requested';
                const waiter = tbl.openedByUserName || tbl.assignedWaiterName || ord?.waiterName || 'Personal';

                return (
                  <button
                    key={tbl.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedTableId(tbl.id);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-50/70 border-cyan-600 ring-2 ring-cyan-500/20 shadow-xs'
                        : isBillReq
                        ? 'bg-cyan-50/30 border-cyan-300 hover:border-cyan-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-xs font-mono">
                          {tbl.number}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{tbl.zone}</h5>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Mozo: <strong className="text-slate-700">{waiter}</strong> • {tbl.seatedAt || '13:00'}
                          </span>
                        </div>
                      </div>

                      {isBillReq && (
                        <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse">
                          Pre-cuenta
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[10px]">
                        {tbl.customerCount || 2} comensales
                      </span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {formatMoney(ord?.subtotal || 0)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Terminal de Cobro & Facturación (8 Cols) */}
        <div className="lg:col-span-8">
          {currentTable && currentOrder ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
              
              {/* Header de la Mesa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">{currentTable.number}</span>
                    <span className="text-xs text-slate-500">({currentTable.zone})</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 font-mono">
                      {currentOrder.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atendido inicialmente por: <strong className="text-slate-900">{currentTable.openedByUserName || currentOrder.waiterName}</strong> • Ingreso: <span className="font-mono text-slate-700">{currentTable.seatedAt || '13:00'}</span>
                  </p>
                </div>

                {/* Botón División de Cuenta */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsSplitModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Dividir Cuenta (Split)</span>
                </button>
              </div>

              {/* Desglose de Platos de la Mesa */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg max-h-40 overflow-y-auto space-y-1.5">
                {currentOrder.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-800 font-mono">{item.quantity}x</span>
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatMoney(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Formulario de Facturación & Cobro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Tipo de Comprobante SUNAT */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    1. Comprobante de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'boleta', label: 'Boleta' },
                      { id: 'factura', label: 'Factura' },
                      { id: 'ticket', label: 'Ticket' }
                    ].map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setInvoiceType(doc.id as InvoiceType);
                        }}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          invoiceType === doc.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        {doc.label}
                      </button>
                    ))}
                  </div>

                  {/* Campos según Boleta o Factura */}
                  {invoiceType === 'factura' ? (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-cyan-900 block mb-0.5">RUC (11 Dígitos) *</label>
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="20601234567"
                          value={customerDoc}
                          onChange={e => setCustomerDoc(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Razón Social *</label>
                        <input
                          type="text"
                          placeholder="CORPORACIÓN GASTRONÓMICA SAC"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">DNI (Opcional)</label>
                          <input
                            type="text"
                            maxLength={8}
                            placeholder="72849102"
                            value={customerDoc}
                            onChange={e => setCustomerDoc(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nombre Cliente</label>
                          <input
                            type="text"
                            placeholder="Cliente Varios"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Método de Pago */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    2. Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'card', label: 'Tarjeta POS', icon: CreditCard },
                      { id: 'yape_plin', label: 'Yape / Plin', icon: QrCode },
                      { id: 'cash', label: 'Efectivo', icon: Coins },
                      { id: 'split', label: 'Pago Mixto', icon: Calculator }
                    ].map(m => {
                      const Icon = m.icon;
                      const isSel = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setPaymentMethod(m.id as OrderPaymentMethod);
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                            isSel
                              ? 'bg-cyan-50 border-cyan-600 text-cyan-950 font-bold ring-1 ring-cyan-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 text-cyan-700" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Calculadora de Vuelto en Efectivo */}
                  {paymentMethod === 'cash' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-amber-900">Efectivo Recibido (S/.):</label>
                        <input
                          type="number"
                          placeholder={grandTotal.toString()}
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          className="w-24 bg-white border border-amber-300 px-2 py-0.5 rounded text-right font-mono font-bold text-slate-900 text-xs focus:outline-none"
                        />
                      </div>
                      {cashNum >= grandTotal && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                          <span className="font-bold text-slate-900">Vuelto:</span>
                          <span className="font-black text-emerald-700 font-mono">{formatMoney(cashChange)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Resumen Final de Cobro & Botón */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Subtotal: {formatMoney(subtotal)}</span>
                    <span>•</span>
                    <span>IGV 18%: {formatMoney(subtotal * 0.18)}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                    Total: {formatMoney(grandTotal)}
                  </div>
                </div>

                <button
                  onClick={handleExecutePayment}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cobrar & Dar Salida a Mesa</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl h-full min-h-[350px] flex items-center justify-center text-center p-6 shadow-sm">
              <div className="text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-slate-900 mb-0.5">Selecciona una mesa para procesar el cobro</h4>
                <p className="text-xs text-slate-500 max-w-xs">Haz clic en una mesa de la izquierda para ver su detalle de consumo.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal Split Bill (División de Cuenta) */}
      {isSplitModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-cyan-700" />
                División de Cuenta (Split Bill)
              </h3>
              <button onClick={() => setIsSplitModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Dividir en partes iguales:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      sounds.playClick();
                      setSplitPersons(n);
                    }}
                    className={`py-2 rounded-lg font-bold text-xs ${
                      splitPersons === n
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    {n} pers.
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-xs text-slate-600 block mb-0.5">Cada persona paga:</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatMoney(currentOrder.subtotal / splitPersons)}
              </span>
            </div>

            <button
              onClick={() => setIsSplitModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
            >
              Aplicar y Volver
            </button>
          </div>
        </div>
      )}

      {/* Modal Voucher Imprimible de Comprobante con Trazabilidad Completa */}
      {printedReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-white text-slate-950 p-6 rounded-2xl shadow-2xl font-mono text-xs relative border border-slate-200 space-y-3">
            <button
              onClick={() => setPrintedReceipt(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-950"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Voucher */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="text-base font-black tracking-wider uppercase">{restaurant.name}</h3>
              <p className="text-[10px] text-slate-600 font-sans">{restaurant.slogan}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{restaurant.address}</p>
              <p className="text-[10px] text-slate-500">RUC: 20608941201</p>
              <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded bg-slate-100 font-bold text-[9px] uppercase border border-slate-200">
                {printedReceipt.invoiceType === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
              </div>
              <p className="text-[10px] font-bold text-slate-700 mt-1">N° B001-{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>

            {/* Datos Cliente & Trazabilidad de Mozos y Cajero */}
            <div className="space-y-1 pb-2.5 border-b border-dashed border-slate-300 text-[11px]">
              <div><strong>Fecha/Hora:</strong> {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE')}</div>
              <div><strong>Mesa:</strong> {printedReceipt.tableNumber || 'BAR'}</div>
              <div><strong>Atendido por (Mozo):</strong> {printedReceipt.waiterName}</div>
              <div><strong>Cobrado por (Cajero):</strong> {printedReceipt.closedByUserName || activeCashier.name}</div>
              <div><strong>Cliente:</strong> {printedReceipt.customerName || 'Cliente Varios'}</div>
              {printedReceipt.customerDocument && (
                <div><strong>Doc / RUC:</strong> {printedReceipt.customerDocument}</div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1 pb-2.5 border-b border-dashed border-slate-300 text-[11px]">
              {printedReceipt.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-bold">{formatMoney(it.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="space-y-0.5 text-right text-xs">
              <div>Subtotal: {formatMoney(printedReceipt.subtotal)}</div>
              <div>IGV (18%): {formatMoney(printedReceipt.subtotal * 0.18)}</div>
              {printedReceipt.tip > 0 && <div>Propina: {formatMoney(printedReceipt.tip)}</div>}
              <div className="text-sm font-black pt-1 border-t border-slate-300">
                TOTAL: {formatMoney(printedReceipt.total)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">Pago: {printedReceipt.paymentMethod}</div>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5 font-sans">
              <p>¡Gracias por su visita a {restaurant.name}!</p>
              <p>Representación impresa de Comprobante Electrónico</p>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                window.print();
              }}
              className="w-full py-2 rounded-lg bg-slate-900 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket Térmico</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
