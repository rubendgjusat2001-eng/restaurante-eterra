'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { GASTRO_THEMES } from '@/lib/constants';
import { GastroThemePreset } from '@/types/restaurant';
import { Palette, Check, Sparkles, X, Sliders } from 'lucide-react';
import { sounds } from '@/lib/utils';

interface ThemeSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSwitcher({ isOpen, onClose }: ThemeSwitcherProps) {
  const { restaurant, setThemePreset, updateCustomTheme } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  
  const [customPrimary, setCustomPrimary] = useState(restaurant.customTheme?.primary || '#0284c7');
  const [customAccent, setCustomAccent] = useState(restaurant.customTheme?.accent || '#d97706');
  const [customBgLight, setCustomBgLight] = useState(restaurant.customTheme?.bgLight || '#f8fafc');

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    updateCustomTheme({
      primary: customPrimary,
      primaryHover: customPrimary,
      secondary: '#0f172a',
      accent: customAccent,
      bgLight: customBgLight,
      bgCard: '#ffffff',
      textMain: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Motor de Personalización de Estética Gastronómica
              <Sparkles className="w-4 h-4 text-amber-600" />
            </h3>
            <p className="text-xs text-slate-500">
              Adapta la paleta de colores y estilos del sistema al rubro de tu restaurante
            </p>
          </div>
        </div>

        {/* Pestañas Presets vs Custom */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-6">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('presets');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'presets'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paletas por Rubro Gastronómico (6 Presets)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('custom');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Personalizador a Medida
          </button>
        </div>

        {/* Presets List */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
            {(Object.entries(GASTRO_THEMES) as [GastroThemePreset, typeof GASTRO_THEMES[GastroThemePreset]][])
              .filter(([key]) => key !== 'custom')
              .map(([key, theme]) => {
                const isSelected = restaurant.themePreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setThemePreset(key);
                    }}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all shadow-sm ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-400/40'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-3xl shrink-0 p-2 rounded-2xl bg-slate-100 border border-slate-200">
                      {theme.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{theme.name}</h4>
                        {isSelected && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold border border-cyan-300">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">{theme.description}</p>
                      {/* Muestrario de Colores */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: theme.colors.primary }} title="Color Primario" />
                        <div className="w-5 h-5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: theme.colors.accent }} title="Color de Acento" />
                        <div className="w-5 h-5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: theme.colors.bgLight }} title="Fondo Principal" />
                        <span className="text-[10px] text-slate-400 ml-1">Tokens CSS</span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {/* Customizer */}
        {activeTab === 'custom' && (
          <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-6">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Color Primario (Botones principales, acentos de marca)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customPrimary}
                  onChange={e => setCustomPrimary(e.target.value)}
                  className="w-12 h-10 rounded-xl cursor-pointer bg-white border border-slate-300"
                />
                <input
                  type="text"
                  value={customPrimary}
                  onChange={e => setCustomPrimary(e.target.value)}
                  className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 flex-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Color de Acento (Badges, Ofertas, Estados destacados)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customAccent}
                  onChange={e => setCustomAccent(e.target.value)}
                  className="w-12 h-10 rounded-xl cursor-pointer bg-white border border-slate-300"
                />
                <input
                  type="text"
                  value={customAccent}
                  onChange={e => setCustomAccent(e.target.value)}
                  className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 flex-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Fondo Claro Principal (Blanco puro / Slate-50)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customBgLight}
                  onChange={e => setCustomBgLight(e.target.value)}
                  className="w-12 h-10 rounded-xl cursor-pointer bg-white border border-slate-300"
                />
                <input
                  type="text"
                  value={customBgLight}
                  onChange={e => setCustomBgLight(e.target.value)}
                  className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 flex-1"
                />
              </div>
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-md transition-all"
            >
              Guardar y Aplicar Paleta Personalizada
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Cerrar Selector
          </button>
        </div>
      </div>
    </div>
  );
}
