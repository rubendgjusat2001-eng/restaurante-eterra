'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { GASTRO_THEMES } from '@/lib/constants';
import { GastroThemePreset, UserRole } from '@/types/restaurant';
import { 
  Settings, 
  X, 
  Building2, 
  Palette, 
  Lock, 
  Users, 
  Trash2, 
  Plus, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { sounds, formatMoney } from '@/lib/utils';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemSettingsModal({ isOpen, onClose }: SystemSettingsModalProps) {
  const { 
    restaurant, 
    updateRestaurantInfo, 
    setThemePreset, 
    staff, 
    addStaffUser, 
    deleteStaffUser, 
    updateUserPin, 
    updateOwnerPassword, 
    purgeAllDataToZero, 
    showToast 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'restaurant' | 'themes' | 'security' | 'staff' | 'danger'>('restaurant');

  // Formulario Datos Restaurante
  const [name, setName] = useState(restaurant.name);
  const [slogan, setSlogan] = useState(restaurant.slogan);
  const [phone, setPhone] = useState(restaurant.phone);
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp);
  const [address, setAddress] = useState(restaurant.address);
  const [lunchHours, setLunchHours] = useState(restaurant.openingHours.lunch);
  const [dinnerHours, setDinnerHours] = useState(restaurant.openingHours.dinner);

  // Formulario Contraseña Owner
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Formulario Nuevo Personal
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('waiter');
  const [staffPin, setStaffPin] = useState('');

  if (!isOpen) return null;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantInfo({
      name,
      slogan,
      phone,
      whatsapp,
      address,
      openingHours: {
        ...restaurant.openingHours,
        lunch: lunchHours,
        dinner: dinnerHours
      }
    });
    sounds.playClick();
    showToast('success', 'Datos del restaurante guardados');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast('error', 'La nueva contraseña y la confirmación no coinciden');
      sounds.playAlert();
      return;
    }
    const success = await updateOwnerPassword(currentPass, newPass);
    if (success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffPin.trim() || staffPin.length < 4) {
      showToast('error', 'Ingrese el nombre y un PIN de 4 dígitos');
      sounds.playAlert();
      return;
    }
    addStaffUser({
      name: staffName.trim(),
      role: staffRole,
      pin: staffPin.trim()
    });
    setStaffName('');
    setStaffPin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Centro de Configuración & Ajustes del Sistema
              </h3>
              <p className="text-xs text-slate-500">
                Configuración maestra exclusiva para el Propietario (Owner)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación de Ajustes */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl my-4 text-xs overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'restaurant' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Datos del Local</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'themes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            <span>Estética & Paleta de Color</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-700" />
            <span>Personal & PINs ({staff.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'security' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Contraseña & Seguridad</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'danger' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zona de Reinicio a 0</span>
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {/* TAB 1: DATOS DEL RESTAURANTE */}
          {activeTab === 'restaurant' && (
            <form onSubmit={handleSaveInfo} className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 font-semibold focus:border-cyan-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan de Marca</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono Principal</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Reservas</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dirección del Local</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Horario de Cena</label>
                  <input
                    type="text"
                    value={dinnerHours}
                    onChange={e => setDinnerHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios de Local</span>
              </button>
            </form>
          )}

          {/* TAB 2: TEMAS & ESTÉTICA GASTRONÓMICA */}
          {activeTab === 'themes' && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-600">
                Selecciona la paleta de colores acorde al concepto de tu restaurante. Se aplicará instantáneamente en toda la aplicación:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(GASTRO_THEMES) as GastroThemePreset[]).filter(k => k !== 'custom').map(key => {
                  const theme = GASTRO_THEMES[key];
                  const isSelected = restaurant.themePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setThemePreset(key)}
                      className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50/70 border-cyan-600 ring-2 ring-cyan-500/30 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{theme.icon}</span>
                        <h4 className="text-xs font-bold text-slate-900">{theme.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">{theme.description}</p>
                      
                      {/* Swatches de Color */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.colors.primary }} title="Primario" />
                        <span className="w-5 h-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.colors.accent }} title="Acento" />
                        <span className="w-5 h-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.colors.secondary }} title="Secundario" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PERSONAL & PINS */}
          {activeTab === 'staff' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Formulario Registro */}
              <form onSubmit={handleAddStaffSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej: Mateo Morales"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rol / Puesto</label>
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="waiter">Mozo (Salón & Comandero)</option>
                    <option value="cashier">Cajero (Cobros & Turno)</option>
                    <option value="waiter_cashier">Mozo & Cajero (Híbrido)</option>
                    <option value="kitchen">Cocinero (KDS Cocina)</option>
                    <option value="bar">Bartender (KDS Bar)</option>
                    <option value="manager">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">PIN (4 Dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Ej: 4444"
                    value={staffPin}
                    onChange={e => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 font-mono tracking-widest focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Colaborador</span>
                </button>
              </form>

              {/* Lista de Personal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {staff.map(member => {
                  const isOwner = member.role === 'owner';
                  return (
                    <div key={member.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{member.avatar || '👤'}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-100 text-cyan-800">
                            {member.role === 'owner' ? 'Propietario' : member.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newPin = prompt(`Nuevo PIN de 4 dígitos para ${member.name}:`, member.pin);
                            if (newPin && newPin.trim().length === 4) {
                              updateUserPin(member.id, newPin.trim());
                            } else if (newPin) {
                              showToast('error', 'El PIN debe tener 4 dígitos');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Modificar PIN"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        {!isOwner && (
                          <button
                            onClick={() => deleteStaffUser(member.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Eliminar personal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SEGURIDAD & CONTRASEÑA OWNER */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="max-w-md space-y-4 animate-in fade-in">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Esta contraseña protege el acceso principal de Propietario al sistema.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña Actual del Owner</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nueva Contraseña Segura</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres con letras y números"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repita la nueva contraseña"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:border-cyan-600 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Actualizar Contraseña de Propietario</span>
              </button>
            </form>
          )}

          {/* TAB 5: ZONA DE REINICIO A 0 */}
          {activeTab === 'danger' && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-950">Reinicio Maestro de Datos a Cero (0)</h4>
                  <p className="text-xs text-rose-700">
                    Borra todas las mesas, órdenes y platos tanto en la base de datos de la nube como en la memoria del navegador.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Esta acción se utiliza para preparar el sistema antes de entregarlo formalmente al cliente para su configuración desde cero.
              </p>

              <button
                onClick={async () => {
                  if (confirm('¿Estás 100% seguro de que deseas purgar y reiniciar todas las mesas, órdenes y platos a 0?')) {
                    await purgeAllDataToZero();
                    onClose();
                  }
                }}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ejecutar Purga Total a 0</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
