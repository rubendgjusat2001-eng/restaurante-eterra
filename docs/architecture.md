# Mapa de Arquitectura — ÉTERRA OS

Cómo se conectan las piezas del sistema hoy (Fase 1 completa). Léase junto a
`CLAUDE.md`.

## Vista general

```mermaid
flowchart TB
    subgraph Cliente["Navegador (cualquier dispositivo)"]
        Publico["Portal público /"]
        ERP["ERP interno /sistema/*"]
    end

    subgraph Servidor["Next.js (servidor)"]
        API["Route Handlers /api/auth/*, /api/system/time"]
        Ctx["RestaurantContext.tsx\n(estado global del cliente)"]
    end

    subgraph Supabase["Supabase"]
        DB[("Postgres\ncon Row Level Security")]
        RT["Realtime\n(WebSockets)"]
    end

    Publico -- "anon key: solo lectura\nde datos públicos" --> DB
    ERP -- "anon key: lecturas y\nescrituras operativas" --> DB
    ERP -- "fetch (cookie de sesión)" --> API
    API -- "service role key\n(bypassa RLS)" --> DB
    DB -- "postgres_changes" --> RT
    RT -- "suscripción en vivo" --> ERP
    RT -- "suscripción en vivo" --> Publico

    Ctx -. "vive dentro de" .-> ERP
    Ctx -. "vive dentro de" .-> Publico
```

## Puntos clave

- **Dos llaves de Supabase, dos niveles de confianza:**
  - `anon key` (`src/lib/supabase.ts`): pública, vive en el navegador de
    cualquiera. Protegida solo por RLS (ver `docs/database-schema.md` y
    `CLAUDE.md` sección 5).
  - `service role key` (`src/lib/supabase-service.ts`): secreta, **solo** en
    las Route Handlers del servidor. Nunca debe llegar al navegador.

- **La autenticación siempre pasa por el servidor.** El navegador nunca
  compara contraseñas ni PINs — llama a `/api/auth/login` o
  `/api/auth/identify`, que usan la service role key + bcrypt.

- **El realtime NO pasa por el servidor de Next.js.** El navegador se conecta
  directo a Supabase Realtime con la anon key — por eso cualquier cambio en
  una tabla (nueva orden, mesa actualizada) se refleja al instante en todos
  los dispositivos conectados, sin que el servidor tenga que reenviar nada.

- **`RestaurantContext.tsx`** es el único punto donde el cliente habla con
  Supabase para datos operativos (mesas, pedidos, carta) — ningún componente
  llama a Supabase directamente. Esto es lo que hace viable dividirlo en una
  capa de servicios más adelante (Fase 2) sin tener que tocar 20 archivos.

## Futuro: Fase 3 (portal de pagos)

```mermaid
flowchart LR
    Cliente["Cliente final\n(celular)"]
    Portal["Portal de pagos\n(subdominio separado)"]
    Culqi["Pasarela Culqi\n(tarjeta / Yape / Plin)"]
    DB[("Supabase\n(misma base de datos)")]
    ERPFuturo["ERP interno"]

    Cliente --> Portal
    Portal -- "crea intento de pago" --> Culqi
    Culqi -- "webhook de confirmación" --> Portal
    Portal -- "escribe pedido pagado" --> DB
    DB -- "realtime" --> ERPFuturo
```

El portal de pagos comparte la misma base de datos (Supabase) que el ERP, así
que un pedido pagado por un cliente aparece en la cocina/caja en tiempo real,
sin integración adicional.
