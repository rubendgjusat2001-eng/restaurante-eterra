'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffUser } from '@/types/restaurant';
import { KeyRound, X, Zap, Check, Delete } from 'lucide-react';
import { sounds } from '@/lib/utils';

export function PinPadModal() {
  const { 
    staff, 
    currentUser, 
    loginWithPin, 
    isPinModalOpen, 
    setIsPinModalOpen, 
    pendingActionUser, 
    setPendingActionUser 
  } = useRestaurant();

  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    if (pendingActionUser) {
      setSelectedStaff(pendingActionUser);
    } else if (currentUser) {
      setSelectedStaff(currentUser);
    } else if (staff.length > 0) {
      setSelectedStaff(staff[0]);
    }
    setPin('');
  }, [isPinModalOpen, pendingActionUser, currentUser, staff]);

  useEffect(() => {
    if (!isPinModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDeleteDigit();
      } else if (e.key === 'Enter') {
        handleVerifyPin();
      } else if (e.key === 'Escape' && currentUser) {
        setIsPinModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinModalOpen, pin, selectedStaff, currentUser]);

  if (!isPinModalOpen) return null;

  const handleAddDigit = (digit: string) => {
    if (pin.length >= 6) return;
    sounds.playClick();
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4 && selectedStaff && selectedStaff.pin === nextPin) {
      setTimeout(() => {
        loginWithPin(nextPin, selectedStaff);
        setPin('');
      }, 80);
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

  const handleVerifyPin = () => {
    if (!selectedStaff) return;
    const ok = loginWithPin(pin, selectedStaff);
    if (!ok) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      setPin('');
    }
  };

  const handleEmergencyBypass = () => {
    if (selectedStaff) {
      loginWithPin(selectedStaff.pin, selectedStaff);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-900">
        
        {/* Botón Cerrar (Solo si ya hay usuario autenticado) */}
        {currentUser && (
          <button
            onClick={() => {
              sounds.playClick();
              setIsPinModalOpen(false);
              setPendingActionUser(null);
            }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 mb-3 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Acceso Rápido de Personal</h3>
          <p className="text-xs text-slate-500 mt-1">Selecciona tu usuario y digita tu PIN de seguridad</p>
        </div>

        {/* Selector Visual de Personal */}
        <div className="mb-6">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
            Seleccionar Usuario
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

        {/* Display de PIN (Puntos) */}
        <div className={`flex flex-col items-center justify-center mb-6 ${errorShake ? 'animate-shake' : ''}`}>
          <div className="text-sm font-semibold text-cyan-800 mb-2">
            {selectedStaff ? `${selectedStaff.name} (${selectedStaff.role.toUpperCase()})` : 'Selecciona un usuario'}
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
          <p className="text-[10px] text-slate-400 mt-2">
            PIN Demo: <span className="font-mono text-cyan-700 font-bold">{selectedStaff?.pin || '1234'}</span>
          </p>
        </div>

        {/* Teclado Numérico Táctil */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleAddDigit(num)}
              className="h-13 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-xl font-bold text-slate-900 transition-all shadow-sm flex items-center justify-center hover:border-cyan-500"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-13 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 text-xs font-bold text-rose-700 transition-all flex items-center justify-center"
          >
            BORRAR
          </button>
          <button
            onClick={() => handleAddDigit('0')}
            className="h-13 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-xl font-bold text-slate-900 transition-all shadow-sm flex items-center justify-center hover:border-cyan-500"
          >
            0
          </button>
          <button
            onClick={handleDeleteDigit}
            className="h-13 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-600 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones de Emergencia / Bypass */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={handleEmergencyBypass}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Acceso Rápido / Bypass
          </button>

          <button
            onClick={handleVerifyPin}
            disabled={pin.length < 4}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              pin.length >= 4
                ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-md cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Ingresar
          </button>
        </div>
      </div>
    </div>
  );
}
