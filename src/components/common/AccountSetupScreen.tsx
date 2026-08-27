'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import {
  ShieldAlert,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { sounds } from '@/lib/utils';

/**
 * Pantalla de configuración obligatoria: se muestra cuando `mustChangePassword`
 * es true (cuenta todavía con la contraseña provisional de fábrica). Bloquea
 * el acceso al ERP hasta que se definan credenciales definitivas — ver
 * docs/decisions/0005-forced-account-setup.md.
 */
export function AccountSetupScreen() {
  const { currentUser, restaurant, completeAccountSetup, logoutStaff } = useRestaurant();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword.trim()) {
      setError('Ingresa la contraseña con la que acabas de iniciar sesión');
      sounds.playAlert();
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      sounds.playAlert();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      sounds.playAlert();
      return;
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser distinta a la actual');
      sounds.playAlert();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeAccountSetup({
        currentPassword,
        newPassword,
        newUsername: newUsername.trim() || undefined,
        email: email.trim() || undefined
      });
      if (!result.ok) {
        setError(result.error || 'No se pudo guardar la configuración');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050c18] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

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
              Sistema Operativo Gastronómico &amp; POS Cloud
            </p>
          </div>
        </div>

        <button
          onClick={logoutStaff}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">

          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Configura tu Cuenta
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Hola{currentUser?.name ? `, ${currentUser.name}` : ''}. Estás usando una contraseña
              provisional de fábrica. Por seguridad, define tus credenciales definitivas antes
              de continuar — esto reemplaza la contraseña de fábrica para siempre.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Contraseña actual (provisional)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1 border-t border-slate-800/80">
              <div className="space-y-1 pt-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Usuario de acceso <span className="text-slate-500 font-normal">(opcional, deja vacío para mantenerlo)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="tu.usuario"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Correo electrónico <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1 border-t border-slate-800/80">
              <div className="space-y-1 pt-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Nueva contraseña (mín. 8 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-10 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </span>
              ) : (
                <>
                  <span>Guardar y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-[11px] text-slate-600">
        ÉTERRA OS • Configuración Obligatoria de Seguridad — Primer Acceso
      </footer>
    </div>
  );
}
