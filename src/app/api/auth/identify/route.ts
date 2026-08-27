import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { readSession } from '@/lib/session';

/**
 * Nivel 2: identifica a un colaborador específico por su PIN dentro de una sesión
 * ya autenticada (Nivel 1). NO crea ni modifica la sesión activa — solo confirma
 * "quién" está realizando una acción sensible (abrir/cerrar mesa, anular un ítem,
 * cerrar caja) para dejarlo registrado.
 */
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: 'Sesión no válida. Vuelve a iniciar sesión.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const staffId = typeof body?.staffId === 'string' ? body.staffId : '';
  const pin = typeof body?.pin === 'string' ? body.pin : '';

  if (!staffId || !pin) {
    return NextResponse.json({ error: 'Colaborador y PIN son requeridos' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: credential } = await supabase
    .from('staff_credentials')
    .select('pin_hash')
    .eq('staff_id', staffId)
    .maybeSingle();

  if (!credential) {
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
  }

  const validPin = await bcrypt.compare(pin, credential.pin_hash);
  if (!validPin) {
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
  }

  const { data: staffRow } = await supabase
    .from('staff_users')
    .select('id, name, role, avatar')
    .eq('id', staffId)
    .maybeSingle();

  if (!staffRow) {
    return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    staffId: staffRow.id,
    staffName: staffRow.name,
    role: staffRow.role,
    avatar: staffRow.avatar
  });
}
