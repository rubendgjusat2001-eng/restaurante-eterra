'use client';

import React from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney, sounds } from '@/lib/utils';
import { Sparkles, Check, Clock, ShoppingBag, ArrowRight } from 'lucide-react';

interface PublicPromotionsProps {
  onGoToReservations?: () => void;
}

export function PublicPromotions({ onGoToReservations }: PublicPromotionsProps) {
  const { promotions, addToCart, menuItems } = useRestaurant();

  const handleAddPromoToCart = (promoId: string) => {
    sounds.playClick();
    // Encontrar un plato representativo o simular combo
    const promo = promotions.find(p => p.id === promoId);
    if (!promo) return;

    // Crear un MenuItem sintético para la promoción
    const syntheticItem = {
      id: `promo-item-${promo.id}`,
      categoryId: 'cat-04',
      name: `COMBO: ${promo.title}`,
      description: promo.subtitle,
      price: promo.price,
      costPrice: promo.price * 0.35,
      imageUrl: promo.imageUrl,
      station: 'kitchen_cold' as const,
      isAvailable: true,
      isFeatured: true,
      preparationMinutes: 15,
      tags: ['Promoción', 'Combo Exclusivo']
    };

    addToCart(syntheticItem, 1, [], `Combo Promocional: ${promo.includes.join(', ')}`);
  };

  return (
    <section id="promociones-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Ofertas de Temporada</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Festivales & Experiencias
        </h2>
        <p className="text-sm sm:text-base text-slate-400">
          Disfruta de nuestras mejores creaciones marinas con descuentos exclusivos al reservar o pedir en línea.
        </p>
      </div>

      {/* Grid de Promociones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {promotions.map(promo => (
          <div key={promo.id} className="bezel-container">
            <div className="bezel-core p-6 sm:p-8 flex flex-col justify-between h-full relative overflow-hidden">
              
              {/* Badge de Descuento Flotante */}
              <div className="absolute top-6 right-6 z-10 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-rose-500/20">
                {promo.badge}
              </div>

              <div>
                {/* Imagen del Combo */}
                <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6 bg-black/40">
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Válido hasta: {promo.validUntil}
                    </span>
                  </div>
                </div>

                {/* Título & Subtítulo */}
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                  {promo.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-amber-300 mb-4">
                  {promo.subtitle}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-normal">
                  {promo.description}
                </p>

                {/* Lista de Inclusiones */}
                <div className="space-y-2 mb-8 bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Esta experiencia incluye:
                  </span>
                  {promo.includes.map((inc, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Precios & Acciones */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 line-through font-semibold">
                      {formatMoney(promo.originalPrice)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                      -{promo.discountPercent}%
                    </span>
                  </div>
                  <span className="text-2xl font-black text-amber-400 block">
                    {formatMoney(promo.price)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddPromoToCart(promo.id)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Pedir Promo Online</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
