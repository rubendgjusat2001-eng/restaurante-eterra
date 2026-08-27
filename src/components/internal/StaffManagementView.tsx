'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffUser, UserRole } from '@/types/restaurant';
import {
  Users,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  X,
  Filter,
  FolderOpen,
  Briefcase
} from 'lucide-react';
import { sounds } from '@/lib/utils';
import { AccessAccountsPanel } from './AccessAccountsPanel';
import { StaffDetailModal } from './StaffDetailModal';

export function StaffManagementView() {
  const {
    staff,
    currentThemeColors,
    addStaffUser,
    deleteStaffUser,
    showToast,
    positions,
    addPosition,
    removePosition,
    permissions,
    savePermission
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'cargos' | 'roles' | 'shifts'>('users');
  const [staffInDetail, setStaffInDetail] = useState<StaffUser | null>(null);
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionDescription, setNewPositionDescription] = useState('');

  // Permisos de Roles (Fase G) — el Dueño siempre tiene acceso total, no se
  // edita aquí. Solo se configuran los demás roles de acceso (Nivel 1).
  const EDITABLE_ROLES = [
    { id: 'manager', label: 'Administrador / Gerente' },
    { id: 'cashier', label: 'Cajero' },
    { id: 'waiter', label: 'Mozo de Salón' },
    { id: 'waiter_cashier', label: 'Mozo-Caja' },
    { id: 'kitchen', label: 'Cocinero (KDS)' },
    { id: 'bar', label: 'Bartender' }
  ];
  const PERMISSION_MODULES = [
    { id: 'waiter', label: 'Salón & Mesas' },
    { id: 'kitchen', label: 'KDS Cocina & Bar' },
    { id: 'cashier', label: 'Caja & Facturación' },
    { id: 'owner', label: 'Dashboard & KPIs' },
    { id: 'dishes', label: 'Carta & Platos' },
    { id: 'staff', label: 'Personal & Roles' },
    { id: 'settings', label: 'Configuración General' }
  ];
  const [selectedPermRole, setSelectedPermRole] = useState(EDITABLE_ROLES[0].id);

  const getPerm = (role: string, moduleId: string) =>
    permissions.find(p => p.role === role && p.module === moduleId);

  const handleTogglePermission = (moduleId: string, field: 'canView' | 'canEdit' | 'canDelete', value: boolean) => {
    const current = getPerm(selectedPermRole, moduleId);
    savePermission({
      role: selectedPermRole,
      module: moduleId,
      canView: field === 'canView' ? value : (current?.canView ?? false),
      canEdit: field === 'canEdit' ? value : (current?.canEdit ?? false),
      canDelete: field === 'canDelete' ? value : (current?.canDelete ?? false)
    });
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const primaryColor = currentThemeColors.primary || '#0284c7';

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

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;
    const created = await addPosition(newPositionName.trim(), newPositionDescription.trim());
    if (created) {
      setNewPositionName('');
      setNewPositionDescription('');
      sounds.playClick();
      showToast('success', `Cargo "${created.name}" creado`);
    } else {
      showToast('error', 'No se pudo crear el cargo');
    }
  };

  const handleDeletePosition = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el cargo "${name}"? El personal que lo tenga asignado quedará "sin asignar".`)) return;
    await removePosition(id);
    sounds.playClick();
    showToast('info', `Cargo "${name}" eliminado`);
  };

  // Filtrado de usuarios
  const filteredStaff = staff.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span 
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` }}
            className="px-2.5 py-1 rounded-full text-xs font-bold border"
          >
            👑 Dueño / Propietario
          </span>
        );
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
        {[
          { id: 'users', label: `Personal (${staff.length})` },
          { id: 'accounts', label: 'Cuentas de Acceso' },
          { id: 'cargos', label: `Cargos (${positions.length})` },
          { id: 'roles', label: 'Permisos de Roles' },
          { id: 'shifts', label: 'Horarios de Turno' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={isActive ? { backgroundColor: primaryColor, color: '#ffffff', boxShadow: `0 4px 12px ${primaryColor}30` } : {}}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? ''
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'accounts' ? (
        <AccessAccountsPanel />
      ) : activeTab === 'roles' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900">Permisos de Roles</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura qué pantallas puede ver, editar o eliminar cada rol de <strong>cuenta de acceso</strong> (Nivel 1).
              El Dueño siempre tiene acceso total y no se configura aquí. El PIN de Personal (Nivel 2) nunca tiene
              permisos propios — solo identifica quién realiza una acción.
            </p>
          </div>

          {permissions.length === 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
              Todavía no se cargaron permisos desde la base de datos — si recién configuraste el sistema, corre la
              migración <code className="font-mono">011_role_permissions.sql</code>. Mientras tanto, todos los roles
              ven todo (igual que antes de esta función).
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Seleccionar Rol</label>
            <select
              value={selectedPermRole}
              onChange={e => setSelectedPermRole(e.target.value)}
              className="w-full sm:w-72 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400"
            >
              {EDITABLE_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4 text-center">Ver</th>
                  <th className="py-3 px-4 text-center">Crear / Editar</th>
                  <th className="py-3 px-4 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_MODULES.map(mod => {
                  const perm = getPerm(selectedPermRole, mod.id);
                  return (
                    <tr key={mod.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{mod.label}</td>
                      {(['canView', 'canEdit', 'canDelete'] as const).map(field => (
                        <td key={field} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={perm?.[field] ?? false}
                            onChange={e => handleTogglePermission(mod.id, field, e.target.checked)}
                            className="w-4 h-4 accent-cyan-700 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'cargos' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-2xl animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900">Cargos del Personal</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Catálogo de puestos de trabajo (ej. "Mesero Senior", "Ayudante de Cocina"). Es solo informativo —
              no otorga permisos ni cambia lo que un colaborador puede hacer en el sistema.
            </p>
          </div>

          <form onSubmit={handleAddPosition} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nombre del cargo"
              value={newPositionName}
              onChange={e => setNewPositionName(e.target.value)}
              className="sm:col-span-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={newPositionDescription}
              onChange={e => setNewPositionDescription(e.target.value)}
              className="sm:col-span-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Cargo</span>
            </button>
          </form>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {positions.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No hay cargos configurados todavía</p>
            ) : (
              positions.map(position => {
                const count = staff.filter(s => s.positionId === position.id).length;
                return (
                  <div key={position.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-900">{position.name}</span>
                        {position.description && (
                          <span className="text-[10px] text-slate-400 block">{position.description}</span>
                        )}
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-mono font-bold ml-2">
                        {count} {count === 1 ? 'persona' : 'personas'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePosition(position.id, position.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Eliminar cargo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
      <>
      {/* 3. Título de Sección + Botón de Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Personal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administra los colaboradores y su PIN de identificación (ve a &quot;Cuentas de Acceso&quot; para usuarios y contraseñas de entrada al sistema)
          </p>
        </div>

        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          style={{ backgroundColor: primaryColor }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto hover:opacity-90"
        >
          {isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAddFormOpen ? 'Cerrar Formulario' : '+ Nuevo Usuario'}</span>
        </button>
      </div>

      {/* Formulario Desplegable para Crear Usuario */}
      {isAddFormOpen && (
        <form onSubmit={handleCreateUser} className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus className="w-4 h-4 text-slate-600" />
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
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Puesto / Rol en el Restaurante</label>
              <select
                value={newStaffRole}
                onChange={e => setNewStaffRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
              >
                <option value="owner">Dueño / Propietario</option>
                <option value="waiter">Mozo de Salón</option>
                <option value="cashier">Cajero</option>
                <option value="kitchen">Cocinero (KDS Cocina)</option>
                <option value="bar">Bartender (KDS Bar)</option>
                <option value="manager">Administrador / Gerente</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">PIN de Acceso Rápido (4 dígitos)</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={newStaffPin}
                onChange={e => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono tracking-widest focus:outline-none focus:border-slate-400"
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
              style={{ backgroundColor: primaryColor }}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-colors cursor-pointer hover:opacity-90"
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
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
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
            ].map(chip => {
              const isSelected = roleFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setRoleFilter(chip.id)}
                  style={isSelected ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                    isSelected
                      ? 'shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
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
                          <div 
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                            className="w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shadow-2xs shrink-0"
                          >
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
                            onClick={() => setStaffInDetail(member)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Ver expediente (datos, cargo, PIN, gastos)"
                          >
                            <FolderOpen className="w-4 h-4" />
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
      </>
      )}

      {staffInDetail && (
        <StaffDetailModal staff={staffInDetail} onClose={() => setStaffInDetail(null)} />
      )}

    </div>
  );
}
