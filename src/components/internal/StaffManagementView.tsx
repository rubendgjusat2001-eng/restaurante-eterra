'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffUser, UserRole } from '@/types/restaurant';
import { 
  Users, 
  Search, 
  Plus, 
  Lock, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  KeyRound, 
  ChevronRight, 
  CheckCircle2,
  X,
  Sparkles,
  Filter
} from 'lucide-react';
import { sounds } from '@/lib/utils';

export function StaffManagementView() {
  const { 
    staff, 
    addStaffUser, 
    deleteStaffUser, 
    updateUserPin, 
    showToast 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'shifts'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Formulario Nuevo Usuario
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('waiter');
  const [newStaffPin, setNewStaffPin] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      showToast('error', 'Por favor ingrese el nombre del colaborador');
      sounds.playAlert();
      return;
    }
    if (!newStaffPin.trim() || newStaffPin.trim().length !== 4) {
      showToast('error', 'El PIN debe tener exactamente 4 dígitos numéricos');
      sounds.playAlert();
      return;
    }

    addStaffUser({
      name: newStaffName.trim(),
      role: newStaffRole,
      pin: newStaffPin.trim()
    });

    setNewStaffName('');
    setNewStaffPin('');
    setIsAddFormOpen(false);
    sounds.playClick();
  };

  // Filtrado de usuarios
  const filteredStaff = staff.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.active : !user.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">👑 Dueño / Propietario</span>;
      case 'manager':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">Administrador</span>;
      case 'cashier':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Cajero</span>;
      case 'waiter':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">Mozo de Salón</span>;
      case 'kitchen':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">Cocinero (KDS)</span>;
      case 'bar':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-900 border border-pink-200">Bartender</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">Personal</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumb Superior */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Inicio</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">Personal & Roles</span>
      </div>

      {/* 2. Pestañas Superiores (Estilo Referencia Imagen 3) */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Usuarios ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Permisos de Roles
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'shifts'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Horarios de Turno
        </button>
      </div>

      {/* 3. Título de Sección + Botón de Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Personal & Usuarios
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administra las cuentas de acceso, roles y PINs de seguridad del restaurante
          </p>
        </div>

        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          {isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAddFormOpen ? 'Cerrar Formulario' : '+ Nuevo Usuario'}</span>
        </button>
      </div>

      {/* Formulario Desplegable para Crear Usuario */}
      {isAddFormOpen && (
        <form onSubmit={handleCreateUser} className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus className="w-4 h-4 text-amber-600" />
            Registrar Nuevo Colaborador
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                placeholder="Ej: Carlos Mendoza"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Puesto / Rol en el Restaurante</label>
              <select
                value={newStaffRole}
                onChange={e => setNewStaffRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="waiter">Mozo de Salón (Comandero)</option>
                <option value="cashier">Cajero (Caja & Cobros)</option>
                <option value="waiter_cashier">Mozo & Cajero (Híbrido)</option>
                <option value="kitchen">Cocinero (KDS Cocina)</option>
                <option value="bar">Bartender (KDS Bar)</option>
                <option value="manager">Administrador / Gerente</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">PIN de Seguridad (4 Dígitos)</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={newStaffPin}
                onChange={e => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono tracking-widest focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      )}

      {/* 4. Barra de Búsqueda y Filtros (Estilo Referencia Imagen 3) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        
        {/* Input Buscador */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, rol o usuario..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Chips de Filtro por Rol & Estado */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtros:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'owner', label: '👑 Dueño' },
              { id: 'manager', label: 'Admin' },
              { id: 'waiter', label: 'Mozos' },
              { id: 'cashier', label: 'Cajeros' },
              { id: 'kitchen', label: 'Cocina' },
              { id: 'bar', label: 'Bar' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setRoleFilter(chip.id)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  roleFilter === chip.id
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Tabla de Datos Profesional (Estilo Referencia Imagen 3) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Usuario</th>
                <th className="py-3.5 px-4 sm:px-6">Rol de Acceso</th>
                <th className="py-3.5 px-4 sm:px-6">Estado</th>
                <th className="py-3.5 px-4 sm:px-6">PIN de Acceso</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs">No se encontraron usuarios</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const isOwner = member.role === 'owner';
                  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Columna Usuario */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{member.name}</div>
                            <div className="text-[11px] text-slate-400">@{member.name.toLowerCase().replace(/\s+/g, '')}</div>
                          </div>
                        </div>
                      </td>

                      {/* Columna Rol */}
                      <td className="py-4 px-4 sm:px-6">
                        {getRoleBadge(member.role)}
                      </td>

                      {/* Columna Estado */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      </td>

                      {/* Columna PIN */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          ****
                        </span>
                      </td>

                      {/* Columna Acciones */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const newPin = prompt(`Ingrese el nuevo PIN de 4 dígitos para ${member.name}:`, member.pin);
                              if (newPin && newPin.trim().length === 4) {
                                updateUserPin(member.id, newPin.trim());
                              } else if (newPin) {
                                showToast('error', 'El PIN debe tener exactamente 4 dígitos numéricos');
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            title="Cambiar PIN de Acceso"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!isOwner && (
                            <button
                              onClick={() => deleteStaffUser(member.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Eliminar Colaborador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
