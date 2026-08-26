'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  QrCode, 
  CheckCircle2, 
  CreditCard, 
  Coins, 
  Truck, 
  Store,
  Sparkles
} from 'lucide-react';
import { OrderPaymentMethod } from '@/types/restaurant';

interface PublicCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicCartDrawer({ isOpen, onClose }: PublicCartDrawerProps) {
  const { cart, removeFromCart, updateCartQuantity, submitOnlineOrder, restaurant } = useRestaurant();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'takeout'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('yape_plin');
  const [orderConfirmed, setOrderConfirmed] = useState<any>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = deliveryType === 'delivery' && subtotal > 0 ? 8.00 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      alert('Por favor ingresa tu nombre y teléfono de contacto');
      return;
    }
    if (deliveryType === 'delivery' && !address) {
      alert('Por favor ingresa la dirección de entrega');
      return;
    }

    const newOrder = submitOnlineOrder({
      customerName,
      customerPhone,
      customerDoc,
      deliveryType,
      address,
      paymentMethod,
      notes
    });

    setOrderConfirmed(newOrder);
  };

  const handleReset = () => {
    setOrderConfirmed(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#071322] border-l border-white/15 text-white shadow-2xl flex flex-col justify-between">
          
          {/* Cabecera */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tu Bolsa de Pedido</h3>
                <p className="text-[11px] text-slate-400">
                  {cart.reduce((acc, it) => acc + it.quantity, 0)} {cart.length === 1 ? 'producto' : 'productos'} seleccionados
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido Principal */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {orderConfirmed ? (
              <div className="text-center py-10 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-white mb-1">¡Pedido Recibido!</h4>
                <p className="text-xs text-slate-400 mb-6">
                  Tu orden <strong className="text-amber-400">{orderConfirmed.code}</strong> ya fue enviada a la cocina de <strong className="text-white">{restaurant.name}</strong>.
                </p>

                {/* Voucher Resumen */}
                <div className="bg-black/40 border border-white/15 p-4 rounded-2xl text-left text-xs mb-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente:</span>
                    <span className="font-bold text-white">{orderConfirmed.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo de Entrega:</span>
                    <span className="font-bold text-cyan-300 uppercase">{orderConfirmed.orderType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Método de Pago:</span>
                    <span className="font-bold text-amber-300 uppercase">{orderConfirmed.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                    <span className="font-bold text-white">Total a Pagar:</span>
                    <span className="font-black text-amber-400">{formatMoney(orderConfirmed.total)}</span>
                  </div>
                </div>

                {orderConfirmed.paymentMethod === 'yape_plin' && (
                  <div className="bg-white p-4 rounded-2xl text-slate-950 mb-6 flex flex-col items-center">
                    <QrCode className="w-24 h-24 mb-2" />
                    <p className="text-xs font-bold">Escanea con Yape o Plin</p>
                    <p className="text-[10px] text-slate-600">A nombre de: ÉTERRA GASTRONOMÍA SAC</p>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  Entendido, volver a la carta
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Tu bolsa está vacía</h4>
                <p className="text-xs text-slate-400">Explora la carta y agrega tus platos favoritos.</p>
              </div>
            ) : (
              <>
                {/* Lista de Items */}
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex gap-3">
                      <img
                        src={item.menuItem.imageUrl}
                        alt={item.menuItem.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{item.menuItem.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Modificadores */}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="text-[10px] text-amber-300/80 mt-0.5 space-y-0.5">
                            {item.selectedModifiers.map((mod: any, i: number) => (
                              <span key={i} className="block">• {mod.optionName}</span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">Nota: "{item.notes}"</p>
                        )}

                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-xs font-black text-amber-400">{formatMoney(item.totalPrice)}</span>
                          
                          <div className="flex items-center gap-2 bg-black/40 border border-white/15 px-2 py-0.5 rounded-lg">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                updateCartQuantity(item.id, -1);
                              }}
                              className="text-xs text-white/70 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                            <button
                              onClick={() => {
                                sounds.playClick();
                                updateCartQuantity(item.id, 1);
                              }}
                              className="text-xs text-white/70 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulario de Envío & Datos */}
                <form onSubmit={handleCheckout} id="cart-form" className="space-y-4 pt-4 border-t border-white/10">
                  
                  {/* Selector Delivery vs Takeout */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                      Modalidad de Pedido
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setDeliveryType('delivery');
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          deliveryType === 'delivery'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setDeliveryType('takeout');
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          deliveryType === 'takeout'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Para Recoger</span>
                      </button>
                    </div>
                  </div>

                  {/* Campos de Contacto */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        placeholder="Tu nombre"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Celular / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+51 999 999 999"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Dirección de Entrega *</label>
                      <input
                        type="text"
                        required
                        placeholder="Calle, número, dpto o referencia"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {/* Método de Pago */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                      Método de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'yape_plin', label: 'Yape / Plin', icon: QrCode },
                        { id: 'card', label: 'Tarjeta POS', icon: CreditCard },
                        { id: 'cash', label: 'Efectivo', icon: Coins }
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
                            className={`flex flex-col items-center p-2 rounded-xl border text-[10px] font-bold transition-all ${
                              isSel
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                : 'bg-white/5 border-white/10 text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4 mb-1" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </form>
              </>
            )}

          </div>

          {/* Footer de Totales y Botón Pedir */}
          {!orderConfirmed && cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-black/40 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Platos:</span>
                  <span className="font-semibold text-white">{formatMoney(subtotal)}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Costo de Envío (Delivery):</span>
                    <span className="font-semibold text-white">{formatMoney(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                  <span>Total a Pagar:</span>
                  <span className="text-amber-400">{formatMoney(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="cart-form"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Pedido Online</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
