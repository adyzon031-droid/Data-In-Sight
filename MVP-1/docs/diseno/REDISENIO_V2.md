# Rediseño visual v2 · Data In Sight

19 de octubre de 2026. Sustituye la primera implementación visual tras la revisión del usuario.

## Dirección

Una interfaz de seguridad con identidad propia: esmeralda, grafito y menta, jerarquía tipográfica geométrica, superficies con profundidad discreta, retícula y órbitas alrededor del emblema. La ilustración SecurityCore es SVG/CSS del proyecto; no es una imagen de stock ni un indicador que prometa protección activa. Los estados no disponible, advertencia y bloqueo siguen explícitos.

## Marca

- Original preservado: `src/assets/brand/logo-original.png`.
- Variante transparente: `src/assets/brand/logo-transparent-v2.png`.
- Se comprobó RGBA con píxeles de fondo alfa 0, además del render sin recuadro en el navegador.
- La extracción se realizó con la herramienta integrada ImageGen, sin CLI/API externa. Se conserva el resultado editado como variante; no es una eliminación determinista píxel por píxel y puede introducir pequeñas variaciones en los contornos.

Prompt exacto usado:

> Use case: background-extraction. Edit target: supplied Data In Sight logo. Remove ONLY the black background, including black negative-space regions between the shield, paper document and orbital arrow. Preserve the exact original emblem shapes, proportions, green and dark teal colors, white paper and white arrow outline. Do not redraw, add text, shadows, glow or other elements. Output a genuine transparent PNG with alpha, closely framed around the full emblem with a small even transparent margin. Keep all dark teal foreground regions opaque. This is a logo extraction for use at small UI sizes.

## Tipografía y recursos

Space Grotesk Variable para marca, títulos y cifras; Manrope Variable para texto y controles. Subconjuntos WOFF2 latinos empaquetados localmente con @font-face; no se consultan Google Fonts ni CDN en ejecución. Paquetes Fontsource 5.3.0, licencias OFL incluidas en `public/licenses/` y en la extensión compilada.

SecurityCore usa el logo transparente, retícula, arcos orbitales, nodos y geometría de escudo. Se adapta a hero, popup y modal; los tonos de revisión/crítico acompañan texto e iconos. No muestra indicadores de seguridad falsos.

## Pantallas

Configuración general incorpora una presentación «Tu información. Tu decisión.» con invitación a la demostración. Sidebar y cabeceras usan superficies oscuras esmeralda. Popup y modales comparten la misma marca y sistema geométrico. Se mantienen tema claro/oscuro/sistema, foco visible y diseño móvil.

Vista previa oscura: [abrir](http://127.0.0.1:5173/?theme=dark). Su configuración vive en memoria. La extensión conserva los ajustes reales previamente guardados.

## Validación

Pruebas de motor/almacenamiento, tipos, build y suite de interfaz, con comprobaciones adicionales de alfa del logo, fondo transparente del componente y carga real de las dos fuentes. Las capturas finales están en `docs/diseno/capturas/`; `redisenio-v2-oscuro.png` muestra el panel principal en oscuro.

La protección en plataformas sigue pendiente de la fase 4. Este rediseño no modifica reglas DLP ni añade servidores.

## Ajustes tras comentarios en navegador

Se corrigió el engrane manual con ocho dientes simétricos y se añadieron capas de color a los iconos. CURP, RFC y claves usan símbolos distintos de identificación, documento fiscal y llave. Verde de marca se combina con cian, azul, iris, coral y dorado sobre superficies grafito azuladas; los colores de peligro mantienen su semántica.

Se retiró la anotación de integración del hero y la nota de exclusiones de la lista de detectores. El estado real de las integraciones permanece en popup y Sitios web. El pie de texto se sustituyó por BrandConstellation: una composición SVG de trazas, nodos de color y el logo transparente, sin texto decorativo.

La navegación a 707 × 582 se reorganiza en una cuadrícula sin barra horizontal; en anchos menores usa dos columnas. La ilustración del hero mantiene presencia y color en esos tamaños. Las comprobaciones de UI incluyen el viewport aportado, proporción cuadrada del engrane y ausencia de las anotaciones retiradas. Capturas específicas: ajustes-707px.png y deteccion-color.png.

