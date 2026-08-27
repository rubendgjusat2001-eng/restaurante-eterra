# Mapa de la Base de Datos — ÉTERRA OS

Todas las tablas viven en Supabase (Postgres). `restaurant_id` está presente en
casi todas para soportar multi-tenant — ver `CLAUDE.md` sección 6, punto 2:
el código todavía no filtra por él, así que hoy en la práctica hay un solo
restaurante activo por proyecto de Supabase.

```mermaid
erDiagram
    RESTAURANTS ||--o{ ACCESS_ACCOUNTS : "tiene cuentas de acceso"
    RESTAURANTS ||--o{ STAFF_USERS : "tiene personal"
    RESTAURANTS ||--o{ TABLES : "tiene mesas"
    RESTAURANTS ||--o{ MENU_ITEMS : "tiene platos"
    RESTAURANTS ||--o{ ORDERS : "tiene pedidos"
    RESTAURANTS ||--o{ CASH_SHIFTS : "tiene turnos de caja"
    STAFF_USERS ||--o| STAFF_CREDENTIALS : "tiene un PIN hasheado"

    RESTAURANTS {
        uuid id PK
        text slug
        text name
        text theme_preset
        jsonb custom_theme
        bigint force_logout_timestamp
        int auth_version
    }

    ACCESS_ACCOUNTS {
        uuid id PK
        uuid restaurant_id FK
        text username
        text display_name
        text role "owner | manager | shift"
        text password_hash "bcrypt, solo service_role"
        bool active
    }

    STAFF_USERS {
        text id PK
        uuid restaurant_id FK
        text name
        text role
        text avatar
    }

    STAFF_CREDENTIALS {
        text staff_id PK_FK
        text pin_hash "bcrypt, solo service_role"
    }

    TABLES {
        text id PK
        uuid restaurant_id FK
        text number
        text zone
        text status
        text current_order_id
        text assigned_waiter_id
        text opened_by_user_id
    }

    MENU_ITEMS {
        text id PK
        uuid restaurant_id FK
        text category_id
        text name
        numeric price
        text station
        bool is_available
        jsonb modifier_groups
    }

    ORDERS {
        text id PK
        uuid restaurant_id FK
        text code
        text table_id
        text waiter_id
        jsonb items
        numeric total
        text status
        text payment_method
    }

    CASH_SHIFTS {
        text id PK
        uuid restaurant_id FK
        text shift_name
        numeric initial_cash
        numeric system_total_sales
        text status
    }
```

## Seguridad por tabla (Row Level Security)

| Tabla | Acceso público (anon) | Notas |
|---|---|---|
| `access_accounts` | ❌ Ninguno | Solo `service_role` (rutas `/api/auth/*`) |
| `staff_credentials` | ❌ Ninguno | Solo `service_role` |
| `restaurants` | ✅ Lectura/escritura | Riesgo residual documentado, ver `docs/decisions/0002-rls-posture-phase1.md` |
| `staff_users` | ✅ Lectura/escritura* | *No puede cambiar su propia columna `role` (trigger) |
| `tables` | ✅ Lectura/escritura | Riesgo residual documentado |
| `orders` | ✅ Lectura/escritura | Riesgo residual documentado |
| `menu_items` | ✅ Lectura/escritura | Riesgo residual documentado |
| `cash_shifts` | ✅ Lectura/escritura | Riesgo residual documentado |

## Columnas heredadas pendientes de borrar

`staff_users.pin` y `restaurants.owner_password` ya no los usa ningún código
(las credenciales reales viven en `staff_credentials`/`access_accounts`,
hasheadas). Siguen existiendo en la base de datos como respaldo temporal —
se eliminan con `supabase_migrations/003_phase1_drop_legacy_columns.sql`
después de un período de estabilidad confirmada.
