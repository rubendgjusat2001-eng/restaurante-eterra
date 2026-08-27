'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffUser } from '@/types/restaurant';
import { KeyRound, X, Check, Delete } from 'lucide-react';
import { sounds } from '@/lib/utils';

/**
 * Modal de identificación de colaborador (Nivel 2). NO inicia sesión en el
 * sistema — se usa dentro de una sesión ya autenticada para confirmar, vía
 * PIN verificado en el servidor, quién realiza una acción sensible (abrir o
 * cerrar una mesa, anular un ítem, cerrar caja).
 */
export function PinPadModal() {
  const {
    staff,
    verifyStaffPin,
    resolveStaffIdentity,
    isPinModalOpen,
    pendingActionUser,
  } = useRestaurant();

  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Importante: TODOS los hooks (useState/useEffect) deben ejecutarse siempre,
  // en el mismo orden, en cada render — por eso el `if (!isPinModalOpen) return
  // null` va al final, después de declarar hooks y funciones, nunca antes.
  useEffect(() => {
    if (pendingActionUser) {
      setSelectedStaff(pendingActionUser);
    } else if (staff.length > 0) {
      setSelectedStaff(staff[0]);
    }
    setPin('');
  }, [isPinModalOpen, pendingActionUser, staff]);

  const handleCancel = () => {
    sounds.playClick();
    resolveStaffIdentity(null);
  };

  const submitPin = async (candidate: string) => {
    if (!selectedStaff || candidate.length !== 4 || isVerifying) return;
    setIsVerifying(true);
    const matched = await verifyStaffPin(selectedStaff.id, candidate);
    setIsVerifying(false);

    if (matched) {
      sounds.playClick();
      resolveStaffIdentity(matched);
    } else {
      setErrorShake(true);
      sounds.playAlert();
      setTimeout(() => setErrorShake(false), 500);
      setPin('');
    }
  };

  const handleAddDigit = (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    sounds.playClick();
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 4) {
      submitPin(nextPin);
    }
  };

  const handleDeleteDigit = () => {
    sounds.playClick();
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    sounds.playClick();
    setPin('');
  };

  useEffect(() => {
    if (!isPinModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPinModalOpen, pin, selectedStaff]);

  if (!isPinModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-900">

        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 mb-3 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Identificar Colaborador</h3>
          <p className="text-xs text-slate-500 mt-1">Selecciona quién eres y digita tu PIN para confirmar esta acción</p>
        </div>

        <div className="mb-6">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
            Seleccionar Colaborador
          </label>
          <div className="flex flex-wrap items-center justify-center gap-2 max-h-36 overflow-y-auto pr-1">
            {staff.map(user => {
              const isSelected = selectedStaff?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedStaff(user);
                    setPin('');
                  }}
                  className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center min-w-[90px] ${
                    isSelected
                      ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-400/40 shadow-sm scale-105'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{user.avatar}</span>
                  <span className="text-xs font-semibold truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
                  <span className="text-[9px] uppercase tracking-wider text-cyan-700 truncate max-w-[80px] font-bold">
                    {user.role === 'owner' ? 'Owner' : user.role === 'waiter_cashier' ? 'Mozo-Caja' : user.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex flex-col items-center justify-center mb-6 ${errorShake ? 'animate-shake' : ''}`}>
          <div className="text-sm font-semibold text-cyan-800 mb-2">
            {selectedStaff ? `${selectedStaff.name} (${selectedStaff.role.toUpperCase()})` : 'Selecciona un colaborador'}
          </div>
          <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 px-6 py-3 rounded-2xl shadow-inner">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-cyan-700 shadow-sm scale-110'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
          {isVerifying && <p className="text-[10px] text-slate-400 mt-2">Verificando...</p>}
        </div>

        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleAddDigit(num)}
              disabled={isVerifying}
              className="h-13 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-xl font-bold text-slate-900 transition-all shadow-sm flex items-center justify-center hover:border-cyan-500 disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={isVerifying}
            className="h-13 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 text-xs font-bold text-rose-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            BORRAR
          </button>
          <button
            onClick={() => handleAddDigit('0')}
            disabled={isVerifying}
            className="h-13 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-xl font-bold text-slate-900 transition-all shadow-sm flex items-center justify-center hover:border-cyan-500 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleDeleteDigit}
            disabled={isVerifying}
            className="h-13 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-600 transition-all flex items-center justify-center disabled:opacity-50"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            onClick={() => submitPin(pin)}
            disabled={pin.length < 4 || isVerifying}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              pin.length >= 4 && !isVerifying
                ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-md cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
