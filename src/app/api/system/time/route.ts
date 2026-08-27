import { NextResponse } from 'next/server';

/**
 * Reloj de confianza del sistema. El cliente nunca debe usar la hora de su
 * propio dispositivo para generar timestamps que se guardan en la base de
 * datos (pedidos, mesas, turnos de caja, auditoría) — un reloj mal
 * configurado (o alterado a propósito) rompería reportes y registros. Esta
 * ruta expone la hora real del servidor para que el cliente calcule un
 * "offset" y corrija su reloj local.
 */
export async function GET() {
  return NextResponse.json({ serverTime: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
