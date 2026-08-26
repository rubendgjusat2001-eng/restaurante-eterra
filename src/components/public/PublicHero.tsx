'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Calendar, Utensils, Sparkles, Clock, MapPin, Award, ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/utils';

interface PublicHeroProps {
  onGoToMenu: () => void;
  onGoToReservations: () => void;
  onGoToPromos: () => void;
}

export function PublicHero({ onGoToMenu, onGoToReservations, onGoToPromos }: PublicHeroProps) {
  const { restaurant } = useRestaurant();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
      {/* Background Hero Image con Gradientes Cinematográficos */}
      <div className="absolute inset-0 z-0">
        <img
          src={restaurant.heroImageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover object-center scale-105 transform motion-safe:animate-pulse transition-transform duration-1000 opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040d1a] via-[#040d1a]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040d1a] via-transparent to-[#040d1a]/90" />
      </div>

      {/* Contenido Principal */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg shadow-amber-500/10">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Experiencia Sensorial de Vanguardia</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-6">
          <span className="block">{restaurant.name}</span>
          <span className="text-2xl sm:text-4xl md:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 block mt-2">
            {restaurant.slogan}
          </span>
        </h1>

        {/* Subtítulo / Historia */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          {restaurant.story}
        </p>

        {/* Botones de Acción (Island Architecture) */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={() => {
              sounds.playClick();
              onGoToReservations();
            }}
            className="group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-950" />
            <span>Reservar Mesa con Fecha & Hora</span>
            <div className="w-7 h-7 rounded-full bg-slate-950/15 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </div>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onGoToMenu();
            }}
            className="flex items-center gap-2.5 px-7 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm backdrop-blur-md active:scale-95 transition-all"
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <span>Ver Carta en Vivo</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onGoToPromos();
            }}
            className="flex items-center gap-2 px-6 py-4 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-sm backdrop-blur-md active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Promociones Online</span>
          </button>
        </div>

        {/* Badges de Información Rápida (Double-Bezel) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          <div className="bezel-container">
            <div className="bezel-core p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Horario Hoy</p>
                <p className="text-xs font-semibold text-white">{restaurant.openingHours.lunch} / {restaurant.openingHours.dinner}</p>
              </div>
            </div>
          </div>

          <div className="bezel-container">
            <div className="bezel-core p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Ubicación</p>
                <p className="text-xs font-semibold text-white truncate max-w-[200px]">{restaurant.address}</p>
              </div>
            </div>
          </div>

          <div className="bezel-container">
            <div className="bezel-core p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Excelencia Marina</p>
                <p className="text-xs font-semibold text-white">Pesca 100% Artesanal del Día</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
