# Motor DLP local · Fase 2

Actualización 1.3.0: [detección sin plantilla y teléfonos internacionales](DETECCION_TEXTO_LIBRE.md). Las limitaciones anteriores sobre mayúsculas, etiquetas obligatorias y teléfonos solo de México quedan sustituidas por ese alcance.


Actualización previa a Fase 5: se incorporaron CLABE, tarjetas, NSS e [identidad, domicilio, nacimiento y salud](DETECCION_CONTEXTO.md). Archivos y OCR se reservaron para otra fase por decisión del usuario. Ver también [reglas financieras](AMPLIACION_DATOS.md). Las secciones históricas siguientes describen la fase original.

Implementado el 19 de octubre de 2026. Este módulo analiza y transforma texto en memoria. No intercepta envíos: la integración con la extensión corresponde a las fases siguientes.

## API pública

Importar desde `src/application/index.ts`:

```ts
import { inspectPrompt, protectPrompt, DEFAULT_SETTINGS } from './src/application';

const inspection = inspectPrompt('Correo: alumno@example.com', DEFAULT_SETTINGS);
// decision: WARN, canContinue: true, hallazgo email con posiciones UTF-16.

const result = protectPrompt('password="valor-sintetico"');
// text: password="[CREDENCIAL_1]", replacementCount: 1,
// inspection: ALLOW sin hallazgos.
```

También se exportan Settings, Inspection, Finding, Category, Severity, Decision, ProtectionResult, settingsSchema y MAX_INPUT_LENGTH. No se requieren Vue, DOM, APIs de extensión, red ni almacenamiento. No hay logs del contenido.

`inspectPrompt(text, settings?)` valida ajustes con Zod, limita la entrada a 20 000 unidades UTF-16, ejecuta detectores, resuelve solapamientos y evalúa política. Los ajustes inválidos producen un error de validación; el integrador debe mostrar un error y detener el intento, nunca interpretar una excepción como permiso de envío.

`protectPrompt(text, settings?)` calcula sus propios hallazgos para el texto actual, sustituye intervalos y vuelve a inspeccionar el resultado. El texto original y protegido solo existen en memoria. El integrador debe volver a leer el editor tras escribir el resultado y verificarlo de nuevo.

Si se supera el límite: BLOCK, canContinue=false, analysisError=INPUT_TOO_LARGE y findings vacío. Esto significa análisis no realizado, no ausencia de riesgo. protectPrompt conserva el texto original, no lo trunca y no realiza sustituciones. La interfaz debe explicar que hay que reducir el tamaño; no mostrar ese texto como protegido.

## Reglas versión 1.0.0

| Regla | Cobertura | Política inicial |
|---|---|---|
| email.format | Correos ASCII de formato plausible, etiquetas de dominio válidas y límites de longitud; tolera envolturas comunes. | WARN |
| phone.mx | Números de México con metadatos max de libphonenumber-js. Formato nacional requiere etiqueta tel/teléfono/phone/cel/celular/WhatsApp/contacto; +52 no requiere etiqueta. | WARN |
| curp.plausible | Estructura de 18 caracteres, fecha de calendario, siglo por posición 17 y clave de entidad contemplada. | WARN |
| rfc.plausible | Prefijo de 3/4 letras (incluye Ñ y &), fecha de calendario y 3 caracteres finales. | WARN |
| secret.context.* | Asignaciones explícitas password/passwd/pwd/contraseña/contrasena, api_key/api-key/api key, access_token/auth_token/secret/token. Separador `:`, `=`, `es` o `is`; admite comillas, valores con espacios entre comillas y prefijos env como DB_PASSWORD u OPENAI_API_KEY. | BLOCK |
| secret.github-classic | Prefijos ghp/gho/ghu/ghs/ghr seguidos de guion bajo y 36 caracteres alfanuméricos. | BLOCK |
| secret.aws-access-id | AKIA más 16 caracteres mayúsculos/dígitos. Es un identificador de acceso protegido por precaución, no prueba de un secreto completo. | BLOCK |
| secret.sk-prefix | Prefijo sk-, con proj-/svcacct- opcionales, y cuerpo alfanumérico/guion/guion bajo de 20–256 caracteres. Heurística de prefijo, no validación de proveedor. | BLOCK |
| secret.bearer | Bearer seguido de candidato de 12 o más caracteres compatibles con el patrón de token definido. | BLOCK |

Las asignaciones de contraseña protegen incluso valores débiles de un carácter. Las etiquetas `[CORREO_n]`, `[TELEFONO_n]`, `[CURP_n]`, `[RFC_n]` y `[CREDENCIAL_n]` se reconocen como sustituciones para no volver a bloquear el resultado del motor.

No se verifica existencia, pertenencia, vigencia, homoclave/dígito de RFC ni dígito de CURP. No se consulta RENAPO/SAT ni se intenta autenticar credenciales. El score de confianza es una señal de regla, no una probabilidad calibrada.

## Políticas y datos

Severidades: medium para correo/teléfono, high para CURP/RFC y critical para credenciales reconocidas. Un crítico con confianza >=0.9 produce BLOCK sin excepción. Con los valores iniciales las coincidencias personales producen WARN y el texto sin coincidencias produce ALLOW.

Settings permite tema, advertencias de datos personales, registro de eventos y retención de 1–30 días. Valores iniciales: system, advertencias activas, registro activo y 7 días. El motor no utiliza el ajuste de registro para guardar nada: no implementa almacenamiento. warnOnPersonalData=false permite PII en la política, pero no deshabilita detectores ni bloqueo crítico. La operación explícita de proteger sigue sustituyendo los datos encontrados.

canContinue=true solo significa que una advertencia no crítica permite ofrecer la acción. No es un permiso reutilizable. El integrador debe vincular la confirmación al texto y al intento actual e invalidarla si cambian.

Cada Finding contiene id local, regla/versión, categoría, intervalo [start,end) UTF-16, confianza, severidad y explicación fija. No contiene valor, fragmento, hash ni prompt. Los IDs dependen del orden de hallazgos, no del contenido sensible.

Los solapamientos se resuelven primero por severidad, después confianza, longitud, inicio e identificador de regla. El resultado no depende del orden de detectores y se devuelve ordenado por posición. La sustitución recorre intervalos de derecha a izquierda y asigna etiquetas por aparición; evita colisiones con etiquetas ya presentes. No genera un diccionario para recuperar originales.

## Comprobaciones realizadas

```bash
npm test
npm run typecheck
npm run build
```

110 pruebas pasan. El corpus base tiene 60 escenarios identificados: 20 sensibles, 20 benignos y 20 difíciles. El resto comprueba sustitución y reevaluación, conservación de texto, Unicode, datos repetidos, comillas escapadas/sin cerrar, ajustes, límites, determinismo, ausencia de valores en Inspection y precedencia de hallazgos.

Se incluyen casos de texto adversarial al límite con un timeout de prueba. Esto no es una auditoría formal de complejidad ni una medición de rendimiento en todas las computadoras. Las cifras describen este corpus y no representan una tasa de detección en datos reales.

La compilación del popup/opciones sigue sin importar el motor: se comprueba por separado mediante tipos y Vitest. No hay evidencia todavía de bloqueo de peticiones en navegador; eso se probará en la fase de integración.

## Límites conocidos

- No detecta todas las contraseñas o claves arbitrarias ni formatos nuevos de proveedores.
- JWT sin etiqueta/token Bearer y credenciales codificadas u ofuscadas no tienen detector dedicado. Los valores con contexto pueden quedar protegidos aunque no se reconozca su formato.
- Los teléfonos nacionales sin etiqueta se omiten para reducir confusión con folios; solo se cubre México.
- CURP/RFC no contemplan todas las excepciones históricas, errores de escritura o formatos separados; algunos identificadores plausibles pueden ser públicos o ficticios.
- Correos internacionalizados y sintaxis avanzada con local-part entre comillas quedan fuera.
- Asignaciones como «contraseña es importante» pueden producir un falso positivo. Las reglas de contexto son deliberadamente restrictivas ante exposición de credenciales y requieren ajuste con evidencia.
- Sintaxis compleja de lenguajes, texto ofuscado, archivos e imágenes quedan fuera. Sustituir coincidencias no garantiza anonimización completa.

## Referencias de implementación

- [libphonenumber-js: búsqueda de números y metadatos](https://github.com/catamphetamine/libphonenumber-js#readme).
- [Vitest: ejecución de pruebas](https://vitest.dev/guide/).
- [RENAPO: estructura de CURP](https://www.gob.mx/segob/renapo/es/articulos/sabes-como-se-conforma-tu-curp?idiom=es).
- [Gobierno de México: longitud de RFC físico y moral](https://www.gob.mx/cms/uploads/attachment/file/850663/Dato-6_RFC.pdf).

Las reglas son una aproximación local de protección, no una implementación oficial de emisión o validación de identidades.
