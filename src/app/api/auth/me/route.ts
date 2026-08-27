import { NextResponse } from 'next/server';
import { createSession, readSession } from '@/lib/session';
import { getServiceClient } from '@/lib/supabase-service';

/**
 * Hidratación de sesión (patrón isAuthLoaded) + kill-switch en vivo: cada llamada
 * revalida auth_version contra la base de datos y, si sigue siendo válida, renueva
 * la cookie (sesión deslizante de 15 minutos mientras haya actividad).
 */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  if (session.restaurantId) {
    const supabase = getServiceClient();
    const { data: restaurantRow } = await supabase
      .from('restaurants')
      .select('auth_version')
      .eq('id', session.restaurantId)
      .maybeSingle();

    const currentVersion = restaurantRow?.auth_version ?? session.authVersion;
    if (currentVersion !== session.authVersion) {
      return NextResponse.json({ authenticated: false, revoked: true });
    }
  }

  await createSession(session);

  return NextResponse.json({
    authenticated: true,
    accountId: session.accountId,
    role: session.role,
    displayName: session.displayName,
    restaurantId: session.restaurantId
  });
}
