import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { readSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session || session.role !== 'owner' || !session.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof body?.active === 'boolean') updates.active = body.active;
  if (typeof body?.displayName === 'string' && body.displayName.trim()) updates.display_name = body.displayName.trim();
  if (typeof body?.username === 'string' && body.username.trim()) updates.username = body.username.trim().toLowerCase();
  if (typeof body?.email === 'string') updates.email = body.email.trim().toLowerCase() || null;
  if (typeof body?.role === 'string' && body.role) updates.role = body.role;
  if (typeof body?.newPassword === 'string' && body.newPassword.length >= 6) {
    updates.password_hash = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('access_accounts')
    .update(updates)
    .eq('id', id)
    .eq('restaurant_id', session.restaurantId);

  if (error) {
    const message = error.code === '23505' ? 'Ese nombre de usuario ya existe' : 'No se pudo actualizar la cuenta';
    return NextResponse.json({ error: message }, { status: error.code === '23505' ? 400 : 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session || session.role !== 'owner' || !session.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id } = await params;

  const supabase = getServiceClient();
  const { data: target } = await supabase
    .from('access_accounts')
    .select('role')
    .eq('id', id)
    .eq('restaurant_id', session.restaurantId)
    .maybeSingle();

  if (target?.role === 'owner') {
    return NextResponse.json({ error: 'No se puede eliminar la cuenta de dueño' }, { status: 400 });
  }

  const { error } = await supabase
    .from('access_accounts')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', session.restaurantId);

  if (error) {
    return NextResponse.json({ error: 'No se pudo eliminar la cuenta' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
