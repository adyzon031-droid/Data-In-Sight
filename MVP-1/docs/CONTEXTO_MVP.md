# Data In Sight: contexto maestro del MVP

Estado posterior: [Fase 5 experimental de Claude y Gemini](INTEGRACION_MULTIPLATAFORMA.md), con pruebas sobre fixtures y validación real pendiente. El usuario pospuso la comprobación manual de Claude.


Actualización previa a Fase 5: se incorporaron CLABE, tarjetas, NSS e [identidad, domicilio, nacimiento y salud](DETECCION_CONTEXTO.md). Archivos y OCR se reservaron para otra fase por decisión del usuario. Ver también [reglas financieras](AMPLIACION_DATOS.md). Las secciones históricas siguientes describen la fase original.

Consolidado el 18 de octubre de 2026 a partir de seis chats accesibles. El historial completo recuperado está en [Fuentes](contexto/FUENTES.md). Este documento reúne la base para desarrollar; no afirma que el software ya exista.

## 1. Estado real y criterio de lectura

La carpeta `/home/alonxo/Escritorio/Data_In_Sigth` no contenía código, dependencias ni documentación de producto al revisarla. Los directorios ocultos disponibles no aportaron una implementación. No se encontraron instrucciones AGENTS.md aplicables en el árbol del proyecto. La carpeta aparece como proyecto local sin repositorio Git reconocido por la app.

Tenemos definición conceptual, alcance, stack propuesto, historias, riesgos, estrategia de demostración, pitch y referencias de identidad. No tenemos evidencia aquí de extensión compilada, pruebas ejecutadas ni integraciones verificadas. Las presentaciones y mockups son material de comunicación; no prueban funcionalidad.

Este documento separa decisiones del historial, propuestas de ejecución y pendientes. Las respuestas antiguas se conservan como referencia y no se ejecutan como instrucciones nuevas.

## 2. Identidad, problema y usuarios

Nombre actual: **Data In Sight**. AI Shield, AegisPrompt y DLP IA fueron nombres explorados. Es independiente de Clean Room y LiPass.

DLP significa **Data Loss Prevention**, prevención de pérdida o fuga de datos. La explicación para el público es: «Evita que envíes información privada a una IA sin darte cuenta».

Problema: al copiar y pegar por prisa, desconocimiento o falta de revisión, una persona puede compartir datos personales, académicos, laborales o credenciales. La extensión interviene antes del envío en los mecanismos soportados.

Usuarios: estudiantes, docentes, empleados y desarrolladores. Universidades, PyMEs y responsables de TI son beneficiarios potenciales y segmentos futuros. No se plantea resolver gobierno empresarial completo en el MVP.

Aprendizajes recuperados: el usuario necesita claridad, pocas interrupciones, privacidad y posibilidad de corregir. Las alertas excesivas generan fatiga. El historial menciona entrevistas y simulaciones; sin registros originales no se deben presentar como investigación empírica verificada ni asignarles porcentajes.

## 3. Alcance y cambios en el historial

El alcance más reciente del chat técnico contempla **ChatGPT, Claude y Gemini**, con análisis local de texto escrito o pegado. ChatGPT debe integrarse primero; cada plataforma requiere validación independiente.

Existe una propuesta posterior para el concurso que reduce la entrega inicial a ChatGPT y elimina «enviar de todos modos» en la demostración. El pitch posterior vuelve a presentar tres plataformas y la política general permite continuar ante riesgos no críticos. Por tanto, no hay una única versión inmutable del alcance.

Base de trabajo propuesta para conciliar el historial: completar primero un flujo real en ChatGPT, conservar adaptadores para las tres plataformas y añadir Claude y Gemini tras validar el núcleo. Mantener WARN con continuación controlada para riesgos no críticos y BLOCK sin excepción para credenciales críticas. Un modo didáctico más restrictivo puede documentarse aparte; no convertirlo silenciosamente en la política general.

Fuera del MVP: archivos adjuntos, PDF, Word, Excel, imágenes, OCR, IA externa, entrenamiento de modelos, aplicaciones móviles o de escritorio, análisis de todo el tráfico, backend, cuentas, autenticación, base de datos externa y panel empresarial.

## 4. Detectores y políticas

Detectores definidos: correo electrónico, teléfono con contexto inicial de México, CURP, RFC de personas físicas y morales, posibles contraseñas con contexto explícito y formatos reconocibles de API keys/tokens.

Usar patrones, validadores y contexto. La entropía solo es auxiliar. Distinguir formato plausible, confianza y severidad: no verificar existencia de identidad ni prometer reconocimiento de cualquier contraseña.

Cada hallazgo debe tener regla, categoría, posiciones inicial/final, confianza, severidad y explicación. El valor sensible solo permanece en memoria mientras se necesita. Resolver duplicados y solapamientos de forma determinista, limitar entrada y evitar expresiones regulares que bloqueen el navegador.

| Acción | Comportamiento |
|---|---|
| ALLOW | Permitir texto sin hallazgos relevantes. |
| WARN | Detener temporalmente; explicar y ofrecer cancelar, editar, proteger o continuar ante riesgo no crítico. |
| SANITIZE | Sustituir coincidencias y volver a evaluar el editor. |
| BLOCK | Impedir el envío de credenciales críticas con suficiente confianza hasta eliminarlas o sustituirlas. |

Prevalece la acción más restrictiva. La autorización de WARN vale solo para el texto evaluado y el intento actual; cualquier cambio la invalida. Las opciones no deben desactivar el bloqueo crítico.

Sustituir por etiquetas como `[CORREO_1]`, `[TELEFONO_1]` y `[CREDENCIAL_1]`, de derecha a izquierda tras resolver solapamientos. Conservar el resto del texto, mostrar vista previa, releer y reevaluar. No conservar mapas reversibles. La sustitución no garantiza anonimización completa.

## 5. Stack definido

Entorno previsto: Linux Mint, VS Code, Node.js y npm; Chrome y Brave, con validación adicional en Windows.

| Tecnología | Uso |
|---|---|
| WXT + Manifest V3 | Desarrollo y empaquetado de la extensión. |
| TypeScript estricto | Dominio, contratos e integración. |
| Vue 3 + CSS propio | Popup, opciones y alertas. |
| Zod | Validación de mensajes y configuración. |
| libphonenumber-js | Validación de candidatos a teléfono. |
| Almacenamiento de extensión | Configuración y eventos mínimos. |
| Vitest | Pruebas del motor. |
| Playwright + Chromium persistente | Pruebas de integración de extensión. |
| ESLint y Prettier | Revisión de código y formato. |

Es el stack acordado en el historial, no una comprobación actual de versiones o APIs. Antes de instalar habrá que revisar documentación oficial, compatibilidad y versiones estables, y conservar package-lock.json. No añadir Go, Python, Docker, Redis ni servicios adicionales al MVP.

## 6. Arquitectura prevista

Flujo: editor → adaptador de plataforma → inspección local → detección → política → permitir o intervenir → corrección → reevaluación.

Configurar WXT con `srcDir: "src"`. El dominio no depende de Vue, APIs del navegador o selectores de plataformas.

```text
src/
  entrypoints/
    background.ts
    chatgpt.content/index.ts
    claude.content/index.ts
    gemini.content/index.ts
    popup/       # index.html, main.ts, App.vue
    options/     # index.html, main.ts, App.vue
  application/   # inspect-prompt, evaluate-submission, protect-prompt
  domain/
    detection/   # detectors, validators, context, entropy, merge-findings, types
    policy/      # evaluate, defaults, types
    sanitization/ # replace-spans, placeholders
  adapters/
    contracts/platform-adapter.ts
    chatgpt/
    claude/
    gemini/
  infrastructure/
    storage/
    messaging/
  ui/
    components/
    styles/
  assets/brand/
  shared/
public/icons/
tests/{unit,integration,e2e,fixtures}/
docs/
```

Cada adaptador reconoce plataforma, localiza editor, lee y reemplaza texto, intercepta envíos, se reconecta tras navegación interna y libera listeners/observadores. Considerar clic, Enter, Shift+Enter, IME, doble clic y reconstrucciones del editor.

Detener el intento soportado antes de análisis asíncrono. Evitar doble envío, recursión y permisos globales para el siguiente evento. Si se pierde compatibilidad, mostrar «Protección no disponible».

No asumir que declarativeNetRequest clasifica cuerpos de prompts ni que webRequestBlocking está disponible en MV3 normal. Interceptar el editor no garantiza cobertura de transmisión de borradores u otros canales de la página.

## 7. Privacidad

Análisis local, sin enviar contenido, hallazgos ni telemetría a servicios externos. Almacenar únicamente configuración y eventos mínimos: fecha, plataforma, categoría, acción y versión de regla. Definir retención limitada y borrado.

No almacenar prompts, secretos, fragmentos originales, conversaciones, hashes del contenido o mapas de sustitución. Usar almacenamiento de la extensión, no window.localStorage del sitio. Empaquetar recursos y código localmente, solicitar permisos de dominios necesarios y evitar `<all_urls>`.

Validar mensajes entre contextos y escapar contenido en la UI. Shadow DOM aísla estilos, no constituye una frontera de seguridad.

## 8. Frontend e identidad

Interfaz en español, profesional y comprensible sin conocimientos de ciberseguridad. Pantallas: popup con plataforma y estado; advertencia; bloqueo crítico; vista previa protegida; opciones; eventos mínimos; estados no compatible/no disponible.

Componentes previstos: BrandLogo.vue, StatusBadge, ActionButton, WarningDialog y FindingsList. Recursos de marca en src/assets/brand/; iconos en public/icons/ a 16, 32, 48 y 128 px. Logo en popup/opciones y versión compacta en alertas. Si no se dispone del original, marcador provisional reemplazable.

Identidad del frontend confirmada mediante las capturas del usuario: verde profundo `#064E3B`, principal `#059669`, esmeralda `#10B981`, menta `#6EE7B7` y fondo `#F0FDF4`. Texto `#0F172A`, blanco `#FFFFFF`, advertencia `#F59E0B`, peligro `#EF4444`, secundario `#64748B` y bordes `#E2E8F0`. Esta referencia sustituye la paleta azul/cian del pitch para la extensión. La guía detallada y las capturas están en [Frontend](diseno/FRONTEND.md).

Temas claro/oscuro/sistema mediante variables CSS. Verde para protección activa, ámbar para advertencias y rojo para bloqueos, siempre acompañados de texto e iconos. Espaciado claro, contraste, foco visible, navegación por teclado, gestión del foco, movimiento reducido y ausencia de desplazamiento horizontal. Credenciales enmascaradas. Las alertas no deben confundir cancelar con continuar ni ocultar acciones.

El usuario aportó el logo de escudo, documento y avión de papel. Se conservó sin editar en `src/assets/brand/logo-original.png`; revisar transparencia y preparar variantes/iconos durante la implementación.

Se recibieron cuatro referencias: pantallas de extensión, paleta principal, colores secundarios/alertas y logo. Usar su estilo respetando la política del MVP: secretos enmascarados, bloqueo crítico sin excepción, sin fragmentos de mensajes guardados y sin activar tarjetas bancarias por aparecer en la imagen. «Proteger y revisar» permite revisar sustituciones antes de enviar.

## 9. Historias y esfuerzo recuperados

Historias centrales: detectar antes del envío, comprender hallazgos, cancelar, continuar ante riesgo no crítico, reemplazar, bloquear credenciales, reducir interrupciones, procesar localmente, configurar ajustes permitidos y demostrar protección sin guardar contenido.

Puntos históricos: detección 8; sustitución 8; bloqueo 5; configuración 5; privacidad 5; reducción de falsos positivos 5; alertas 3; continuación 3; categorías 3; cancelación 2; comprensión 2. Son estimaciones relativas, no horas.

La auditoría planteó 6–10 semanas con tres integrantes dedicando 10–15 horas semanales cada uno. Es estimación, no compromiso ni capacidad comprobada. El MVP local se presupuestó con $0 MXN adicionales obligatorios en servicios de terceros utilizando equipo e internet existentes; excluye tiempo, publicación y servicios opcionales.

## 10. Riesgos y mitigación

Escala histórica: probabilidad × impacto, ambos de 1 a 5. Son valoraciones cualitativas propuestas.

| Riesgo | P × I | Prevención | Contingencia |
|---|---|---|---|
| R1: detección incorrecta | 4 × 5 = 20 | Casos positivos, negativos y difíciles; validadores y ajuste. | Corregir regla y volver a versión validada; no indicar protección si falta cobertura crítica. |
| R2: cambios en plataformas | 3 × 4 = 12 | Adaptadores separados y validación real. | Mostrar no disponible y reparar integración. |
| R3: exposición por la extensión | 2 × 5 = 10 | Análisis local, minimización y revisión de almacenamiento/logs. | Detener función afectada, borrar registros indebidos y corregir. |
| R4: integración fallida | 3 × 4 = 12 | Integración incremental y control de versiones. | Volver a versión estable y reducir funciones accesorias. |
| R5: crecimiento del alcance | 4 × 3 = 12 | Lista fija del núcleo y backlog futuro. | Congelar ampliaciones y terminar el flujo esencial. |

## 11. Validación y definición de terminado

Preparar 60 mensajes sintéticos: 20 sensibles, 20 benignos y 20 difíciles. Medir detecciones, falsos positivos/negativos, interrupción efectiva, tiempo de análisis y privacidad del registro. No anunciar porcentajes antes de medir.

Verificar sustitución, Unicode, solapamientos, contexto de contraseñas, cadenas aleatorias benignas, reanálisis, autorización ligada al texto, cancelación, bloqueo sin petición al endpoint de prueba, clic/Enter/Shift+Enter/IME/doble clic, reconexión y persistencia sin datos sensibles.

Las pruebas locales demuestran comportamiento en fixtures. Mantener una matriz separada de validación manual por plataforma, navegador, fecha y mecanismos de envío. Una compilación exitosa no demuestra prevención en un sitio real.

Entregar código compilable, tipos/lint/pruebas pertinentes, README con comandos y carga en Chrome/Brave, arquitectura, reglas, privacidad, limitaciones y plataformas verificadas. La simulación local debe estar identificada como tal.

## 12. Demostración, impacto y visión futura

Demo: mensaje benigno → advertencia por dato personal → corrección/sustitución → credencial sintética bloqueada → reevaluación. Permitir participación del jurado y llevar respaldo local. Explicar el beneficio antes de la arquitectura.

Pitch de cinco minutos: problemática, solución, MVP, factibilidad/costo, riesgos, impacto y conclusión. Existen versiones de ocho y nueve diapositivas; no son una sola presentación. Referencias históricas: [presentación del pitch](https://canva.link/ohpmjztmojxaxzp), [versión de nueve diapositivas](https://www.canva.com/d/QEj-F6F9ff8pVG0) y [otra importación de nueve diapositivas](https://www.canva.com/d/ACQ7GN_OuMy1BRa). No se verificó su estado actual durante esta recopilación.

Objetivo de concurso: prototipo funcional, interactivo, didáctico y defendible por el equipo. El historial menciona registro el 11 de noviembre, selección el 13, entrega impresa el 18 y presentación el 24 de noviembre de 2026; son fechas recuperadas, pendientes de cotejo con las bases antes de trámites. También refiere documento de 5–10 cuartillas y declaración del uso de IA; revisar la convocatoria original para requisitos definitivos.

Teoría del cambio: detección local + explicación + corrección antes del envío → reconocimiento del riesgo → mejores hábitos → menor exposición accidental. Impactos esperados: tecnológico y social. Ahorro económico y reducción real de incidentes necesitan evidencia; no atribuir impacto ambiental sin medir.

Visión futura: archivos, OCR, NER, agente Go/Native Messaging, Fiber/PostgreSQL, consola, políticas institucionales, SSO/RBAC/SIEM y gateway. Se exploró enfoque México/universidades/privacidad y detectores NSS, CLABE, matrícula, IP u otros. Ninguno forma parte automática del MVP. Monetización futura explorada: personal gratis, Pro, educación y licencias empresariales; sin precios ni modelo comercial validado.

## 13. Próximo trabajo propuesto

1. Usar las capturas y el logo ya incorporados para construir los componentes de UI.
2. Preparar proyecto WXT/Vue/TypeScript y revisar compatibilidad oficial.
3. Completar un flujo con correo sintético en ChatGPT: detectar, detener, corregir, reevaluar y enviar.
4. Ampliar motor y políticas, interfaz de advertencia/bloqueo y vista previa.
5. Integrar Claude y Gemini después de validar el núcleo.
6. Completar opciones, eventos, pruebas y documentación con evidencia real.

Esta recopilación no inicia la implementación del producto; deja el contexto listo para la siguiente etapa.
