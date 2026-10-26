# Fases del MVP de Data In Sight

Trabajo secuencial en este mismo chat, a partir del 19 de octubre de 2026. Las referencias son docs/CONTEXTO_MVP.md y docs/diseno/FRONTEND.md. El reparto entre tres chats queda descartado.

| Fase | Trabajo | Criterio de cierre |
|---|---|---|
| 1. Base técnica | WXT, Manifest V3, Vue, TypeScript estricto, popup/opciones iniciales y comandos. | Compilación y comprobación de tipos correctas; extensión lista para carga manual. |
| 2. Motor DLP | Detectores, políticas, sustitución y pruebas sintéticas. | Casos positivos/negativos, solapamientos y reevaluación comprobados; secretos críticos no se omiten. |
| 3. Frontend | Pantallas de las referencias, logo, temas, accesibilidad y ajustes. | Popup, advertencia, bloqueo, vista previa y opciones revisados visualmente, sin simular protección real. |
| 4. Integración ChatGPT | Adaptador, interceptación de envíos, motor/UI, almacenamiento mínimo. | Flujo completo con clic/Enter, cancelación, corrección y reanálisis; fixtures con inspección de peticiones y validación real separada. |
| 5. Claude y Gemini | Adaptadores sobre motor y UI compartidos. | Validación independiente de cada plataforma; estado no disponible si falta cobertura. |
| 6. Cierre del MVP | Pruebas integrales, privacidad, documentación y demo local de respaldo. | Evidencia de pruebas, limitaciones explícitas y demo repetible con datos sintéticos. |

La primera meta demostrable es el flujo completo en ChatGPT al terminar la fase 4. No añadir backend, cuentas, archivos, OCR o panel empresarial. El logo original y los mockups permanecen conservados; las pantallas de la fase 1 son provisionales y no sustituyen el diseño final.

## Resultado de la fase 1

Se prepararon WXT 0.21.4, Vue 3, TypeScript estricto y vue-tsc, con package-lock.json. TypeScript se fijó a 5.9.3 tras comprobar una incompatibilidad entre vue-tsc 3.3.13 y TypeScript 7.0.2. Popup y opciones básicos usan la paleta verde; muestran que la protección aún no está disponible. El logo original permanece intacto para la fase visual; el identificador DIS del popup es provisional.

Verificación: npm run typecheck y npm run build. Artefacto: .output/chrome-mv3. La carga manual, navegación en navegador y revisión visual siguen pendientes; no hay motor, content script ni protección de envíos todavía. Siguiente trabajo: fase 2, motor DLP con pruebas.

## Resultado de la fase 2

Motor puro en src/domain/ y src/application/ con detección de correo, teléfono México, CURP/RFC plausibles y credenciales por formatos/contexto. Políticas ALLOW/WARN/BLOCK, sustitución por etiquetas y reevaluación, límites de entrada, Zod para ajustes y 110 pruebas correctas, incluyendo el corpus de 60 mensajes sintéticos. Comprobación de tipos y compilación correctas. Detalles, API y límites en [Motor DLP](MOTOR_DLP.md).

El motor todavía no se conecta al popup/editor ni intercepta envíos. No se ha demostrado prevención real en navegador. Siguiente trabajo: fase 3, frontend de las referencias; luego fase 4 para integrar ChatGPT.

## Resultado de la fase 3

Frontend verde implementado con popup, opciones, advertencia, bloqueo y vista previa, temas claro/oscuro/sistema y demo conectada al motor dentro de Shadow DOM. Ajustes persistentes en almacenamiento de extensión, lectura/borrado de metadatos y errores visibles. No hay prevención de envíos en plataformas todavía.

Verificados tipos, build, formato, 116 pruebas unitarias y 9 pruebas de interfaz, incluida carga de la extensión compilada en Chromium con perfil temporal. Ver [frontend implementado](FRONTEND_IMPLEMENTADO.md) para API, comandos y capturas. Sigue la fase 4: integración con ChatGPT.

Revisión visual v2 solicitada por el usuario: logo transparente, fuentes locales Space Grotesk/Manrope, núcleo de seguridad propio y superficies con mayor profundidad. Suite ampliada a 10 pruebas de interfaz. La fase 4 continúa pendiente. Ver [rediseño](diseno/REDISENIO_V2.md).

## Resultado de implementación de la fase 4

Integración experimental de ChatGPT con el motor y los modales: control de clic/Enter/submit, sustitución con relectura y reevaluación, confirmación ligada al intento, detección de editor incompatible, popup con estado real y registro de metadatos mediante service worker. Alcance limitado a la variante textarea observada en el sitio.

Se mantienen separadas tres evidencias: inspección DOM real, pruebas de extensión sobre fixtures con peticiones interceptadas, y validación manual de extremo a extremo del sitio real (pendiente). No se da por cerrado ese último criterio. Ver [integración y pasos de validación](INTEGRACION_CHATGPT.md).

Comprobaciones finales: 118 pruebas unitarias, 14 de integración y 10 de interfaz correctas; tipos, compilación y formato correctos. La carga compilada está disponible en .output/chrome-mv3.


## Ampliación previa a la Fase 5

El usuario confirmó funcionamiento en su navegador y pidió ampliar datos antes de continuar. Se implementaron CLABE con control, tarjetas con Luhn y NSS por longitud/contexto, junto con sustitución, comparación, demo y metadatos. Ver [alcance y límites](AMPLIACION_DATOS.md). La Fase 5 sigue pendiente.

El usuario pidió completar las demás categorías de texto: se añadieron INE, pasaporte, licencia, nombre, domicilio, nacimiento y salud, con reglas 1.2.0. [Comprobaciones y límites](DETECCION_CONTEXTO.md). Confirmó que archivos e imágenes/OCR pertenecen a otra fase.

Verificación final de esta ampliación: 222 unitarias, 16 de integración sobre fixtures y 13 de interfaz correctas; tipos, build y formato correctos. La Fase 5 no se inició.


## Implementación experimental de la Fase 5

Adaptadores de Claude y Gemini sobre el controlador y UI compartidos, soporte de contenteditable mediante edición nativa comprobada, popup multiplataforma y eventos cuya plataforma deriva del remitente en el worker. Se preservan las 17 categorías y el diseño aprobado. Ver [evidencia, pruebas y validación pendiente](INTEGRACION_MULTIPLATAFORMA.md).

Gemini se inspeccionó como invitado sin enviar mensajes; Claude redirigió al acceso, por lo que su contrato es provisional y debe comprobarse con sesión. Las pruebas automáticas independientes usan fixtures y no equivalen a validar las solicitudes en los sitios reales. El cierre manual de esta fase sigue pendiente; no se inicia la Fase 6 automáticamente.

Verificación de Fase 5: 233 unitarias, 38 de integración sobre fixtures y 13 de interfaz correctas; tipos, compilación y formato correctos. El usuario pospuso expresamente la comprobación de Claude real («Lo probaré después»).


## Corrección posterior a la Fase 5 experimental

El usuario señaló dependencia de plantillas y cobertura telefónica solo de México. Se añadieron teléfonos sin etiqueta e internacionales, extensiones, país para números nacionales, nombres probables en minúsculas/texto libre y señales naturales de domicilio/salud. Ver [reglas 1.3.0 y límites](DETECCION_TEXTO_LIBRE.md). Se mantienen las validaciones reales pendientes y la exclusión de archivos/OCR acordada.

Verificación de la corrección 1.3.0: 299 unitarias, 40 de integración sobre fixtures y 14 de interfaz correctas; tipos, compilación y formato correctos.


## Pruebas de límites y correcciones 1.3.1

Se revisaron las 17 categorías, sustitución, Unicode, privacidad, carga y flujos de envío. Se corrigieron evasiones por ancho completo/separadores invisibles, credenciales multilínea, correos con comillas tipográficas/parte local Unicode y JWT compactos reconocibles, además de delimitar campos contiguos al domicilio. [Resultados y fallos todavía pendientes](PRUEBAS_LIMITES.md).

Verificación: 430 unitarias, 48 de integración sobre fixtures y 14 de interfaz correctas; tipos, compilación y formato correctos. No se da por terminada la validación en sitios reales ni se inicia otra fase automáticamente.
