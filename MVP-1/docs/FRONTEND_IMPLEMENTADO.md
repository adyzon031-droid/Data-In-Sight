# Frontend de Data In Sight · Fase 3

Actualización previa a Fase 5: se incorporaron CLABE, tarjetas, NSS e [identidad, domicilio, nacimiento y salud](DETECCION_CONTEXTO.md). Archivos y OCR se reservaron para otra fase por decisión del usuario. Ver también [reglas financieras](AMPLIACION_DATOS.md). Las secciones históricas siguientes describen la fase original.

Implementado el 19 de octubre de 2026 siguiendo [las referencias visuales](diseno/FRONTEND.md). El motor se conecta únicamente a la demostración local. Esta fase no implementa protección en ChatGPT, Claude ni Gemini.

Este documento describe la entrega de fase 3. La implementación posterior de fase 4 conecta ChatGPT de forma experimental; el estado actual y la validación real pendiente están en [Integración ChatGPT](INTEGRACION_CHATGPT.md).

## Pantallas disponibles

- Popup con logo, estado de protección, contadores de eventos por categoría, detectores disponibles y acceso real a configuración.
- Configuración en pestaña propia: General, Detección, Sitios web, Privacidad, Apariencia, Demostración y Acerca de.
- Modal de advertencia con cancelar, editar, proteger y continuación no crítica.
- Modal de bloqueo crítico sin excepción para continuar.
- Vista previa del texto sustituido y explicación del resultado de reevaluación.
- Estado sin coincidencias, confirmaciones de cancelación/continuación simulada y error de entrada demasiado larga.

El popup muestra protección no disponible hasta implementar un adaptador verificado. No incluye un interruptor general que pueda desactivar silenciosamente credenciales críticas. Los sitios se presentan como integraciones pendientes. No se incorporaron detectores de tarjetas bancarias por aparecer en el mockup.

La revisión visual v2 usa una variante del logo con transparencia real, sin recuadro negro, preservando el original. Space Grotesk y Manrope se empaquetan localmente; no hay fuentes remotas. Una ilustración propia de núcleo de seguridad, retícula y órbitas unifica hero, popup y modales. Ver [dirección visual, recurso y prompt](diseno/REDISENIO_V2.md).

## Cómo revisar el resultado

### Extensión compilada

```bash
npm ci
npm run build
```

Cargar `.output/chrome-mv3` como extensión sin empaquetar. Abrir el popup → Ver configuración → Demostración. Seleccionar mensaje benigno, datos personales o credencial sintética y pulsar Evaluar mensaje.

Los ajustes se guardan de verdad mediante `browser.storage.local`, con esquema Zod estricto. Los mensajes de demostración no se guardan ni se envían y la demostración no genera eventos.

### Vista previa local

```bash
npm run preview:ui
```

Abrir [opciones](http://127.0.0.1:5173/) o [popup](http://127.0.0.1:5173/?view=popup). Esta vista usa un proveedor de desarrollo explícito en memoria; sus cambios se pierden al recargar. El proveedor no se importa desde la extensión de producción y no actúa como fallback si falla el almacenamiento real.

## Componentes y punto de integración

Componentes Vue en `src/ui/components/`: BrandLogo, AppIcon, SettingsToggle, ThemePicker, FindingsList, PreventionDialog y DemoLab. Popup y opciones permanecen en sus entrypoints WXT. Los tokens, temas y estilos compartidos están en `src/ui/styles/base.css`.

`src/ui/mount-prevention.ts` exporta:

```ts
mountPrevention(host: ShadowRoot, model: PreventionViewModel, onAction): {
  update(model: PreventionViewModel): void;
  destroy(): void;
}
```

El host debe ser creado y retirado por el integrador. La función monta un diálogo y su CSS dentro del ShadowRoot. El integrador puede establecer `host.host.dataset.theme` a light/dark/system. Acciones: cancel, edit, protect y continue. El modelo contiene Inspection y opcionalmente previewText (solo texto ya sustituido) y simulation.

La UI no autoriza envíos: la fase 4 debe volver a leer el editor, validar ajustes, asociar cada autorización al texto e intento actuales, reevaluar y gestionar suscripciones/limpieza. También debe verificar resolución de imágenes empaquetadas y permisos de recursos al insertar UI en sitios externos. Los estilos aislados no son una frontera de seguridad.

El diálogo usa HTML dialog, escape para cancelar, foco inicial, recorrido circular con Tab/Shift+Tab y restauración del foco. El texto del usuario se interpola como texto, sin HTML sin escapar. Los hallazgos no contienen ni muestran originales; no existe un control para revelar secretos.

## Almacenamiento y ajustes

`src/infrastructure/storage/repository.ts` valida dos claves:

- `dis.settings.v1`: únicamente el esquema Settings del motor.
- `dis.events.v1`: hasta 200 eventos mínimos con fecha, plataforma, categoría, acción y versión de regla. En esta fase se implementan lectura, filtrado y borrado, no generación de eventos de prevención.

La lectura elimina eventos vencidos según la retención elegida y fechas futuras. No hay temporizador de limpieza en segundo plano. Desactivar registro afecta al registro futuro de la fase 4; no borra por sí solo eventos previos. Borrar eventos conserva ajustes. Los fallos de lectura/escritura producen un aviso y no simulan un guardado exitoso.

No hay contadores inventados de «análisis benignos»: las cifras representan eventos por categoría disponibles en el registro. La demostración conserva contenido solo mientras está montada; al salir de su sección se descarta.

## Verificación

```bash
npm run typecheck
npm test
npm run build
npm run format:check
npx playwright install chromium
npm run test:ui
```

La suite de interfaz requiere primero la extensión compilada para su prueba de instalación. En esta sesión Chromium se descargó a `/tmp/dis-playwright`; se ejecutó la suite con `PLAYWRIGHT_BROWSERS_PATH=/tmp/dis-playwright npm run test:ui`. Esa ruta es temporal y no es requisito para otros equipos.

Se comprobaron 116 pruebas unitarias (motor y almacenamiento). La revisión v2 amplía la suite a 10 pruebas de interfaz en Chromium, incluyendo transparencia real del logo y carga de fuentes:

- Navegación y temas.
- Advertencia, enmascarado, foco circular y cancelación por Escape.
- Bloqueo, sustitución, reevaluación y ausencia de peticiones externas desde la demostración.
- Continuación simulada y bloqueo crítico aun desactivando advertencias personales.
- Entrada excesiva con edición disponible.
- Opciones móviles sin desbordamiento horizontal y popup compacto.
- Texto con marcado HTML tratado como texto.
- Modal oscuro móvil con muchos hallazgos y acciones accesibles mediante desplazamiento.
- Extensión compilada en perfil temporal: apertura de opciones, persistencia real de tema/ajustes al recargar y almacenamiento sin mensajes después de la demo.

Se inspeccionaron capturas de popup, apariencia oscura, advertencia, bloqueo y vista previa. Evidencia en [capturas](diseno/capturas/). Estas imágenes provienen de la vista previa salvo las que terminan en `-extension.png`, tomadas en páginas de la extensión compilada. No representan validación en ChatGPT ni certificación formal de accesibilidad. Brave y carga manual en la sesión habitual del usuario quedan por comprobar.

## Siguiente fase

Integrar ChatGPT con interceptación de envíos y sesión de evaluación, usando el motor de fase 2 y el modal de esta fase. Mantener el estado no disponible hasta verificar que se controla el envío soportado.
