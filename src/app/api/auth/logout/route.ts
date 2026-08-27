import { NextRequest, NextResponse } from 'next/server';
import { destroySession, readSession } from '@/lib/session';
import { getServiceClient } from '@/lib/supabase-service';

export async function POST(req: NextRequest) {
  const session = await readSession();
  const body = await req.json().catch(() => null);
  const allDevices = Boolean(body?.allDevices);

  // Cierre de sesión global: solo el dueño puede invalidar todas las sesiones activas
  // del restaurante (incrementa auth_version, lo que hace que /api/auth/me rechace
  // cualquier cookie emitida antes de este momento, en cualquier dispositivo).
  if (allDevices && session?.role === 'owner' && session.restaurantId) {
    const supabase = getServiceClient();
    await supabase
      .from('restaurants')
      .update({
        auth_version: (session.authVersion ?? 1) + 1,
        force_logout_timestamp: Date.now()
      })
      .eq('id', session.restaurantId);
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}
