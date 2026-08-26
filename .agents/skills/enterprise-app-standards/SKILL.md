---
name: enterprise-app-standards
description: Estándar y blueprint de ingeniería para sistemas web corporativos, ERPs, gestión SaaS y portales de clientes. Enforce persistencia de sesión inmune a F5, inactividad de 15 min, subrutas limpias /sistema/[seccion], separación headless web-ERP y vistas completas tipo data-table.
---

# Enterprise Application Standards Skill

Este skill provee los patrones de ingeniería obligatorios para desarrollo de software empresarial:

## 1. Arquitectura de Sesiones y Autenticación
- Hidratación cliente-servidor con bandera `isAuthLoaded` antes del renderizado de auth.
- Persistencia multi-capa en `localStorage`, `sessionStorage` y `document.cookie`.
- Monitor de inactividad de 15 minutos en el dispositivo (`mousedown`, `mousemove`, `keydown`, `touchstart`, `scroll`, `click`).

## 2. Navegación y URLs Independientes
- Rutas dinámicas en Next.js App Router: `/sistema/[section]` (`/sistema/mesas`, `/sistema/cocina`, `/sistema/caja`, `/sistema/dashboard`, `/sistema/carta`, `/sistema/personal`, `/sistema/configuracion`).
- Sincronización instantánea de URL al cambiar de vista.

## 3. Separación de Portales y CMS Headless
- `/`: Portal público del cliente (sin accesos administrativos expuestos).
- `/sistema`: Panel ERP de administración.
- Los cambios realizados en el ERP se transmiten a la web por Supabase.

## 4. UI/UX: Enterprise Full-Page Views
- Cero modales flotantes para la gestión central.
- Patrón: Header + Breadcrumbs + Tab Pills + Buscador en Vivo + Filtros Rápidos + Tablas con Avatares y Badges.

## 5. Protocolo de Calidad
- Ejecutar `npm run build` y validar 0 errores antes de dar por completada la tarea.
