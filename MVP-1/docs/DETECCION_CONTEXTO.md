# Ampliación de texto pendiente · Reglas 1.2.0

Actualización 1.3.0: [detección sin plantilla y teléfonos internacionales](DETECCION_TEXTO_LIBRE.md). Las limitaciones anteriores sobre mayúsculas, etiquetas obligatorias y teléfonos solo de México quedan sustituidas por ese alcance.


El usuario pidió completar las categorías restantes antes de la Fase 5 y eligió expresamente: «Completar texto; archivos y OCR en otra fase». Se añaden siete categorías a las diez anteriores: el motor dispone ahora de diecisiete categorías de texto. No se incorpora extracción de archivos ni reconocimiento de imágenes.

## Reglas añadidas

| Categoría | Comprobación local | Ejemplo sintético | Sustitución |
|---|---|---|---|
| INE | CIC de 9 cifras; identificador OCR de 12/13 cifras con etiqueta INE; clave de elector de 18 caracteres con estructura y fecha plausibles. Requiere contexto del documento. | `CIC del INE: 123456789` | `[INE_n]` |
| Pasaporte | Etiqueta pasaporte y valor alfanumérico de 6–12 caracteres, con al menos una cifra. | `Pasaporte: G12345678` | `[PASAPORTE_n]` |
| Licencia de conducir | Etiqueta completa y valor de 5–20 caracteres alfanuméricos/guiones, con alguna cifra. | `Licencia de conducir: CDMX-1234567` | `[LICENCIA_n]` |
| Nombre | Etiqueta nombre/nombre completo/paciente/titular y 2–6 palabras con mayúsculas; admite acentos, apóstrofes y conectores de apellidos. | `Nombre completo: María del Carmen López` | `[NOMBRE_n]` |
| Domicilio | Etiqueta domicilio/dirección, una vía reconocible y numeración. Campo acotado a 220 caracteres. | `Domicilio: Calle Ejemplo 123, Colonia Centro` | `[DOMICILIO_n]` |
| Nacimiento | Fecha identificada como nacimiento, fecha real de calendario desde 1900, no futura. dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa, aaaa-mm-dd o mes escrito en español. | `Fecha de nacimiento: 14/02/1990` | `[NACIMIENTO_n]` |
| Salud/expediente | Diagnóstico, tratamiento, alergias o expediente clínico/médico explícitos; campo acotado a 180 caracteres. Un diagnóstico sin referencia personal requiere vocabulario clínico reconocido. | `Diagnóstico del paciente: alergia al polen` | `[SALUD_n]` |

Son reglas de contexto, no reconocimiento general de entidades ni comprobaciones oficiales. La etiqueta suele ir seguida de `:`, `=` o `es`; también se reconoce «nací el …». Los ejemplos son datos de prueba sin titular verificado. El identificador denominado OCR en una credencial se analiza como texto escrito, no mediante OCR de una imagen.

INE no consulta padrón, dígitos oficiales de control o vigencia. Los rangos de pasaporte/licencia son heurísticas conservadoras de longitud con contexto, no validadores universales ni una homologación de formatos de todos los países/estados. Se rechazan secuencias numéricas uniformes. Nombre aislado, nombre en minúsculas, abreviaturas o documentos sin etiqueta pueden quedar sin detectar.

Domicilio exige vía y número; no geocodifica ni reconoce todas las direcciones rurales/internacionales. En campos de dirección/salud se conservan delimitadores al sustituir, pero no se interpreta libremente toda una oración. Para pruebas y datos extensos se recomiendan campos separados por líneas o punto y coma. No se identifican todos los síntomas, tratamientos, resultados de laboratorio, enfermedades o expedientes: se protegen los campos con contexto reconocido, sin deducir un diagnóstico de una consulta general.

## Política, interfaz y privacidad

Las siete categorías usan severidad high y WARN con las advertencias personales activas. Respetan ese ajuste. Password/API key/token mantienen BLOCK obligatorio. Los secretos prevalecen sobre coincidencias solapadas de categorías personales. Las sustituciones no equivalen a anonimización completa.

Detección, popup, advertencias, comparación Antes/Después, nombres del historial y demostración incluyen la cobertura nueva. La demostración ofrece «Identidad, domicilio y salud ficticios» con las siete categorías juntas. No se modifica el diseño aprobado.

La comparación conserva valores personales solo en la revisión actual; las credenciales siguen enmascaradas. El worker y el historial reciben únicamente metadatos de categoría, acción y versión. Se aceptan eventos anteriores; no cambia el formato de ajustes ni se añaden permisos de host o servicios externos.

## Referencias

- [INE, Lista Nominal](https://listanominal.ine.mx/): identificadores de credencial y modelos.
- [INE, ABC de la Credencial](https://ine.mx/wp-content/uploads/2019/12/DERFEABCCRDENCIAL2025.pdf): elementos visibles e identificadores.
- [CDMX, campos del validador INE](https://data.finanzas.cdmx.gob.mx/formato_lc/validacionINE): CIC 9 cifras, OCR 13 cifras y clave de elector 18 caracteres.

Estas referencias apoyan estructura/longitud; la extensión no llama a esos servicios.

## Verificación final

222 pruebas unitarias, 16 de integración sobre fixtures y 13 de interfaz correctas. La comprobación de identidad/salud se repitió sobre la última compilación. Typecheck, build y formato correctos. Se comprueban valores enmascarados antes de proteger, siete sustituciones con reevaluación limpia, conservación de JSON, política crítica y ausencia de valores originales en peticiones protegidas/historial. Captura: `docs/diseno/capturas/cobertura-identidad-salud.png`.
