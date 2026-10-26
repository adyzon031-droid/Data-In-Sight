# Fase 4 · Integración experimental con ChatGPT

Actualización de Fase 5: [Claude y Gemini](INTEGRACION_MULTIPLATAFORMA.md) comparten ahora el controlador. Este documento describe la validación original de ChatGPT; el permiso de host y el registro se ampliaron a los tres orígenes exactos.


19 de octubre de 2026. Se conecta el motor local y la interfaz aprobada a un adaptador de ChatGPT web. La implementación y los fixtures están verificados; la validación de extremo a extremo con la extensión instalada en la aplicación real sigue pendiente.

## Qué está implementado

- Content script MV3 en `https://chatgpt.com/*`, cargado en document_start.
- Adaptador para el editor observado: `textarea#mobile-composer-prompt`, dentro de `form[data-mobile-composer]`, con un único `button[data-composer-submit][type="submit"]` visible.
- Revisión local síncrona de los intentos por clic, Enter sin Shift y evento submit del formulario compatible.
- Advertencia cancelable y continuación no crítica limitada a una cadena síncrona de clic/submit, con el mismo editor, formulario, botón, ruta y texto exacto.
- Bloqueo de credenciales críticas sin omisión. La evaluación se ejecuta antes de considerar cualquier continuación autorizada.
- Sustitución mediante el setter nativo de textarea y evento input; lectura y evaluación posterior del valor efectivo. La vista previa nunca envía automáticamente.
- Invalidación de revisión al cambiar texto, política, conversación o editor. Composición IME y Shift+Enter se distinguen de un envío.
- Prevención de repetición de Enter y doble clic; seguimiento temporal de 600 ms para el mismo intento. Los encadenamientos nativos de eventos solo continúan tras reanálisis y no constituyen un permiso global.
- Reconexión tras reconstrucción de interfaz mediante observación de cambios DOM y comprobación periódica de estructura. No se analiza texto en segundo plano mientras se escribe.
- Indicador de disponibilidad en la página y consulta de estado desde el popup de la pestaña activa.
- Service worker para ajustes y registro mínimo, con esquemas Zod y comprobación de origen/remitente. Las operaciones de almacenamiento se serializan.
- Recursos locales del logo y fuentes resueltos para extensión/content script, Shadow DOM y fuentes registradas en el documento anfitrión.

El estado activo significa que se reconoció la estructura compatible, se cargó la política y están conectados los controles implementados. No certifica todas las variantes ni todos los mecanismos de transmisión de ChatGPT.

## Evidencia de inspección del sitio real

Se abrió `https://chatgpt.com/` en el navegador integrado y se leyeron atributos del editor y botón sin enviar mensajes ni introducir datos. El estado observado era sin sesión, en español. Se revisó también con viewport 1280 × 900: la estructura de textarea conservó el mismo identificador.

| Elemento | Observación |
|---|---|
| Editor | textarea con id mobile-composer-prompt |
| Contenedor | form con atributo data-mobile-composer |
| Botón | button con data-composer-submit y type submit |
| Accesibilidad | Descripción «Chat con ChatGPT» y botón «Enviar mensaje» |
| Cambio a detener | El botón incluye un elemento data-composer-stop-icon, inicialmente hidden |

El adaptador deja de reconocer el botón como envío si aparece el icono de detener. La inspección DOM no demuestra que el envío real haya sido interceptado. No se instalaron extensiones en la sesión personal del usuario ni se hizo una prueba real de petición de ChatGPT en esta etapa.

No se incluyeron selectores de otras versiones, como editores contenteditable, sin haberlos observado. Si tu cuenta presenta otro editor, el indicador debe mostrar protección no disponible y habrá que adaptar y validar esa variante.

## Pruebas automatizadas

```bash
npm run typecheck
npm test
npm run build
npm run format:check
npx playwright install chromium
npm run test:ui
npm run test:integration
```

En esta sesión se usa `PLAYWRIGHT_BROWSERS_PATH=/tmp/dis-playwright`. Las pruebas crean perfiles temporales de Chromium y cargan `.output/chrome-mv3`.

La suite de integración usa Playwright para interceptar las peticiones HTTPS y devolver el fixture de `tests/fixtures/platforms/chatgpt.html`. Aunque el URL del navegador sea chatgpt.com para activar los permisos reales de la extensión, el HTML y el endpoint de envío son simulados: no se solicita la aplicación real ni se envían mensajes a OpenAI. El fixture se identifica visualmente como simulación.

Casos cubiertos: bloqueo sin petición por clic/Enter/submit, mensaje benigno, doble clic, cancelación, continuación no crítica de un solo intento, sustitución y reevaluación, cambio de texto sin input, Shift+Enter, composición IME sintética, navegación interna, editor incompatible, popup, cambio de política durante una revisión, política ilegible, botón de detener y rechazo de mensajes inesperados.

Resultado de esta sesión: 121 pruebas unitarias, 14 de integración y 11 de interfaz correctas. Typecheck, build y comprobación de formato correctos. Los fallos encontrados en la primera ejecución (cadena nativa de eventos benignos y autorización de opciones en pestaña) se corrigieron y volvieron a comprobar.

Se comprueba que las peticiones de casos bloqueados no lleguen al endpoint del fixture. En el recorrido protegido solo sale el texto sustituido. El almacenamiento no contiene el mensaje, sus fragmentos, etiquetas de sustitución o credenciales sintéticas. El IME probado es una simulación de eventos; no sustituye una prueba con el teclado/IME real del equipo.

La evidencia visual `docs/diseno/capturas/fase4-fixture-bloqueo.png` pertenece exclusivamente a ese entorno simulado.

## Privacidad y permisos

El permiso de host se limita a `https://chatgpt.com/*`. No se solicita `<all_urls>` ni el permiso global tabs. El popup consulta la pestaña activa y se comunica solo con el frame principal; sitios ajenos aparecen no compatibles. Los PNG/WOFF2 públicos de marca se exponen únicamente al dominio soportado.

No se envía el prompt al service worker. Los mensajes internos contienen ajustes o metadatos: categoría, acción y versión de regla. El worker añade fecha/plataforma, vuelve a validar, verifica el ajuste de registro y limita a 200 eventos con retención. No registra valores, contenido, hashes ni identificadores de conversación.

El texto evaluado vive en memoria durante una revisión. La confirmación se pierde al cambiar texto/ruta/editor/ajustes, al cerrar la revisión o al destruir el controlador. El seguimiento de duplicados se borra a los 600 ms o al editar/navegar. No se persiste un mapa reversible de sustituciones. Tras proteger se muestra una comparación transitoria de cada dato personal con su etiqueta real y un recuento de sustituciones/categorías. Las contraseñas, claves API y tokens aparecen siempre enmascarados en ese informe. La comparación solo vive en la revisión actual, no se envía al worker ni se añade al historial.

## Validación manual pendiente en tu navegador

1. Compilar y cargar `.output/chrome-mv3` desde chrome://extensions o brave://extensions, con modo desarrollador. Al actualizar una instalación previa, aceptar el acceso solicitado a chatgpt.com y recargar la pestaña del sitio.
2. Abrir ChatGPT y comprobar el indicador y el popup. Si aparece no disponible, anotar navegador/versión y la variante del editor; no asumir protección.
3. Con un mensaje benigno, verificar clic y Enter una vez, sin duplicados.
4. Con `Correo: alumno@example.com`, verificar advertencia, cancelar y después continuación explícita no crítica.
5. Con `API_KEY=synthetic-example-key-123`, verificar bloqueo, ausencia del mensaje en la conversación y ausencia de solicitud de envío en las herramientas de red. Nunca probar con credenciales reales.
6. Elegir Proteger y revisar: comprobar la comparación Antes/Después, recuentos y etiquetas, credenciales enmascaradas, regreso al editor y nuevo intento con reevaluación.
7. Repetir cambios de conversación, edición, Shift+Enter y un IME real. Comprobar que detener una generación no se trate como enviar un prompt.
8. En Privacidad, revisar que solo existan metadatos; desactivar el registro y comprobar que no se agreguen eventos futuros. Registrar fecha, navegador, versión del sitio/estructura observada y resultados.

El usuario confirmó que la integración funciona en su navegador; la lista exhaustiva sigue pendiente de validación documentada en la aplicación real. No se publican tasas de efectividad ni soporte universal.

## Límites

No se controla todo el tráfico del sitio. Borradores transmitidos antes del envío, form.submit sin evento, APIs directas de la página, canales alternativos, frames, voz, archivos, imágenes y editores no reconocidos quedan fuera. El aislamiento de estilos no impide que una página hostil altere el DOM; este MVP previene errores accidentales en los mecanismos cubiertos.

El almacenamiento es local y no constituye auditoría empresarial ni protección frente a otras extensiones o un navegador comprometido. La retención se aplica al leer/escribir eventos; no existe limpieza programada en segundo plano.

## Referencias técnicas

- [WXT: content scripts](https://wxt.dev/guide/essentials/content-scripts).
- [Chrome: mensajería entre contextos](https://developer.chrome.com/docs/extensions/develop/concepts/messaging).

Siguiente paso: completar la validación real de esta variante y adaptar las variantes de editor que se observen antes de anunciar compatibilidad general. Claude y Gemini corresponden a la fase 5.
