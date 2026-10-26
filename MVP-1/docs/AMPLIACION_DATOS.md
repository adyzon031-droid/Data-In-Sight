# Ampliación previa a la Fase 5 · Reglas 1.1.0

Actualización 1.3.0: [detección sin plantilla y teléfonos internacionales](DETECCION_TEXTO_LIBRE.md). Las limitaciones anteriores sobre mayúsculas, etiquetas obligatorias y teléfonos solo de México quedan sustituidas por ese alcance.


Actualización: la ampliación continúa en [reglas de contexto 1.2.0](DETECCION_CONTEXTO.md), con INE, pasaporte, licencia, nombre, domicilio, nacimiento y salud. Este documento detalla la primera incorporación financiera.


Por petición del usuario se añaden CLABE, tarjetas bancarias y NSS de México al motor y a la extensión. No se inicia aún la integración de otras plataformas. Las siete categorías anteriores siguen activas; ahora existen diez.

| Categoría | Criterio | Etiqueta | Política inicial |
|---|---|---|---|
| CLABE | 18 dígitos y control módulo 10 con pesos 3/7/1 | `[CLABE_n]` | WARN |
| Tarjeta | 13–19 dígitos con Luhn y contexto explícito de tarjeta, o formatos comunes de Visa/Mastercard/Amex/Discover | `[TARJETA_n]` | WARN |
| NSS | 11 dígitos con etiqueta NSS, número de seguridad social o número de seguro social | `[NSS_n]` | WARN |

Las tres categorías tienen severidad high y respetan el ajuste de advertencias personales. Las credenciales mantienen su bloqueo obligatorio. NSS no comprueba el dígito de control; se reconoce por longitud/contexto. No se consulta el IMSS ni una entidad financiera. Ninguna regla confirma existencia, vigencia, titularidad o capacidad de realizar operaciones.

## Formatos y ambigüedades

Se admiten cifras continuas y separadores simples de espacio, espacio no separable, espacio estrecho no separable o guion. No se unen cifras a través de saltos de línea ni se aceptan fragmentos dentro de identificadores alfanuméricos o secuencias numéricas más largas. Se omiten secuencias de una sola cifra repetida. Listas de números adyacentes separadas solo por espacios pueden interpretarse como un único bloque y quedar sin detectar.

CLABE puede detectarse sin etiqueta cuando cumple longitud/control. Para tarjetas sin etiqueta se cubren Visa de 13/16/19 cifras, Mastercard de 16 cifras en rangos 51–55 y 2221–2720, Amex de 15 cifras con 34/37, Discover de 16 cifras con 6011/65. Otras longitudes/rangos requieren contexto explícito y Luhn. No se mantiene un catálogo completo de emisores. Una CLABE plausible y una tarjeta pueden coincidir matemáticamente: el contexto explícito de tarjeta prevalece; sin contexto se prioriza CLABE cuando sus 18 cifras cumplen el control.

CVV, vencimiento, cuentas bancarias genéricas, INE, pasaporte, domicilios y nombres no incorporan detectores nuevos en esta ampliación. Valores con errores de control pueden quedar sin detectar; la sustitución no garantiza anonimización completa.

## Interfaz y privacidad

Las nuevas categorías aparecen en Detección, popup, advertencias, comparación y nombres del historial. Demostración incluye un ejemplo conjunto para probarlas. Antes de proteger, los valores siguen ocultos; al proteger, la comparación muestra el dato personal y su etiqueta exacta en memoria. El original no se persiste ni se envía al worker. Las credenciales siguen enmascaradas en el informe.

Mensajería y almacenamiento aceptan las nuevas categorías como metadatos con versión de regla 1.1.0 y mantienen compatibilidad con eventos anteriores. Siguen rechazando valores/campos adicionales. No cambia el formato de ajustes ni se necesitan permisos de navegador adicionales.

## Referencias y ejemplos

- [Federal Reserve, FedGlobal ACH Payments Origination Manual](https://www.frbservices.org/binaries/content/assets/crsocms/financial-services/ach/global-service-orig-manual.pdf), página impresa 18: algoritmo CLABE y ejemplo `103150124152345786`. Se usa exclusivamente como ejemplo publicado; no se le atribuye un titular ni se hacen transferencias.
- [Stripe, tarjetas de prueba](https://docs.stripe.com/testing): números de prueba y controles de formato/Luhn. El ejemplo de demostración usa `4242 4242 4242 4242`; no se realizan cobros ni peticiones a Stripe.
- [IMSS, metadatos](https://datos.imss.gob.mx/sites/default/files/Metadatos.pdf): NSS de 11 posiciones. El ejemplo NSS `12345678903` es sintético, sin verificación oficial.

Las pruebas cubren controles correctos/incorrectos, contexto, límites, separadores, folios, offsets UTF-16, precedencia de secretos, etiquetas previas, reevaluación, mensajería y el recorrido completo sobre el fixture de ChatGPT. La prueba automática del sitio simulado no equivale a una nueva validación manual en ChatGPT real.

## Resultado de verificación

159 pruebas unitarias, 15 de integración sobre fixtures y 12 de interfaz correctas. Typecheck, build de Chrome MV3 y comprobación de formato correctos. Evidencia visual: `docs/diseno/capturas/cobertura-financiera.png`.
