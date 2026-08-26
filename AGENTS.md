# Estándar de Arquitectura y Desarrollo Empresarial (ÉTERRA & SaaS Corporativos)

Este documento define las **Reglas de Oro y Estándares de Arquitectura Obligatorios** para el desarrollo de sistemas web empresariales, ERPs gastronómicos, aplicativos de gestión y portales de clientes.

---

## 1. 🛡️ Estándar de Seguridad, Autenticación y Persistencia de Sesión

1. **Inmunidad a Recargas (`F5`):**
   * Toda sesión iniciada debe persistir ante recargas (`F5`), cambios de pestaña o navegación interna.
   * **Patrón de Hidratación Obligatorio (`isAuthLoaded`):** Antes de renderizar la pantalla de Login, el sistema debe comprobar el almacenamiento local en un ciclo de hidratación en milisegundos con un splash loader elegante, evitando parpadeos de logout involuntario.
2. **Almacenamiento Multi-Capa con Fallback:**
   * La sesión activa se sincroniza simultáneamente en `localStorage`, `sessionStorage` y `Cookies de sesión`.
3. **Cierre Automático por Inactividad (15 Minutos):**
   * El sistema debe registrar eventos de actividad en el dispositivo (`mousedown`, `mousemove`, `keydown`, `touchstart`, `scroll`, `click`).
   * Si transcurren **15 minutos continuos sin interacción**, la sesión se destruye automáticamente por seguridad y se redirige a la pantalla de login con un toast explicativo.
4. **Protección de Rutas Privadas:**
   * Las rutas internas del sistema (`/sistema/*`) nunca son accesibles sin credenciales válidas. Si un usuario no autenticado intenta ingresar, se le muestra la pantalla de bloqueo seguro.

---

## 2. 🌐 Arquitectura de URLs Independientes & Navegación

1. **Subrutas Limpias y Directas:**
   * Cada módulo o sección de la aplicación debe poseer su URL propia e independiente (ejemplo: `/sistema/mesas`, `/sistema/cocina`, `/sistema/caja`, `/sistema/dashboard`, `/sistema/carta`, `/sistema/personal`, `/sistema/configuracion`).
2. **Sincronización en Tiempo Real:**
   * Al hacer clic en cualquier opción del menú lateral o barra de navegación, la barra de direcciones del navegador debe actualizarse instantáneamente sin recargar toda la página.
3. **Soporte Nativo de Historial:**
   * Los botones Atrás (`←`) y Adelante (`→`) del navegador deben funcionar de manera natural para desplazarse entre pantallas.
4. **Acceso Directo (Deep Linking):**
   * Si el usuario escribe o guarda en favoritos `/sistema/personal`, al ingresar y autenticarse debe aterrizar exactamente en ese módulo.

---

## 3. 🏢 Separación Total: Portal Web Público vs. Sistema ERP Privado

1. **Portal Web de Clientes (`/`):**
   * 100% enfocado en la experiencia del cliente: Menú gourmet, reservas, pedidos online, historia y promociones.
   * **Cero Filtraciones:** Prohibido colocar botones de "Acceso al Sistema", paneles de desarrollador o selectores de temas privados en la web pública.
2. **Sistema ERP Interno (`/sistema`):**
   * Panel privado y seguro para operaciones del restaurante.
3. **Sincronización Headless (Configuración desde el ERP a la Web):**
   * El restaurante puede editar desde `/sistema/configuracion` o `/sistema/carta` los datos del local, teléfonos, redes, horarios, platos y precios.
   * Estos cambios se sincronizan en tiempo real mediante la base de datos (Supabase) hacia el portal web de clientes.

---

## 4. 🎨 Diseño de Interfaz: Vistas Completas (No Modales Obstructivos)

1. **Prohibición de Modales Gigantes:**
   * Para la gestión de datos principales (Personal, Carta, Ajustes, Reportes), está estrictamente prohibido usar ventanas modales flotantes que tapen la pantalla principal.
2. **Estructura Estándar de Vista Completa (Enterprise Data View):**
   * **Encabezado & Breadcrumbs:** `Inicio > [Nombre de la Sección]`
   * **Pestañas de Navegación Secundaria (Tab Pills):** Para segmentar sub-secciones dentro del módulo.
   * **Barra de Control:** Buscador interactivo en vivo (`🔍 Buscar...`) + Filtros rápidos por rol/categoría (`[Todos] [Opción A] [Opción B]`).
   * **Tabla de Datos / Bento Grid:** Diseño espacioso con avatares, badges de estado en verde/ámbar, botones de acción claros y paginación si aplica.
   * **Botón de Acción Primaria:** Destacado en la esquina superior (`+ Nuevo Registro`).

---

## 5. ⚡ Protocolo de Calidad y Pre-Entrega (Pre-Flight Checks)

1. **Compilación de Producción Obligatoria:**
   * Antes de entregar cualquier funcionalidad o cambio, es obligatorio ejecutar `npm run build` y verificar que el código compile con **0 errores de TypeScript y Exit Code 0**.
2. **Pruebas de Estado Limpio (Clean Slate):**
   * El sistema debe operar con integridad tanto con 0 registros creados como con miles de registros en producción.
3. **Resumen y Explicación al Cliente:**
   * Al finalizar cada tarea, se debe explicar con total claridad qué se hizo, la razón técnica de la solución y los pasos exactos para probarlo.
