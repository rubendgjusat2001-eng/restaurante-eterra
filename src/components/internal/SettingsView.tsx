'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { GastroThemePreset } from '@/types/restaurant';
import { GASTRO_THEMES } from '@/lib/constants';
import { 
  Building2, 
  Palette, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  Check, 
  ChevronRight,
  KeyRound
} from 'lucide-react';
import { sounds } from '@/lib/utils';

export function SettingsView() {
  const { 
    restaurant, 
    currentThemeColors,
    updateRestaurantInfo, 
    setThemePreset, 
    updateOwnerPassword, 
    purgeAllDataToZero, 
    showToast 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'info' | 'theme' | 'security' | 'maintenance'>('info');

  const primaryColor = currentThemeColors.primary || '#0284c7';
  const primaryHover = currentThemeColors.primaryHover || '#0369a1';
  const accentColor = currentThemeColors.accent || '#d97706';

  // Form Info
  const [name, setName] = useState(restaurant.name);
  const [slogan, setSlogan] = useState(restaurant.slogan);
  const [phone, setPhone] = useState(restaurant.phone);
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp);
  const [email, setEmail] = useState(restaurant.email);
  const [address, setAddress] = useState(restaurant.address);
  const [city, setCity] = useState(restaurant.city);
  const [currency, setCurrency] = useState(restaurant.currency || 'PEN');
  const [story, setStory] = useState(restaurant.story);
  const [lunchHours, setLunchHours] = useState(restaurant.openingHours.lunch);
  const [dinnerHours, setDinnerHours] = useState(restaurant.openingHours.dinner);

  // Form Seguridad Owner
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantInfo({
      name,
      slogan,
      phone,
      whatsapp,
      email,
      address,
      city,
      currency,
      story,
      openingHours: {
        ...restaurant.openingHours,
        lunch: lunchHours,
        dinner: dinnerHours
      }
    });
    showToast('success', 'Configuración del restaurante guardada con éxito');
    sounds.playClick();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      showToast('error', 'La nueva contraseña debe tener al menos 6 caracteres');
      sounds.playAlert();
      return;
    }
    if (newPass !== confirmPass) {
      showToast('error', 'Las contraseñas no coinciden');
      sounds.playAlert();
      return;
    }

    const ok = updateOwnerPassword(currentPass, newPass);
    if (ok) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumb Superior */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Inicio</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">Configuración General</span>
      </div>

      {/* 2. Pestañas de Configuración */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'info', label: 'Datos del Local & Web', icon: Building2 },
          { id: 'theme', label: 'Estética & Paleta del Sistema', icon: Palette },
          { id: 'security', label: 'Seguridad & Clave Owner', icon: ShieldCheck },
          { id: 'maintenance', label: 'Zona de Mantenimiento', icon: RotateCcw },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={isActive ? { backgroundColor: primaryColor, color: '#ffffff', boxShadow: `0 4px 12px ${primaryColor}30` } : {}}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? ''
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Contenido de las Pestañas */}
      
      {/* PESTAÑA 1: DATOS DEL LOCAL & WEB */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveInfo} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900">Identidad Comercial & Contacto</h3>
            <p className="text-xs text-slate-500 mt-0.5">Estos datos se sincronizan con las boletas de caja y con la web pública de clientes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan Principal</label>
              <input
                type="text"
                value={slogan}
                onChange={e => setSlogan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Historia / Filosofía Gastronómica</label>
            <textarea
              rows={3}
              value={story}
              onChange={e => setStory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono Principal</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp de Reservas</label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Dirección del Local</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ciudad / País</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Horario de Almuerzo</label>
              <input
                type="text"
                value={lunchHours}
                onChange={e => setLunchHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Horario de Cena</label>
              <input
                type="text"
                value={dinnerHours}
                onChange={e => setDinnerHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:opacity-90"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      )}

      {/* PESTAÑA 2: ESTÉTICA & PALETA DEL SISTEMA */}
      {activeTab === 'theme' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900">Paleta de Color del Sistema Privado</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza en tiempo real los tonos, acentos y ambientación del sistema interno según el rubro de tu restaurante.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.keys(GASTRO_THEMES) as GastroThemePreset[]).map(key => {
              const theme = GASTRO_THEMES[key];
              const isSelected = restaurant.themePreset === key;
              return (
                <div
                  key={key}
                  onClick={() => setThemePreset(key)}
                  style={isSelected ? {
                    borderColor: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}08`,
                    boxShadow: `0 4px 20px ${theme.colors.primary}20`
                  } : {}}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-2' 
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{theme.icon}</span>
                    {isSelected && (
                      <span 
                        style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs"
                      >
                        <Check className="w-3 h-3" /> ACTIVO
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{theme.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{theme.description}</p>
                  
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: theme.colors.primary }} />
                    <div className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: theme.colors.accent }} />
                    <span className="text-[10px] font-mono text-slate-400">Tokens CSS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: SEGURIDAD OWNER */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-xl animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900">Seguridad & Contraseña Maestra</h3>
            <p className="text-xs text-slate-500 mt-0.5">Esta contraseña es exclusiva para el Propietario (Dueño) y protege los accesos críticos.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña Actual</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nueva Contraseña</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repita la nueva contraseña"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:opacity-90"
            >
              <KeyRound className="w-4 h-4" />
              <span>Actualizar Contraseña Maestra</span>
            </button>
          </div>
        </form>
      )}

      {/* PESTAÑA 4: MANTENIMIENTO */}
      {activeTab === 'maintenance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-2xl animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <span>Zona de Puesta en Cero (Clean Slate)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Esta acción eliminará todas las órdenes de prueba y mesas creadas, dejando el sistema limpio para que el cliente configure su restaurante desde cero.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <p className="font-bold">⚠️ Advertencia de Seguridad:</p>
            <p>Se reiniciarán mesas, comandas y datos de prueba. Las credenciales de usuario y configuración del restaurante se mantendrán intactas.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('¿Está seguro de reiniciar las órdenes y mesas a 0 para el inicio de operaciones?')) {
                  purgeAllDataToZero();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ejecutar Puesta en Cero (Clean Slate)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
