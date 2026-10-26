# Pruebas de límites del DLP

Fecha: 20 de octubre de 2026. Motor: **1.3.1**.

Se ejercitaron las 17 categorías actuales, sustitución, privacidad del informe y del historial, configuración y los flujos de envío de la extensión. Esta es una revisión reproducible del MVP con ejemplos sintéticos; no mide una tasa de detección sobre datos del mundo real ni garantiza detección universal.

## Correcciones encontradas durante la revisión

| Caso reproducido | Antes | Resultado corregido |
| --- | --- | --- |
| `ｐａｓｓｗｏｒｄ＝synthetic` o números de ancho completo | No se reconocía | Vista normalizada para detectar; sustitución sobre el texto original |
| Un separador invisible U+200B dentro de `example.com` o una credencial | Podía interrumpir la detección | Se omiten separadores invisibles comunes al analizar, conservando los índices originales |
| `password="first` + salto de línea + `second"` | Se sustituía solo la primera línea y podía quedar un residuo sin hallazgos | Se sustituye el valor completo entre comillas, también con CRLF y escapes |
| `«alumno@example.com»` | No se reconocía el correo | Se detecta el correo y se conservan las comillas |
| `Domicilio: Calle Ejemplo 123, correo alumno@example.com` | El domicilio absorbía el siguiente campo | Dos sustituciones con límites independientes |
| JWT compacto reconocible sin `token=` ni `Bearer` | No se reconocía | Bloqueo y sustitución con informe enmascarado |
| `josé@example.com`, `用户@example.com`, acentos descompuestos | No se reconocía la parte local Unicode | Se detecta y sustituye el correo completo |

La normalización cubre ASCII de ancho completo, espacio ideográfico y U+200B/U+200C/U+200D/U+2060/U+FEFF. No convierte cualquier carácter visualmente parecido ni decodifica cualquier representación. El texto original conserva su forma fuera de los fragmentos sustituidos. No se envía nada a un servicio de normalización.

El reconocimiento de JWT usa cabecera y contenido JSON decodificados localmente, tres segmentos y un segmento de firma de longitud acotada. **No verifica autenticidad, firma, caducidad ni permisos**. El formato se basa en [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519); no cubre todos los JWT/JWE ni todos los tamaños posibles.

## Matriz por categoría

Cada una tiene seis variantes nuevas: original, emoji y puntuación, CRLF, ancho completo, separadores invisibles y combinación Unicode. Se comprueban decisión, índices UTF-16, sustitución, ausencia de hallazgos residuales para esos casos e idempotencia. Las pruebas anteriores aportan casos inválidos y falsos positivos.

| Categoría | Comprobado | Límite relevante |
| --- | --- | --- |
| Correo | Formatos habituales, etiquetas, puntuación y parte local Unicode | No es un parser completo de correo internacional; ofuscación e IDN no tienen cobertura general |
| Teléfono | Nacional por región, internacional, prefijo `00`, extensiones | Sin prefijo depende del país configurado; no verifica línea activa |
| CURP | Estructura, fechas y entidades plausibles | No consulta registro ni demuestra titularidad |
| RFC | Formato y fechas plausibles | No consulta SAT ni demuestra existencia |
| CLABE | Longitud y dígito verificador | No verifica banco, cuenta activa ni propietario |
| Tarjeta | Luhn, prefijos habituales o contexto explícito | No consulta emisor ni confirma actividad; prefijos nuevos pueden necesitar etiqueta |
| NSS | Etiqueta y longitud | No se acredita autenticidad con IMSS |
| INE | CIC/OCR/clave con contexto y estructura | Un número aislado ambiguo no implica INE |
| Pasaporte | Identificador con contexto | No cubre todas las estructuras de todos los países |
| Licencia | Identificador con contexto | No valida emisores, vigencia ni todas las jurisdicciones |
| Nombre | Campo explícito y vocabulario local en texto libre | No es reconocimiento universal de personas |
| Domicilio | Vías en español, número y campo explícito | Cobertura parcial de interiores, formatos extranjeros y texto narrativo |
| Nacimiento | Fechas válidas con contexto, bisiestos y fechas no futuras | Una fecha aislada no se clasifica como nacimiento |
| Salud | Campos clínicos y algunas frases en primera persona | Vocabulario y expresiones limitados; no interpreta diagnósticos |
| Contraseña | Asignaciones, comillas, escapes y varias líneas | Una cadena aislada sin contexto es ambigua |
| Clave API | Asignaciones y prefijos implementados | No reconoce todos los proveedores ni formatos futuros |
| Token | Asignaciones, Bearer, GitHub clásico y JWT compacto reconocible | Faltan otros formatos; no valida la credencial |

También se prueba una entrada con las 17 categorías juntas, cientos de correos repetidos, etiquetas preexistentes, secreto que contiene otro dato, informe sin valores de credenciales y ajustes que desactivan advertencias personales sin desactivar el bloqueo de secretos.

## Fallos y límites pendientes, reproducidos

Estos casos **siguen pendientes**, aunque las pruebas de regresión pasen. Los ejemplos se pueden pegar en la demostración local.

| Prioridad | Ejemplo sintético | Comportamiento observado | Trabajo siguiente |
| --- | --- | --- | --- |
| Alta | Token con prefijo `github_pat_`, 22 letras, `_` y 59 letras | Sin hallazgo cuando aparece solo | Incorporar formatos adicionales de secretos con corpus positivo y negativo |
| Alta | `qi zhang` | Sin nombre reconocido | Evaluar reconocimiento local más amplio; una lista creciente no resuelve todos los nombres |
| Alta | `Soy alérgico a la penicilina` | Sin hallazgo de salud | Ampliar patrones narrativos, negaciones y delimitación del dato |
| Media | `123 Example Street, London` | Sin domicilio reconocido | Añadir formatos por país e idioma |
| Media | `alumno [arroba] example [punto] com` | Sin correo reconocido | Diseñar normalización de ofuscaciones sin clasificar explicaciones como direcciones |
| Media | `pаssword=synthetic-secret`, con «а» cirílica | Sin credencial reconocida | Tratar homoglifos con reglas acotadas y pruebas de falsos positivos |
| Media | `La contraseña es importante para la seguridad` | Bloquea `importante` como contraseña | Resolver ambigüedad entre prosa y asignación, conservando la detección de contraseñas simples |
| Limitación deliberada | Dos teléfonos unidos solo por un espacio: `5512345678 7731112030` | No separa la cadena numérica | Exige separación clara para evitar extraer teléfonos de identificadores largos; estudiar segmentación con contexto |
| Limitación deliberada | `syntheticPass!123` sin contexto | Sin hallazgo | No inferir que toda cadena mixta es una contraseña |

No se han corregido esos casos mediante excepciones que simplemente oculten los ejemplos. Requieren ampliar cobertura o resolver ambigüedades con más pruebas.

## Extensión, envíos y privacidad

Se ejecuta la extensión compilada en Chromium con perfiles temporales y páginas simuladas bajo los tres dominios. Sus peticiones de envío se interceptan localmente; los ejemplos no llegan a los proveedores.

- Clic, Enter y formulario reconocido; cancelación, continuación única, doble clic, IME y Shift+Enter.
- Reevaluación al cambiar texto, editor, ruta o configuración; configuración ausente/corrupta y cambio de región telefónica.
- Sustitución en el modelo del editor, revisión antes del envío y rechazo de edición cancelada.
- Casos nuevos: credencial Unicode y multilínea más correo con separador invisible; dos editores visibles en Claude/Gemini; bloqueo por longitud en las tres plataformas.
- Historial y mensajería con esquemas estrictos de metadatos; no se guardan valores, textos protegidos ni contenido de mensajes. Credenciales enmascaradas en el informe transitorio.
- Navegación, temas, accesibilidad del diálogo, persistencia, logo y tipografías de la interfaz.

**Límites del entorno:** los fixtures no ejecutan las aplicaciones reales de ChatGPT, ProseMirror/Claude o Quill/Gemini. La validación autenticada de Claude sigue pendiente por decisión previa del usuario. Esta ejecución no acredita compatibilidad actual con todas las variantes de los sitios reales.

**Límites de intercepción:** solo se cubren controles, rutas y eventos reconocidos. Si cambia el DOM o hay un editor ambiguo, la extensión muestra indisponibilidad. No es un cortafuegos de red y no impide cualquier envío programático o mecanismo ajeno a esos controles. No se hicieron pruebas nuevas de evasión mediante `fetch` directo o `form.submit()`; esos caminos no deben considerarse protegidos.

**Límites de tamaño:** máximo 20.000 unidades UTF-16; excederlo bloquea la revisión sin autorizar continuar. La sustitución en editores enriquecidos tiene un límite adicional de 256 saltos de línea; ese umbral consta en el código, pero sus extremos exactos no se probaron en esta ejecución. Archivos, imágenes y OCR permanecen fuera de esta fase, como se acordó.

## Carga observada

Medición exploratoria local de `protectPrompt`, que incluye inspección antes y después, con entradas sintéticas. Son muestras de una ejecución inicial durante esta revisión, no un benchmark estadístico ni un compromiso de latencia.

| Entrada | Tamaño UTF-16 | Tiempo aproximado | Resultado |
| --- | ---: | ---: | --- |
| 1.000 correos repetidos | 20.000 | 70 ms | 1.000 sustituciones, sin hallazgos residuales |
| Contraseña con comilla sin cierre | 20.000 | 6 ms | Un valor sustituido |
| Dígitos separados por espacios | 20.000 | 633 ms | Sin hallazgos; caso lento para seguir midiendo |
| Separadores invisibles | 20.000 | 4 ms | Sin hallazgos |
| Etiquetas `password` sin asignación | 19.800 | 12 ms | Sin hallazgos |

Conviene perfilar el caso numérico antes de aumentar el límite de entrada. No se midieron percentiles, consumo máximo de memoria, dispositivos lentos ni rendimiento sostenido.

## Reproducción y resultados

```sh
npm test
npm run typecheck
npm run format:check
npm run build
PLAYWRIGHT_BROWSERS_PATH=/tmp/dis-playwright npm run test:integration
PLAYWRIGHT_BROWSERS_PATH=/tmp/dis-playwright npm run test:ui
```

La instalación de Chromium en esa ruta es un requisito del entorno local. Las pruebas de integración requieren compilar primero la extensión.

- Motor y contratos: **430 pruebas correctas**, 131 nuevas respecto de la base de 299.
- Integración: **48 pruebas correctas** sobre fixtures, ocho nuevas.
- Interfaz: **14 pruebas correctas**.
- Tipos, formato y compilación: correctos.

Las pruebas nuevas del motor están en `tests/unit/limits.test.ts`. Los casos nuevos de navegador están en `tests/integration/chatgpt.spec.ts` y `tests/integration/rich-platforms.spec.ts`. Los resultados corresponden a escenarios concretos, no a un porcentaje de cobertura de todos los datos personales posibles.
