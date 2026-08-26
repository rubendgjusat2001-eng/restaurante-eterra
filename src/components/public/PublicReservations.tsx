'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Reservation } from '@/types/restaurant';
import { sounds, formatMoney } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Share2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export function PublicReservations() {
  const { restaurant, createReservation } = useRestaurant();

  // Estados del Formulario
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<'lunch' | 'dinner'>('lunch');
  const [selectedTime, setSelectedTime] = useState<string>('13:30');
  const [partySize, setPartySize] = useState<number>(2);
  const [zonePreference, setZonePreference] = useState<string>('Terraza Marina');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // Reserva Confirmada
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  const lunchSlots = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
  const dinnerSlots = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

  const handleNextStep = () => {
    sounds.playClick();
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      if (!customerName || !customerPhone) {
        alert('Por favor ingresa tu nombre y número de WhatsApp');
        return;
      }
      // Crear reserva
      const res = createReservation({
        customerName,
        customerPhone,
        customerEmail: customerEmail || 'cliente@eterra.pe',
        partySize,
        reservationDate: selectedDate,
        reservationTime: selectedTime,
        zonePreference,
        specialRequests,
        depositAmount
      });
      setConfirmedReservation(res);
      setStep(4);
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setStep(1);
    setConfirmedReservation(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSpecialRequests('');
  };

  return (
    <section id="reservas-section" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
          <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Experiencias & Mesas Exclusivas</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Reserva en {restaurant.name}
        </h2>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Asegura tu mesa con fecha y hora de anticipación. Confirmación instantánea y recordatorio vía WhatsApp.
        </p>
      </div>

      {/* Container de la Reserva */}
      <div className="bezel-container max-w-3xl mx-auto">
        <div className="bezel-core p-6 sm:p-10">

          {/* Stepper Indicator */}
          {step < 4 && (
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
              {[
                { num: 1, label: 'Fecha y Hora' },
                { num: 2, label: 'Mesa y Zona' },
                { num: 3, label: 'Tus Datos' }
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      step === s.num
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                        : step > s.num
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/5 text-slate-500 border border-white/10'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-white' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* PASO 1: Fecha, Turno y Horario */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Selector de Fecha */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  1. Selecciona la Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Selector de Turno */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  2. Turno del Servicio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedShift('lunch');
                      setSelectedTime('13:30');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedShift === 'lunch'
                        ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl mb-1 block">☀️</span>
                    <h4 className="text-sm font-bold text-white">Almuerzo Marino</h4>
                    <p className="text-xs text-slate-400 mt-1">12:00 PM – 4:30 PM</p>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedShift('dinner');
                      setSelectedTime('20:00');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedShift === 'dinner'
                        ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl mb-1 block">🌙</span>
                    <h4 className="text-sm font-bold text-white">Cena & Coctelería</h4>
                    <p className="text-xs text-slate-400 mt-1">7:00 PM – 11:30 PM</p>
                  </button>
                </div>
              </div>

              {/* Slots de Hora */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  3. Hora Exacta
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(selectedShift === 'lunch' ? lunchSlots : dinnerSlots).map(slot => (
                    <button
                      key={slot}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedTime(slot);
                      }}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        selectedTime === slot
                          ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <span>Continuar a Selección de Mesa</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Personas y Zona */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Comensales */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  1. Número de Personas
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        sounds.playClick();
                        setPartySize(num);
                      }}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        partySize === num
                          ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {num} {num === 1 ? 'pers.' : 'pers.'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona Preferida */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  2. Zona o Salón Preferido
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'Terraza Marina', title: 'Terraza Marina al Aire Libre', desc: 'Brisa fresca, ambiente relajado con vista panorámica' },
                    { id: 'Principal', title: 'Salón Principal Climatizado', desc: 'Música ambiental suave, mesas espaciosas y confort' },
                    { id: 'Zona VIP', title: 'Zona VIP Privada', desc: 'Para celebraciones especiales y reuniones ejecutivas' },
                    { id: 'Barra', title: 'Barra Sensorial & Cevichería', desc: 'Experiencia directa frente al Chef y Barman' }
                  ].map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        sounds.playClick();
                        setZonePreference(zone.id);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        zonePreference === zone.id
                          ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-500/30'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-white mb-1">{zone.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{zone.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Peticiones Especiales */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  3. Peticiones especiales o motivo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aniversario, cumpleaños, silla para bebé, alérgico a crustáceos..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>

                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <span>Continuar a Datos de Contacto</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Datos de Contacto & Confirmación */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos Santisteban"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+51 987 654 321"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Correo Electrónico (Opcional para voucher)</label>
                <input
                  type="email"
                  placeholder="ejemplo@gmail.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Resumen de la Reserva */}
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Resumen de tu Reserva
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fecha:</span>
                    <span className="font-bold text-white">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hora:</span>
                    <span className="font-bold text-white">{selectedTime} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Comensales:</span>
                    <span className="font-bold text-white">{partySize} personas</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Zona:</span>
                    <span className="font-bold text-white">{zonePreference}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>

                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Reserva Gratis</span>
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Ticket Digital Confirmado */}
          {step === 4 && confirmedReservation && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-400">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                ¡Reserva Confirmada!
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Te esperamos en <strong className="text-white">{restaurant.name}</strong>. Hemos enviado los detalles a tu WhatsApp.
              </p>

              {/* Ticket Visual */}
              <div className="max-w-md mx-auto bg-[#040d1a] border-2 border-dashed border-amber-500/40 p-6 rounded-3xl text-left shadow-2xl relative mb-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pase de Mesa</span>
                    <h4 className="text-lg font-black text-white">{restaurant.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Código:</span>
                    <span className="font-mono font-bold text-sm text-cyan-400">{confirmedReservation.code}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Titular:</span>
                    <span className="font-bold text-white truncate block">{confirmedReservation.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fecha & Hora:</span>
                    <span className="font-bold text-amber-300">{confirmedReservation.reservationDate} - {confirmedReservation.reservationTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Comensales:</span>
                    <span className="font-bold text-white">{confirmedReservation.partySize} personas</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ubicación:</span>
                    <span className="font-bold text-cyan-300">{confirmedReservation.zonePreference}</span>
                  </div>
                </div>

                {/* QR Code Simulado */}
                <div className="flex items-center justify-center p-3 bg-white rounded-2xl text-slate-950 gap-3">
                  <QrCode className="w-12 h-12 shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-bold">Presentar al llegar a Recepción</p>
                    <p className="text-[9px] text-slate-600">Check-in automático en POS</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
              >
                Hacer otra reserva
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
