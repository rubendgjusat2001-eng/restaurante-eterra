'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffUser, StaffExpense } from '@/types/restaurant';
import * as staffService from '@/services/staff.service';
import { serverDate } from '@/lib/server-time';
import { formatMoney, sounds } from '@/lib/utils';
import {
  X,
  Save,
  KeyRound,
  Receipt,
  Plus,
  Briefcase,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';

interface StaffDetailModalProps {
  staff: StaffUser;
  onClose: () => void;
}

/**
 * Expediente de personal (Fase E) — datos de contacto, Cargo (RRHH, no
 * otorga permisos), cambio de PIN, y el historial de gastos/pagos de este
 * colaborador. Ver docs/decisions/0008-staff-profile.md.
 */
export function StaffDetailModal({ staff, onClose }: StaffDetailModalProps) {
  const { currentThemeColors, positions, updateStaffProfile, updateUserPin, currentUser, showToast } = useRestaurant();
  const primaryColor = currentThemeColors.primary || '#0284c7';

  const [activeSection, setActiveSection] = useState<'profile' | 'pin' | 'expenses'>('profile');

  // Datos del expediente
  const [name, setName] = useState(staff.name);
  const [positionId, setPositionId] = useState(staff.positionId || '');
  const [phone, setPhone] = useState(staff.phone || '');
  const [documentId, setDocumentId] = useState(staff.documentId || '');
  const [email, setEmail] = useState(staff.email || '');
  const [hireDate, setHireDate] = useState(staff.hireDate || '');
  const [address, setAddress] = useState(staff.address || '');
  const [notes, setNotes] = useState(staff.notes || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffProfile(staff.id, {
      name: name.trim(),
      positionId: positionId || null,
      phone: phone.trim(),
      documentId: documentId.trim(),
      email: email.trim(),
      hireDate: hireDate || undefined,
      address: address.trim(),
      notes: notes.trim()
    });
  };

  // Cambio de PIN (reemplaza el prompt() anterior)
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      showToast('error', 'El PIN debe tener exactamente 4 dígitos numéricos');
      sounds.playAlert();
      return;
    }
    if (newPin !== confirmPin) {
      showToast('error', 'Los PIN no coinciden');
      sounds.playAlert();
      return;
    }
    updateUserPin(staff.id, newPin);
    setNewPin('');
    setConfirmPin('');
  };

  // Gastos / pagos del colaborador
  const [expenses, setExpenses] = useState<StaffExpense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => serverDate().toISOString().slice(0, 10));

  useEffect(() => {
    if (activeSection !== 'expenses') return;
    setIsLoadingExpenses(true);
    staffService.fetchStaffExpenses(staff.id).then(list => {
      setExpenses(list);
      setIsLoadingExpenses(false);
    });
  }, [activeSection, staff.id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!expenseConcept.trim() || !amount || amount <= 0) {
      showToast('error', 'Completa el concepto y un monto válido');
      sounds.playAlert();
      return;
    }
    const created = await staffService.insertStaffExpense({
      staffId: staff.id,
      concept: expenseConcept.trim(),
      amount,
      expenseDate,
      createdBy: currentUser?.name
    });
    if (created) {
      setExpenses(prev => [created, ...prev]);
      setExpenseConcept('');
      setExpenseAmount('');
      setIsAddExpenseOpen(false);
      sounds.playCashRegister();
      showToast('success', 'Gasto/pago registrado en el expediente');
    } else {
      showToast('error', 'No se pudo registrar el gasto');
    }
  };

  const totalExpenses = expenses.reduce((acc, ex) => acc + ex.amount, 0);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-900 max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center shrink-0"
            >
              {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{staff.name}</h3>
              <p className="text-[11px] text-slate-500">Expediente de Personal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-5 pt-3 shrink-0">
          {[
            { id: 'profile', label: 'Datos & Cargo', icon: Briefcase },
            { id: 'pin', label: 'Cambiar PIN', icon: KeyRound },
            { id: 'expenses', label: 'Gastos & Pagos', icon: Receipt }
          ].map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                style={isActive ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive ? '' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Briefcase className="w-3 h-3" /> Cargo (informativo, no da permisos)
                  </label>
                  <select
                    value={positionId}
                    onChange={e => setPositionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="">Sin asignar</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Phone className="w-3 h-3" /> Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3 h-3" /> DNI / Documento
                  </label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={e => setDocumentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3" /> Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={e => setHireDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Mail className="w-3 h-3" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3" /> Dirección
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3 h-3" /> Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-90"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Expediente</span>
                </button>
              </div>
            </form>
          )}

          {activeSection === 'pin' && (
            <form onSubmit={handleChangePin} className="space-y-4 max-w-sm">
              <p className="text-xs text-slate-500">
                Este PIN identifica a {staff.name.split(' ')[0]} al realizar acciones sensibles (abrir mesa, cobrar, etc.) — no otorga acceso al sistema.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nuevo PIN (4 dígitos)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono tracking-widest focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirmar PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-mono tracking-widest focus:outline-none focus:border-slate-400"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-90"
              >
                <KeyRound className="w-4 h-4" />
                <span>Actualizar PIN</span>
              </button>
            </form>
          )}

          {activeSection === 'expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Registro de adelantos, pagos y gastos asociados a este colaborador.</p>
                  <p className="text-sm font-black text-slate-900 mt-1">Total registrado: {formatMoney(totalExpenses)}</p>
                </div>
                <button
                  onClick={() => setIsAddExpenseOpen(!isAddExpenseOpen)}
                  style={{ backgroundColor: primaryColor }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-90 shrink-0"
                >
                  {isAddExpenseOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAddExpenseOpen ? 'Cerrar' : 'Agregar'}</span>
                </button>
              </div>

              {isAddExpenseOpen && (
                <form onSubmit={handleAddExpense} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Concepto</label>
                      <input
                        type="text"
                        placeholder="Ej: Adelanto de sueldo"
                        value={expenseConcept}
                        onChange={e => setExpenseConcept(e.target.value)}
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Monto (S/.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
                  >
                    Guardar Registro
                  </button>
                </form>
              )}

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {isLoadingExpenses ? (
                  <p className="text-center py-8 text-xs text-slate-400">Cargando...</p>
                ) : expenses.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">Sin gastos o pagos registrados todavía</p>
                ) : (
                  expenses.map(ex => (
                    <div key={ex.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{ex.concept}</p>
                        <p className="text-[10px] text-slate-400">
                          {ex.expenseDate}{ex.createdBy ? ` · Registrado por ${ex.createdBy}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-black text-rose-700 font-mono">-{formatMoney(ex.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
