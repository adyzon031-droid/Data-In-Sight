# Referencias del frontend de Data In Sight

Referencias aportadas por el usuario el 18 de octubre de 2026. Sustituyen la paleta azul/cian del pitch como guía del frontend. Las pantallas de la fase 3 ya están implementadas; ver [resultado y verificación](../FRONTEND_IMPLEMENTADO.md).

## Material original

- [Pantallas de la extensión](referencias/pantallas-extension.png): composición y estilo.
- [Paleta principal](referencias/paleta-principal.png): identidad de marca.
- [Colores secundarios y alertas](referencias/paleta-alertas.png).
- [Logo original](../../src/assets/brand/logo-original.png): escudo, documento y avión de papel. Usar este símbolo, conservando proporciones, en lugar del símbolo simplificado del mockup.

El original se conserva sin editar. Tras la revisión del usuario se preparó `src/assets/brand/logo-transparent-v2.png` con transparencia real. Se usa la variante sin recuadro; ver [rediseño v2](REDISENIO_V2.md) para prompt, recurso y dirección futurista.

## Paleta y roles

| Color | Valor | Uso previsto |
|---|---|---|
| Verde profundo | #064E3B | Encabezados, navegación lateral, marca y superficies oscuras. |
| Verde principal | #059669 | Controles activos, bordes de selección y acentos. |
| Esmeralda | #10B981 | Detalles de éxito e iconos. |
| Menta | #6EE7B7 | Selección y superficies destacadas suaves. |
| Fondo verde claro | #F0FDF4 | Fondo y tarjetas de estado positivo. |
| Texto principal | #0F172A | Títulos y texto sobre fondos claros. |
| Blanco | #FFFFFF | Tarjetas y superficies claras. |
| Advertencia | #F59E0B | Avisos de riesgo no crítico. |
| Peligro | #EF4444 | Bloqueo, errores e indicadores críticos. |
| Texto secundario | #64748B | Descripciones y metadatos. |
| Bordes | #E2E8F0 | Separadores y contornos suaves. |

Asignar combinaciones de texto/fondo después de comprobar contraste. Usar verde profundo para texto o botones que necesiten mayor contraste; los tonos vivos no garantizan legibilidad con texto blanco.

## Pantallas y composición

1. **Popup principal:** cabecera verde profunda, logo y nombre, acceso a opciones; tarjeta de protección con estado de la pestaña; resumen local de alertas/bloqueos; categorías de detección; botón de configuración. Anchura compacta, sin scroll horizontal.
2. **Advertencia en la plataforma:** modal claro sobre fondo atenuado, título y explicación breve, categorías detectadas, acción primaria de proteger, cancelar y continuación solo si la política lo permite. Credenciales siempre enmascaradas.
3. **Estado sin hallazgos:** escudo de confirmación, texto «No se detectaron coincidencias con las reglas actuales», resumen temporal y acceso a detalles. No afirmar que el contenido es absolutamente seguro.
4. **Opciones:** navegación lateral verde profunda con General, Detección, Sitios web, Privacidad, Apariencia y Acerca de. Panel claro con filas de ajustes, iconos y explicaciones breves.
5. **Apariencia:** claro, oscuro o sistema, con previsualizaciones. Mantener identidad verde en ambos temas. La selección libre del color principal y la posición de alertas son detalles opcionales del mockup, pendientes de priorizar.
6. **Bloqueo crítico y vista previa:** extender el mismo lenguaje visual a estos estados, aunque no tengan una pantalla separada en la referencia.

El rediseño v2 adopta Space Grotesk para títulos y Manrope para lectura, ambas empaquetadas localmente. Usa grafito/esmeralda, profundidad discreta y una ilustración geométrica propia alrededor del logo. Conserva legibilidad, temas y los requisitos funcionales del mockup. El fondo decorativo exterior de la captura original no forma parte del popup.

## Ajustes necesarios respecto al mockup

- «Continuar de todos modos» aparece solo en WARN no crítico. BLOCK requiere editar o sustituir y reevaluar; no ofrece omitir.
- La contraseña visible del montaje no debe reproducirse en alertas ni registros. No añadir un botón para revelar secretos completos.
- El resumen de último análisis no conserva fragmentos del prompt. Mostrar únicamente metadatos permitidos. Los contadores deben salir de eventos reales; no usar cifras ficticias fuera de una simulación identificada.
- «Protección activa» solo se muestra cuando el adaptador controla el flujo soportado. Diferenciar sitio no soportado, integración no disponible y ausencia de hallazgos.
- Los interruptores generales, de advertencias y de detección no pueden desactivar silenciosamente la protección crítica acordada. Explicar los ajustes disponibles y bloquear cambios no permitidos por la política.
- Las tarjetas bancarias aparecen en el mockup, pero siguen fuera del alcance inicial de detectores. No presentarlas como función activa.
- Proteger sustituye y muestra el resultado para revisión; el rótulo «Ocultar datos y continuar» no debe provocar envío automático. Usar «Proteger y revisar».
- Mantener teclado, foco visible, gestión del foco del modal y retorno al editor, contraste y movimiento reducido. Comunicar estado con texto e iconos además del color.

## Componentes previstos

BrandLogo, StatusBadge, ActionButton, ProtectionStatusCard, StatsCard, FindingsList, WarningDialog, BlockDialog, ProtectedPreview, SettingsRow y ThemePicker. Compartir variables CSS de color, espaciado, radios y tipografía entre popup, opciones y modales; aislar la UI insertada con Shadow DOM.
