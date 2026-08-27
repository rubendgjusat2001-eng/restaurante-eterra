# 0002 — Postura intermedia de RLS en Fase 1 (no es un descuido)

**Fecha:** 2026-08-26
**Estado:** Vigente, revisar en Fase 2

## Contexto

Antes de la auditoría de seguridad de Fase 1, ninguna tabla tenía Row Level
Security — la anon key pública tenía lectura/escritura total sobre todo,
incluyendo la contraseña del dueño en texto plano.

## Decisión

Se cerró por completo el acceso a las tablas de credenciales
(`access_accounts`, `staff_credentials` — deny-by-default real, solo
`service_role`). El resto de las tablas operativas (`restaurants`,
`staff_users`, `tables`, `orders`, `menu_items`, `cash_shifts`) recibieron una
política permisiva (`TO anon USING (true) WITH CHECK (true)`) — es decir,
**funcionalmente igual que antes** para esas tablas.

## Por qué no cerrar todo de una vez

Cerrar la escritura de esas tablas también habría requerido mover cada
operación (abrir mesa, agregar un plato, tocar el menú) a una ruta de
servidor — es un cambio de arquitectura grande (la capa de servicios de Fase
2), no algo seguro de hacer de golpe sin romper la app en producción.

**Esto es un riesgo residual conocido y aceptado temporalmente, no un
descuido.** Alguien con las herramientas de desarrollador todavía podría
alterar directamente una mesa o un pedido (no puede leer contraseñas ni
PINs). Se cierra migrando cada escritura operativa a una ruta de servidor
como parte de la Fase 2.

## Por qué las migraciones SQL las corre el dueño manualmente

El asistente de IA no tiene ni debe tener una conexión directa con permisos de
administrador (contraseña de base de datos) a la base de datos de producción
— eso permitiría borrar tablas completas, no solo leer/escribir filas. Cada
cambio de esquema se revisa y ejecuta manualmente en el SQL Editor de
Supabase. Es más lento, pero es la postura de seguridad correcta: ningún
cambio estructural a la base de datos ocurre sin que una persona lo vea y lo
apruebe primero.
