'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StaffUser, UserRole } from '@/types/restaurant';
import { SYSTEM_BUILD_VERSION } from '@/lib/constants';
import { sounds } from '@/lib/utils';
import { ToastMessage } from './use-toasts';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad
const ACTIVITY_KEY = 'eterra_active_session_last_activity';
const SESSION_HINT_KEY = 'eterra_session_hint';

// La autoridad real de la sesión es la cookie httpOnly que emite /api/auth/login
// (nunca legible ni falsificable desde JavaScript). Lo que se guarda aquí es solo
// un "hint" sin secretos (nada de contraseñas/PIN) para hidratar la UI al instante
// en un F5 sin parpadeo — cada carga se revalida contra GET /api/auth/me.
interface SessionHint {
  accountId: string;
  role: string;
  displayName: string;
  restaurantId: string | null;
  mustChangePassword: boolean;
}

function saveSessionHint(hint: SessionHint) {
  if (typeof window === 'undefined') return;
  try {
    const dataStr = JSON.stringify(hint);
    localStorage.setItem(SESSION_HINT_KEY, dataStr);
    sessionStorage.setItem(SESSION_HINT_KEY, dataStr);
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch (e) {
    console.error('Error guardando sesión:', e);
  }
}

function clearSessionHint() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
    sessionStorage.removeItem(SESSION_HINT_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  } catch (e) {
    console.error('Error limpiando sesión:', e);
  }
}

function readSessionHint(): SessionHint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_HINT_KEY) || sessionStorage.getItem(SESSION_HINT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo sesión:', e);
  }
  return null;
}

function hintToStaffUser(hint: SessionHint): StaffUser {
  return {
    id: hint.accountId,
    name: hint.displayName,
    role: hint.role as UserRole,
    pin: '',
    avatar: hint.role === 'owner' ? '👑' : '🕐',
    color: 'from-slate-600 to-slate-800',
    active: true
  };
}

interface UseAuthDeps {
  staff: StaffUser[];
  showToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  addAuditLog: (action: 'system_action', description: string) => void;
}

/**
 * Autenticación de dos niveles (Nivel 1: cuentas de acceso; Nivel 2: PIN de
 * identificación). Extraído tal cual estaba en RestaurantContext.tsx (Fase 2a:
 * reorganización, sin cambiar comportamiento). Ver docs/decisions/0001-two-tier-auth.md.
 */
export function useAuth({ staff, showToast, addAuditLog }: UseAuthDeps) {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingActionUser, setPendingActionUser] = useState<StaffUser | null>(null);
  const pinResolverRef = useRef<((user: StaffUser | null) => void) | null>(null);

  // Hidratación segura del lado del cliente (patrón isAuthLoaded): primero se
  // renderiza al instante con el "hint" local para evitar parpadeo, y de inmediato
  // se revalida contra el servidor (GET /api/auth/me) — la cookie httpOnly es la
  // única fuente de verdad real; si el servidor no confirma, se cierra la sesión.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsAuthLoaded(true);
      return;
    }

    const storedVersion = localStorage.getItem('eterra_system_build_version');
    if (storedVersion !== SYSTEM_BUILD_VERSION) {
      clearSessionHint();
      setCurrentUser(null);
      localStorage.setItem('eterra_system_build_version', SYSTEM_BUILD_VERSION);
    } else {
      const hint = readSessionHint();
      if (hint) {
        setCurrentUser(hintToStaffUser(hint));
        setMustChangePassword(Boolean(hint.mustChangePassword));
      }
    }
    setIsAuthLoaded(true);

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          const hint: SessionHint = {
            accountId: data.accountId,
            role: data.role,
            displayName: data.displayName,
            restaurantId: data.restaurantId,
            mustChangePassword: Boolean(data.mustChangePassword)
          };
          saveSessionHint(hint);
          setCurrentUser(hintToStaffUser(hint));
          setMustChangePassword(hint.mustChangePassword);
        } else {
          clearSessionHint();
          setCurrentUser(null);
          setMustChangePassword(false);
        }
      })
      .catch(() => {});
  }, []);

  // Revalida la sesión contra el servidor; usado por el kill-switch en tiempo real
  // (disparado desde el dominio Restaurant Profile) y por el heartbeat periódico.
  // Si el servidor ya no confirma la sesión (PIN/contraseña cambiada, auth_version
  // incrementado), se cierra localmente.
  const checkSessionValidity = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated) {
        clearSessionHint();
        setCurrentUser(null);
        setMustChangePassword(false);
        sounds.playAlert();
        showToast('warning', 'La sesión ha sido cerrada en todos los dispositivos por una actualización de seguridad del Administrador.', 'Cierre de Sesión Global');
      } else {
        setMustChangePassword(Boolean(data.mustChangePassword));
      }
    } catch {}
  }, [showToast]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        sounds.playAlert();
        showToast('error', data.error || 'Usuario o contraseña incorrectos', 'Acceso Denegado');
        return false;
      }

      const hint: SessionHint = {
        accountId: data.accountId,
        role: data.role,
        displayName: data.displayName,
        restaurantId: data.restaurantId,
        mustChangePassword: Boolean(data.mustChangePassword)
      };
      saveSessionHint(hint);
      setCurrentUser(hintToStaffUser(hint));
      setMustChangePassword(hint.mustChangePassword);
      setIsPinModalOpen(false);
      sounds.playClick();
      if (hint.mustChangePassword) {
        showToast('warning', 'Por seguridad, define tus credenciales definitivas antes de continuar.', 'Configuración Requerida');
      } else {
        showToast('success', `Bienvenido, ${hint.displayName}.`, 'Acceso Autorizado');
      }
      addAuditLog('system_action', `Inicio de sesión: ${hint.displayName} (${hint.role})`);
      return true;
    } catch {
      sounds.playAlert();
      showToast('error', 'Error de conexión. Intenta nuevamente.', 'Acceso Denegado');
      return false;
    }
  };

  const updateOwnerPassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'No se pudo actualizar la contraseña');
        return false;
      }
      sounds.playClick();
      showToast('success', 'Contraseña actualizada con éxito. Se ha forzado el cierre de sesión en los demás dispositivos.', 'Seguridad');
      addAuditLog('system_action', 'Contraseña de acceso actualizada');
      return true;
    } catch {
      showToast('error', 'Error de conexión al actualizar la contraseña');
      return false;
    }
  };

  // Configuración obligatoria de cuenta (dispara cuando mustChangePassword es
  // true tras el login): fija credenciales definitivas y desactiva la
  // provisional para siempre. Ver docs/decisions/0005-forced-account-setup.md.
  const completeAccountSetup = async (payload: {
    currentPassword: string;
    newPassword: string;
    newUsername?: string;
    email?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        sounds.playAlert();
        return { ok: false, error: data.error || 'No se pudo guardar la configuración' };
      }

      setMustChangePassword(false);
      const hint = readSessionHint();
      if (hint) {
        const updatedHint: SessionHint = { ...hint, mustChangePassword: false };
        saveSessionHint(updatedHint);
        setCurrentUser(hintToStaffUser(updatedHint));
      }
      sounds.playClick();
      showToast('success', 'Tus credenciales definitivas quedaron guardadas. Se cerró la sesión en los demás dispositivos.', 'Cuenta Configurada');
      addAuditLog('system_action', 'Configuración obligatoria de cuenta completada (contraseña provisional desactivada)');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const forceLogoutAllDevices = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allDevices: true })
      });
    } catch {}
    clearSessionHint();
    setCurrentUser(null);
    setMustChangePassword(false);
    sounds.playAlert();
    showToast('warning', 'Se ha cerrado la sesión en todos los dispositivos conectados por protocolo de super seguridad.', 'Seguridad Global');
  };

  // Nivel 2: identificación de colaborador por PIN dentro de una sesión ya activa.
  // No otorga acceso al sistema — solo confirma "quién" hace una acción sensible
  // (abrir/cerrar mesa, anular ítem, cerrar caja) para dejarlo registrado.
  const verifyStaffPin = async (staffId: string, pin: string): Promise<StaffUser | null> => {
    try {
      const res = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, pin })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return staff.find(s => s.id === data.staffId) || null;
    } catch {
      return null;
    }
  };

  const requestStaffIdentity = (preselect?: StaffUser | null): Promise<StaffUser | null> => {
    return new Promise(resolve => {
      pinResolverRef.current = resolve;
      // currentUser es la cuenta de acceso (Nivel 1: dueño/turno) — no es un
      // colaborador de staff_users, así que nunca debe usarse como candidato
      // de identificación por PIN (Nivel 2). Si no hay preselección, se usa el
      // primer colaborador de la lista.
      setPendingActionUser(preselect || staff[0] || null);
      setIsPinModalOpen(true);
    });
  };

  const resolveStaffIdentity = (result: StaffUser | null) => {
    setIsPinModalOpen(false);
    setPendingActionUser(null);
    const resolver = pinResolverRef.current;
    pinResolverRef.current = null;
    resolver?.(result);
  };

  const switchUser = (user: StaffUser) => {
    setPendingActionUser(user);
    setIsPinModalOpen(true);
  };

  const logoutStaff = () => {
    setCurrentUser(null);
    setMustChangePassword(false);
    clearSessionHint();
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allDevices: false })
    }).catch(() => {});
    sounds.playClick();
    showToast('info', 'Sesión de personal cerrada');
  };

  // Monitoreo de actividad e inactividad de 15 minutos en el dispositivo, más un
  // heartbeat periódico que revalida la sesión contra el servidor (renueva la
  // cookie mientras haya actividad y detecta un cierre de sesión global).
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;

    const recordActivity = () => {
      localStorage.setItem('eterra_active_session_last_activity', String(Date.now()));
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, recordActivity, { passive: true }));

    const inactivityInterval = setInterval(() => {
      const lastActive = localStorage.getItem('eterra_active_session_last_activity');
      if (lastActive) {
        const diff = Date.now() - Number(lastActive);
        if (diff >= INACTIVITY_TIMEOUT_MS) {
          logoutStaff();
          showToast('warning', 'La sesión se ha cerrado automáticamente tras 15 minutos de inactividad por seguridad.', 'Seguridad de Acceso');
        }
      }
    }, 10000);

    const heartbeatInterval = setInterval(() => {
      checkSessionValidity();
    }, 60000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, recordActivity));
      clearInterval(inactivityInterval);
      clearInterval(heartbeatInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return {
    currentUser,
    isAuthLoaded,
    mustChangePassword,
    completeAccountSetup,
    login,
    updateOwnerPassword,
    switchUser,
    logoutStaff,
    verifyStaffPin,
    requestStaffIdentity,
    resolveStaffIdentity,
    forceLogoutAllDevices,
    isPinModalOpen,
    setIsPinModalOpen,
    pendingActionUser,
    setPendingActionUser,
    checkSessionValidity
  };
}
