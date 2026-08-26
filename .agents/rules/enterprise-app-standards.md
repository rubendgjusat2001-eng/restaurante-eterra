# Regla Obligatoria: Estándar Empresarial para Aplicaciones Web y ERPs

Esta regla aplica a todos los desarrollos del proyecto:

1. **Persistencia de Sesión & 15-Min Inactividad:**
   - La sesión nunca se debe perder en `F5` / recargas de página.
   - Implementar siempre el ciclo `isAuthLoaded` para evitar que la pantalla de login parpadee o desloguee al usuario.
   - Sincronización multi-capa en `localStorage`, `sessionStorage` y `cookies`.
   - Cierre automático de sesión tras 15 minutos exactos de inactividad del dispositivo.

2. **Rutas Independientes por Sección:**
   - Cada sección del ERP debe tener su subruta limpia (ej. `/sistema/mesas`, `/sistema/cocina`, `/sistema/caja`, `/sistema/carta`, `/sistema/personal`, `/sistema/configuracion`).
   - Sincronización dinámica de URL con `window.history.pushState` y soporte nativo de botones Atrás/Adelante.

3. **Separación de Dominios Web vs ERP:**
   - Web pública para clientes (`/`) libre de botones administrativos o paletas de colores del sistema.
   - Las configuraciones del local y carta se gestionan dentro del ERP y se sincronizan a la web por Supabase.

4. **Diseño de Vistas Completas (No Ventanas Flotantes):**
   - Módulos organizados a pantalla completa con Breadcrumbs, Tab Pills, Buscador, Filtros por Chips y Tablas de datos limpias.

5. **Validación Pre-Flight Obligatoria:**
   - Todo cambio debe compilar con `npm run build` con código de salida 0 antes de ser entregado.
