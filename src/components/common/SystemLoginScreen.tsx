'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffUser } from '@/types/restaurant';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  Sparkles, 
  AlertCircle, 
  Globe, 
  ChefHat,
  Delete,
  CheckCircle2
} from 'lucide-react';
import { sounds } from '@/lib/utils';

interface SystemLoginScreenProps {
  onGoToPublic: () => void;
}

export function SystemLoginScreen({ onGoToPublic }: SystemLoginScreenProps) {
  const { 
    restaurant, 
    staff, 
    ownerCredentials, 
    loginWithOwnerPassword, 
    loginWithPin 
  } = useRestaurant();

  const [authMode, setAuthMode] = useState<'owner' | 'terminal'>('owner');

  // Formulario Owner
  const [identifier, setIdentifier] = useState('admin@eterra.pe');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Formulario Terminal Mozo / PIN
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(() => staff[0] || null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);
    if (!identifier.trim() || !password.trim()) {
      setOwnerError('Por favor ingrese su usuario y contraseña');
      sounds.playAlert();
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await loginWithOwnerPassword(identifier, password);
      if (!success) {
        setOwnerError('Credenciales incorrectas. Verifique su usuario o contraseña.');
      }
    } catch {
      setOwnerError('Error de conexión. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDigit = (digit: string) => {
    if (pinInput.length >= 4) return;
    sounds.playClick();
    const nextPin = pinInput + digit;
    setPinInput(nextPin);

    if (nextPin.length === 4 && selectedStaff) {
      setTimeout(() => {
        const ok = loginWithPin(nextPin, selectedStaff);
        if (!ok) {
          setPinError(true);
          setTimeout(() => setPinError(false), 600);
          setPinInput('');
        }
      }, 100);
    }
  };

  const handleDeleteDigit = () => {
    sounds.playClick();
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    sounds.playClick();
    setPinInput('');
  };

  return (
    <div className="min-h-screen w-full bg-[#050c18] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Luces de Fondo y Estética de Alta Cocina */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Barra Superior */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-black text-xl shadow-lg border border-cyan-400/30">
            É
          </div>
          <div>
            <span className="text-base font-black tracking-wider uppercase text-white">
              {restaurant.name}
            </span>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Sistema Operativo Gastronómico & POS Cloud
            </p>
          </div>
        </div>

        <button
          onClick={onGoToPublic}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Ir a Web de Clientes</span>
        </button>
      </header>

      {/* Contenedor Principal de Autenticación */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header de la Tarjeta */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Control de Acceso Seguro
            </h2>
            <p className="text-xs text-slate-400">
              Inicia sesión para acceder al sistema interno de {restaurant.name}
            </p>
          </div>

          {/* Selector de Modo: Propietario (Contraseña) vs Terminal (PIN) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                setAuthMode('owner');
                setOwnerError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'owner'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Propietario / Dueño</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setAuthMode('terminal');
                setPinInput('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'terminal'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Terminal PIN (Mozos)</span>
            </button>
          </div>

          {/* MODO 1: ACCESO PROPIETARIO (CORREO / USUARIO + CONTRASEÑA SEGURA) */}
          {authMode === 'owner' && (
            <form onSubmit={handleOwnerSubmit} className="space-y-4 animate-in fade-in duration-150">
              
              {ownerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{ownerError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="admin@eterra.pe o ruben"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span>Acceso cifrado y seguro para la administración del local</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando Credenciales...</span>
                  </span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODO 2: ACCESO TERMINAL MOZOS & COCINA (TECLADO NUMÉRICO TÁCTIL) */}
          {authMode === 'terminal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Selector de Colaborador */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-h-28 overflow-y-auto pr-1">
                {staff.map(user => {
                  const isSelected = selectedStaff?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedStaff(user);
                        setPinInput('');
                      }}
                      className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center min-w-[85px] cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{user.avatar || '👤'}</span>
                      <span className="text-[11px] font-bold truncate max-w-[75px]">{user.name.split(' ')[0]}</span>
                      <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-semibold">{user.role}</span>
                    </button>
                  );
                })}
              </div>

              {/* Display de Puntos de PIN */}
              <div className={`flex flex-col items-center justify-center ${pinError ? 'animate-bounce text-rose-400' : ''}`}>
                <span className="text-xs font-bold text-slate-300 mb-2">
                  {selectedStaff ? `Digita el PIN de ${selectedStaff.name}` : 'Selecciona un colaborador'}
                </span>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-6 py-2.5 rounded-2xl shadow-inner">
                  {[0, 1, 2, 3].map(idx => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        pinInput.length > idx
                          ? 'bg-cyan-400 shadow-md shadow-cyan-400/50 scale-110'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                {pinError && (
                  <p className="text-[10px] text-rose-400 font-bold mt-1.5">PIN incorrecto. Inténtelo de nuevo.</p>
                )}
              </div>

              {/* Teclado Numérico */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleAddDigit(num)}
                    className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 active:scale-95 text-lg font-bold text-white transition-all shadow-xs flex items-center justify-center cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClearPin}
                  className="h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 active:scale-95 text-[10px] font-bold text-rose-300 transition-all flex items-center justify-center cursor-pointer"
                >
                  BORRAR
                </button>
                <button
                  onClick={() => handleAddDigit('0')}
                  className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 active:scale-95 text-lg font-bold text-white transition-all shadow-xs flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleDeleteDigit}
                  className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer Seguro */}
      <footer className="relative z-10 text-center py-4 text-[11px] text-slate-600">
        ÉTERRA OS • Arquitectura de Seguridad Multi-Nivel y Base de Datos Sincronizada en Tiempo Real
      </footer>

    </div>
  );
}
