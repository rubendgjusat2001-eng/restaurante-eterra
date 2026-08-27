'use client';

/**
 * Reloj corregido contra el servidor. En vez de confiar en `Date.now()` /
 * `new Date()` del dispositivo (que puede estar mal configurado, desincronizado
 * o alterado a propósito), se sincroniza una sola vez un "offset" contra
 * GET /api/system/time y luego se aplica ese offset localmente — así no hace
 * falta una llamada de red por cada timestamp.
 *
 * Úsese SIEMPRE que se vaya a generar un timestamp que se persiste como un
 * registro del negocio (pedidos, mesas, turnos de caja, auditoría, reservas).
 * Para relojes puramente visuales (ej. un contador que solo se muestra en
 * pantalla y no se guarda), `Date.now()` normal sigue siendo válido.
 */

let offsetMs = 0;
let hasSynced = false;
let syncInFlight: Promise<void> | null = null;

export async function syncServerTime(): Promise<void> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const requestStart = Date.now();
      const res = await fetch('/api/system/time', { cache: 'no-store' });
      const data = await res.json();
      const requestEnd = Date.now();

      if (typeof data?.serverTime === 'number') {
        const roundTripMs = requestEnd - requestStart;
        const estimatedServerNowAtResponse = data.serverTime + roundTripMs / 2;
        offsetMs = estimatedServerNowAtResponse - requestEnd;
        hasSynced = true;
      }
    } catch {
      // Sin conexión momentánea: se sigue usando el offset anterior (o 0)
      // como respaldo, en vez de romper la app.
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function serverDate(): Date {
  return new Date(serverNow());
}

export function isServerTimeSynced(): boolean {
  return hasSynced;
}
