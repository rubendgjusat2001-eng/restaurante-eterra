'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { MapPin, Phone, Mail, Clock, Lock, Instagram, Facebook } from 'lucide-react';
import { sounds } from '@/lib/utils';

interface PublicFooterProps {
  onGoToInternal: () => void;
}

export function PublicFooter({ onGoToInternal }: PublicFooterProps) {
  const { restaurant } = useRestaurant();

  return (
    <footer className="border-t border-white/10 bg-[#02070f] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Col 1: Marca & Concepto */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              É
            </div>
            <div>
              <h3 className="text-xl font-black tracking-wider uppercase">{restaurant.name}</h3>
              <p className="text-xs text-amber-400 font-semibold">{restaurant.slogan}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            {restaurant.story}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <a href="#" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Col 2: Horarios */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Horarios de Atención
          </h4>
          <div className="text-xs text-slate-300 space-y-2">
            <div>
              <span className="text-slate-400 block text-[10px]">Días de Servicio:</span>
              <span className="font-semibold">{restaurant.openingHours.days}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Almuerzo:</span>
              <span className="font-semibold">{restaurant.openingHours.lunch}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Cena & Bar:</span>
              <span className="font-semibold">{restaurant.openingHours.dinner}</span>
            </div>
          </div>
        </div>

        {/* Col 3: Ubicación y Contacto */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Contacto & Reservas
          </h4>
          <div className="text-xs text-slate-300 space-y-2">
            <p className="leading-snug">{restaurant.address}, {restaurant.city}</p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{restaurant.phone}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{restaurant.email}</span>
            </p>
          </div>
        </div>

      </div>

      {/* Barra Inferior */}
      <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
        <p>© 2026 {restaurant.name} Gastro Group. Todos los derechos reservados.</p>
        
        {/* Acceso Seguro al Sistema Interno */}
        <button
          onClick={() => {
            sounds.playClick();
            onGoToInternal();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 border border-white/10 transition-colors"
        >
          <Lock className="w-3 h-3" />
          <span>Acceso Personal POS / KDS / Caja</span>
        </button>
      </div>
    </footer>
  );
}
