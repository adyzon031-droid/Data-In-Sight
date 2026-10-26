# Fase 5 · Claude y Gemini

El motor se amplió posteriormente con [texto libre, nombres en minúsculas y teléfonos internacionales](DETECCION_TEXTO_LIBRE.md), reglas 1.3.0. La validación real de las plataformas descrita aquí sigue pendiente.


Implementación experimental sobre las 17 categorías y la UI compartida. Los sitios reales y los fixtures se distinguen expresamente: las pruebas automáticas no envían mensajes a los proveedores.

## Evidencia y alcance

| Plataforma | Contrato del editor | Evidencia disponible |
|---|---|---|
| ChatGPT | textarea mobile-composer en su formulario y botón data-composer-submit | DOM observado y funcionamiento confirmado por el usuario; regresión automática sobre fixture |
| Gemini | rich-textarea, .ql-editor contenteditable con role textbox, ámbito .text-input-field y botón Enviar mensaje/Send message | DOM observado en Gemini invitado, idioma es-MX, el 19 de octubre de 2026; prueba local de texto sin envío; recorrido de extensión probado sobre fixture |
| Claude | div.ProseMirror contenteditable dentro de form y botón Send message/Enviar mensaje | Contrato provisional probado sobre fixture. El sitio real redirigió a inicio de sesión; no se inspeccionó el editor autenticado |

Claude requiere validar el DOM autenticado y, si difiere, ajustar su contrato. No se atribuye al contrato provisional el carácter de selector observado. Gemini también requiere validar el recorrido completo de la extensión en una sesión real: observar el DOM no demuestra bloqueo de solicitudes ni sincronización con todos los modelos internos de la aplicación.

Los adaptadores exigen un único editor visible y un único control de envío dentro del ámbito correspondiente. No usan como respaldo el primer textbox/botón del documento. Editores ambiguos, estructuras desconocidas, chips/elementos no editables o controles de detener muestran Protección no disponible. En Gemini sin texto puede faltar el botón de envío y aparecer indisponibilidad hasta que el botón esté presente. El indicador es la referencia del estado actual; la lista de Sitios web describe integraciones experimentales, no disponibilidad garantizada en cada pestaña.

## Comportamiento compartido

- Intercepta clic (también sobre hijos del botón), Enter y submit si existe formulario.
- Respeta Shift+Enter y composición IME; reevalúa texto antes de cada intento.
- Las credenciales críticas no permiten continuar. Las advertencias personales ofrecen cancelación, edición, sustitución o continuación explícita para ese texto/intento.
- La revisión suspende temporalmente el diálogo modal para poder enfocar el editor y lo restaura inmediatamente después de la edición. La sustitución enriquecida utiliza selección dentro del editor, insertText y saltos nativos insertLineBreak para no multiplicar las separaciones entre párrafos. Emite un beforeinput cancelable antes de modificar y respeta su cancelación. Exige que se emita input y relee el resultado exacto. No emplea un respaldo con innerHTML/textContent que pueda dejar el modelo de la aplicación desactualizado.
- Si la sustitución falla o la página revierte el contenido, no confirma el resultado; exige revisar el editor e intentar de nuevo. Una revisión anterior no autoriza enviar un texto editado, una conversación nueva o una política distinta.
- La comparación Antes/Después y los valores originales permanecen en memoria durante la revisión. No se guardan ni se envían al worker.

execCommand está obsoleto y su comportamiento debe comprobarse en los navegadores soportados; se usa aquí como operación nativa disponible en Chromium, con comprobación del resultado y del evento. Verificar el DOM y el evento input no acredita por sí solo el estado interno de cualquier versión futura de Quill/ProseMirror. La validación real de los envíos sigue siendo necesaria. Para acotar las operaciones nativas, la sustitución enriquecida admite hasta 256 saltos de línea; si se supera, no modifica ni confirma el texto. El análisis conserva el límite general de 20 000 unidades UTF-16. El reemplazo es texto plano y puede retirar formato enriquecido.

## Permisos y registro

Solo se solicitan storage y acceso a https://chatgpt.com/*, https://claude.ai/* y https://gemini.google.com/*. No hay permiso global tabs, all_urls, acceso a cuentas de Google o inyección en el mundo principal. PNG/fuentes de la marca se exponen solo a esos tres dominios.

El service worker obtiene la plataforma del origen exacto del remitente y exige frame principal y extensión propia. El cliente no puede enviar un campo platform ni contenido adicional para modificar el historial. Conserva categoría, acción, versión de regla, fecha y plataforma, con el límite/retención existentes. Los eventos previos siguen siendo compatibles.

## Pruebas repetibles

```bash
npm run typecheck
npm test
npm run build
npm run format:check
PLAYWRIGHT_BROWSERS_PATH=/tmp/dis-playwright npm run test:integration
PLAYWRIGHT_BROWSERS_PATH=/tmp/dis-playwright npm run test:ui
```

La suite de integración intercepta todas las peticiones HTTPS y entrega HTML controlado bajo cada origen para activar los permisos reales de la extensión. Bloquea destinos ajenos y cuenta peticiones a /fixture-submit. No solicita las aplicaciones reales. Los fixtures no incluyen Quill ni ProseMirror reales: reproducen el contrato DOM y un modelo local separado que solo cambia al recibir input.

Claude y Gemini tienen pruebas independientes de bloqueo por clic/Enter/hijos del botón, benignos sin duplicación, cancelación/continuación, sustitución con saltos de línea y modelo protegido, valores ocultos, privacidad y plataforma del historial, cambios de texto sin input, navegación, editor incompatible, elementos no editables, detener, IME/Shift+Enter, rechazo de sustitución y popup. Se conserva la regresión de ChatGPT.

## Validación manual necesaria

1. Recargar la extensión compilada en el administrador del navegador, aceptar acceso a los dos dominios añadidos y recargar las pestañas de las plataformas.
2. Abrir una conversación nueva y comprobar el indicador. En Claude hace falta sesión; si el editor no coincide con el contrato provisional, debe mostrar no disponible y se debe ajustar el adaptador.
3. Con datos sintéticos, comprobar mensaje benigno, correo con advertencia/cancelación/continuación y API_KEY=synthetic-phase5-key con bloqueo. Confirmar ausencia de petición de envío y de mensaje en la conversación en los casos detenidos.
4. Proteger un ejemplo mixto, revisar la comparación y volver al editor. Comprobar que la solicitud posterior solo contiene las etiquetas y que la aplicación no restaura el original.
5. Repetir conversación existente, navegación interna, edición durante revisión, políticas, IME real y botón detener. Revisar historial por plataforma y ausencia de valores.

No se protegen rutas no reconocidas, otros idiomas no contemplados en el control de envío, frames, API directas, form.submit sin evento, borradores transmitidos antes de enviar, herramientas/conectores, voz, archivos ni imágenes. Archivos/OCR siguen en otra fase por decisión del usuario. El código no es un proxy ni una barrera contra una página hostil.

## Referencias

- [Chrome, content scripts y mundo aislado](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
- [MDN, execCommand y eventos de edición](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand).
- [WXT, content scripts](https://wxt.dev/guide/essentials/content-scripts).

## Resultado de esta implementación

233 pruebas unitarias, 38 de integración (16 de ChatGPT y 11 por cada plataforma nueva) y 13 de interfaz correctas. Typecheck, compilación Chrome MV3 y formato correctos. Capturas `docs/diseno/capturas/fase5-claude-fixture.png` y `docs/diseno/capturas/fase5-gemini-fixture.png`, exclusivamente de fixtures.

La regresión descubrió y permitió corregir la edición de un campo inerte mientras el diálogo modal estaba abierto, la multiplicación de saltos al insertar párrafos y la falta de cancelación consistente del evento previo a la edición nativa. La suite final conjunta pasó completa tras esas correcciones.

El usuario indicó «Lo probaré después» respecto a Claude real. Su comprobación manual se pospone expresamente; no se da por verificado el editor autenticado ni por cerrada la validación real de la Fase 5. Gemini tiene inspección DOM real sin envío, no una validación del recorrido de la extensión en producción.
