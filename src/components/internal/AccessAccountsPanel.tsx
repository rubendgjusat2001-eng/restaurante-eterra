'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { UserRole } from '@/types/restaurant';
import { Plus, X, KeyRound, Trash2, ShieldCheck, Power, Pencil, AlertTriangle } from 'lucide-react';
import { sounds } from '@/lib/utils';

interface AccessAccount {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role: UserRole | 'manager' | 'shift';
  active: boolean;
  must_change_password: boolean;
  created_at: string;
}

/**
 * Nivel 1: cuentas de acceso al sistema (usuario + contraseña) — distintas del
 * PIN de personal (Nivel 2). El dueño crea aquí cuentas compartidas como
 * "Turno Día" o "Turno Noche" para que el equipo de cada turno entre al
 * sistema en el dispositivo de la tienda sin usar la contraseña maestra.
 */
export function AccessAccountsPanel() {
  const { currentThemeColors, showToast } = useRestaurant();
  const primaryColor = currentThemeColors.primary || '#0284c7';

  const [accounts, setAccounts] = useState<AccessAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<string>('waiter_cashier');
  const [password, setPassword] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/accounts');
      const data = await res.json();
      if (res.ok) setAccounts(data.accounts || []);
    } catch {
      showToast('error', 'No se pudieron cargar las cuentas de acceso');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || password.length < 6) {
      showToast('error', 'Usuario, nombre y una contraseña de al menos 6 caracteres son requeridos');
      sounds.playAlert();
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), displayName: displayName.trim(), role, password })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'No se pudo crear la cuenta');
        return;
      }
      sounds.playClick();
      showToast('success', `Cuenta "${displayName}" creada correctamente`);
      setUsername('');
      setDisplayName('');
      setPassword('');
      setIsFormOpen(false);
      loadAccounts();
    } catch {
      showToast('error', 'Error de conexión al crear la cuenta');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (account: AccessAccount) => {
    setEditingId(account.id);
    setEditDisplayName(account.display_name);
    setEditUsername(account.username);
    setEditEmail(account.email || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (account: AccessAccount) => {
    if (!editDisplayName.trim() || !editUsername.trim()) {
      showToast('error', 'Nombre y usuario son requeridos');
      sounds.playAlert();
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/auth/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          username: editUsername.trim(),
          email: editEmail.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', data.error || 'No se pudo actualizar la cuenta');
        return;
      }
      sounds.playClick();
      showToast('success', 'Cuenta actualizada correctamente');
      setEditingId(null);
      loadAccounts();
    } catch {
      showToast('error', 'Error de conexión al actualizar la cuenta');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleActive = async (account: AccessAccount) => {
    try {
      const res = await fetch(`/api/auth/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !account.active })
      });
      if (!res.ok) {
        showToast('error', 'No se pudo actualizar la cuenta');
        return;
      }
      sounds.playClick();
      loadAccounts();
    } catch {
      showToast('error', 'Error de conexión');
    }
  };

  const handleDelete = async (account: AccessAccount) => {
    if (account.role === 'owner') return;
    try {
      const res = await fetch(`/api/auth/accounts/${account.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast('error', data.error || 'No se pudo eliminar la cuenta');
        return;
      }
      sounds.playClick();
      showToast('info', `Cuenta "${account.display_name}" eliminada`);
      loadAccounts();
    } catch {
      showToast('error', 'Error de conexión');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-700 mt-0.5 shrink-0" />
          <p className="text-xs text-cyan-900">
            Estas cuentas (usuario + contraseña) son las que se usan para <strong>entrar al sistema</strong>.
            El PIN de cada colaborador es distinto y solo sirve para identificar quién realiza una acción
            ya dentro del sistema.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          style={{ backgroundColor: primaryColor }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto hover:opacity-90 shrink-0"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isFormOpen ? 'Cerrar' : '+ Nueva Cuenta de Acceso'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreate} className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus className="w-4 h-4 text-slate-600" />
            Nueva Cuenta de Acceso (Ej: &quot;Turno Día&quot;, &quot;Turno Noche&quot;)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre a Mostrar</label>
              <input
                type="text"
                required
                placeholder="Ej: Turno Día"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Usuario</label>
              <input
                type="text"
                required
                placeholder="turno.dia"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rol / Permisos</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
              >
                <option value="waiter_cashier">Turno Mozo + Caja</option>
                <option value="waiter">Turno Mozo</option>
                <option value="cashier">Turno Caja</option>
                <option value="kitchen">Turno Cocina</option>
                <option value="manager">Gerente</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: primaryColor }}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-colors cursor-pointer hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Cuenta</th>
                <th className="py-3.5 px-4 sm:px-6">Usuario / Email</th>
                <th className="py-3.5 px-4 sm:px-6">Rol</th>
                <th className="py-3.5 px-4 sm:px-6">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-xs">Cargando cuentas...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-xs">No hay cuentas de acceso todavía</td></tr>
              ) : (
                accounts.map(account => (
                  editingId === account.id ? (
                    <tr key={account.id} className="bg-cyan-50/60">
                      <td className="py-3 px-4 sm:px-6" colSpan={5}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Nombre a mostrar</label>
                            <input
                              type="text"
                              value={editDisplayName}
                              onChange={e => setEditDisplayName(e.target.value)}
                              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Usuario</label>
                            <input
                              type="text"
                              value={editUsername}
                              onChange={e => setEditUsername(e.target.value)}
                              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Email (opcional)</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-medium"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={cancelEdit}
                            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveEdit(account)}
                            disabled={isSavingEdit}
                            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={account.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {account.display_name}
                          {account.must_change_password && (
                            <span
                              title="Todavía usa la contraseña provisional de fábrica"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"
                            >
                              <AlertTriangle className="w-3 h-3" /> Provisional
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-500">
                        <div className="font-mono">{account.username}</div>
                        {account.email && <div className="text-[11px] text-slate-400">{account.email}</div>}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-700 capitalize">{account.role}</td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          account.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${account.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {account.active ? 'Activa' : 'Desactivada'}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(account)}
                            className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-colors cursor-pointer"
                            title="Editar usuario / email"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {account.role !== 'owner' && (
                            <>
                              <button
                                onClick={() => toggleActive(account)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title={account.active ? 'Desactivar cuenta' : 'Activar cuenta'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(account)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Eliminar cuenta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {account.role === 'owner' && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <KeyRound className="w-3 h-3" /> Cuenta maestra
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
