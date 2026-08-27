import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { readSession } from '@/lib/session';

/**
 * Solo cuentas owner/manager (Nivel 1) pueden asignar o cambiar el PIN (Nivel 2)
 * de un colaborador. El PIN nunca se hashea en el cliente ni se lee de vuelta.
 */
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== 'owner' && session.role !== 'manager')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const staffId = typeof body?.staffId === 'string' ? body.staffId : '';
  const pin = typeof body?.pin === 'string' ? body.pin : '';

  if (!staffId || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN inválido: debe tener 4 dígitos' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const pinHash = await bcrypt.hash(pin, 10);

  const { error } = await supabase
    .from('staff_credentials')
    .upsert({ staff_id: staffId, pin_hash: pinHash, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: 'No se pudo guardar el PIN' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
