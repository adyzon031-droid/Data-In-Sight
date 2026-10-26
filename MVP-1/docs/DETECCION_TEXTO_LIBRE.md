# Corrección de detección sin plantilla · Reglas 1.3.0

El usuario señaló que el motor exigía escribir campos exactos y solo reconocía teléfonos de México. Proporcionó un teléfono nacional sin etiqueta y un nombre completo en minúsculas como casos de regresión. Ambos se prueban localmente sin enviarlos a servicios externos.

## Cambios

- Teléfonos válidos sin etiqueta: ya no se exige teléfono/WhatsApp antes del número.
- Prefijos internacionales + y 00: se comprueban con los planes de numeración de libphonenumber-js, sin filtrar a México. También se admiten extensiones que reconoce la biblioteca y alias anexo/interno.
- País de números sin prefijo: nuevo ajuste en General. México se aplica por defecto a instalaciones existentes; el usuario puede seleccionar otro país. Los números con prefijo internacional se revisan independientemente de esa selección. No se prueban a ciegas todos los países sobre una misma secuencia nacional.
- Nombres en minúsculas: los campos de persona dejan de exigir mayúsculas. Se reconocen frases como «me llamo …» y nombres probables en texto libre mediante vocabulario local de nombres comunes, conectores y apellidos.
- Campos personales: se acepta separación por espacio además de dos puntos, igual o «es». Se añaden variantes como licencia de manejo, pasaporte número y seguro social.
- Direcciones: vía y numeración pueden reconocerse sin la palabra domicilio.
- Salud: se reconocen algunas declaraciones personales como «tengo diabetes tipo 2» o «padezco asma», evitando convertir una pregunta general sobre una enfermedad en información de salud de alguien.

No cambia el catálogo de 17 categorías ni la política de credenciales críticas. El bloqueo obligatorio sigue activo. La sustitución usa las mismas etiquetas, comparación y reevaluación, y el registro sigue guardando únicamente metadatos.

## Criterios y límites

La detección de nombres es heurística, no un modelo general de reconocimiento de entidades. El vocabulario local no incluye todos los nombres, idiomas o formas de escribir apellidos. Un nombre público también puede ser una coincidencia personal: el motor no determina si es privado ni confirma identidades. Se excluyen algunas combinaciones ambiguas («luz solar», «rosa roja») y se interrumpe el nombre ante palabras comunes de una oración, para reducir sustituciones de texto ajeno.

Una secuencia nacional sin prefijo es ambigua; su interpretación depende del país elegido. Los planes de numeración validan plausibilidad, no titular, asignación real ni servicio activo. Los folios/referencias/pedidos explícitos no se convierten automáticamente en teléfonos. No se extrae un fragmento telefónico de una secuencia numérica más larga. Los números internacionales no necesitan pertenecer al país seleccionado, incluidos planes no geográficos si la biblioteca los considera válidos.

La normalización de 00 mantiene la misma longitud UTF-16 y solo se aplica al comienzo de un posible número; no transforma grupos internos con ceros. Las extensiones se sustituyen junto con el teléfono. Los índices de nombres y números conservan el texto original, incluidos acentos, minúsculas y emojis.

Una fecha aislada no identifica por sí sola un nacimiento. Documentos con formato ambiguo y números de identificación siguen necesitando señales suficientes de contexto; no se etiqueta arbitrariamente cualquier número como NSS, pasaporte o INE. Los patrones de direcciones y salud no cubren todo el lenguaje natural. No se promete anonimización completa.

## Ajustes y compatibilidad

Se añade phoneRegion como código de país soportado. settingsSchema completa MX cuando el campo no existe; no hace falta borrar los ajustes anteriores. Un país inválido se rechaza, en lugar de desactivar silenciosamente la revisión. Cambiar el país invalida la revisión/confirmación anterior, igual que los demás cambios de política. La versión de reglas pasa a 1.3.0; los eventos de versiones previas siguen siendo legibles.

## Verificación

Casos nuevos: teléfono y nombre sin etiquetas, idiomas de prefijo y extensiones, números nacionales de España/Reino Unido/EE. UU., países internacionales con región distinta, nombres en minúsculas y con conectores, lenguaje natural, conservación de texto y offsets, direcciones, fechas/folios/frases generales, credenciales críticas, compatibilidad de ajustes y política al cambiar el país. La integración prueba la sustitución en el editor y que la solicitud protegida/historial no conserven los valores originales.

En Demostración se incluye «Texto libre y teléfonos internacionales», con datos de ejemplo que no reutilizan los valores de regresión aportados por el usuario. La validación automática sobre fixtures no sustituye las pruebas manuales pendientes en Claude/Gemini real.

Referencia de biblioteca: [libphonenumber-js, búsqueda de teléfonos, regiones y extensiones](https://github.com/catamphetamine/libphonenumber-js#findphonenumbersintexttext-string-defaultcountry-string--options-object-object).

## Resultado final

299 pruebas unitarias, 40 de integración sobre fixtures y 14 de interfaz correctas. Typecheck, build Chrome MV3 y formato correctos. Se restauró Chromium en la carpeta temporal de pruebas antes de ejecutarlas. Evidencia visual: `docs/diseno/capturas/texto-libre-internacional.png`. El texto de esa demostración usa ejemplos distintos de los aportados por el usuario.
