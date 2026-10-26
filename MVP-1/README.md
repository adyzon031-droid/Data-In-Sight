# Data In Sight

Extensión DLP con análisis local para prevenir el envío accidental de información sensible a plataformas de IA. Desarrollo por fases en un único chat.

## Estado

Fases 1–3 e implementaciones experimentales de las fases 4 y 5: extensión, motor local, frontend aprobado e integración de ChatGPT para la variante textarea observada. Se controlan clic/Enter/submit en el editor compatible; otras variantes muestran no disponible. Las pruebas de bloqueo se realizaron sobre fixtures, y la comprobación manual de extremo a extremo en ChatGPT real sigue pendiente. Se añadieron adaptadores experimentales de Claude y Gemini: Gemini tiene DOM observado; Claude usa un contrato provisional pendiente de comprobar con sesión. [Evidencia y validación de Fase 5](docs/INTEGRACION_MULTIPLATAFORMA.md).

Antes de Fase 5 se incorporaron CLABE, tarjetas bancarias, NSS e identidad, nombre, domicilio, nacimiento y salud al motor, la demostración y la comparación Antes/Después. Son 17 categorías con reglas de formato/contexto. La [corrección 1.3.0](docs/DETECCION_TEXTO_LIBRE.md) añade nombres probables en texto libre/minúsculas y teléfonos internacionales, con país configurable para números sin prefijo. [Reglas financieras](docs/AMPLIACION_DATOS.md) y [comprobaciones de identidad y contexto](docs/DETECCION_CONTEXTO.md). Archivos y OCR quedan para otra fase por decisión del usuario.

La [revisión de límites 1.3.1](docs/PRUEBAS_LIMITES.md) corrige evasiones Unicode, credenciales multilínea, correos internacionales parciales y JWT reconocibles, y documenta fallos pendientes. Validación: 430 pruebas unitarias, 48 de integración sobre fixtures y 14 de interfaz correctas.

## Ejecutar y modificar en otra computadora

Requisitos: Node.js 22.12 o superior, npm y Chrome o Brave para cargar la extensión. El motor funciona localmente y esta versión no necesita backend, base de datos ni claves API.

1. Clonar el repositorio privado con una cuenta que tenga acceso, o descargar y descomprimir su ZIP.
2. Abrir una terminal en la carpeta del proyecto que contiene `package.json`. Si el repositorio tiene una carpeta `MVP-1`, entrar primero en ella.
3. Instalar las versiones fijadas en el lockfile:

```bash
npm ci
```

4. Compilar la extensión:

```bash
npm run build
```

La compilación genera `.output/chrome-mv3` en esa computadora. Las dependencias y los resultados de compilación se regeneran; no hace falta copiarlos de otra máquina.

Para editar el proyecto, abrir esta carpeta en el editor y modificar `src/`. Durante el desarrollo se puede ejecutar:

```bash
npm run dev
```

Este comando mantiene un proceso activo. Abrir otra terminal para las comprobaciones, o detenerlo antes de ejecutar otros comandos. La salida de desarrollo es `.output/chrome-mv3-dev`; para compartir una compilación estable, usar `npm run build` y `.output/chrome-mv3`.

## Comprobaciones

```bash
npm run typecheck
npm test
npm run format:check
npm run build
```

Para pruebas de navegador, instalar primero Chromium y después ejecutar las suites:

```bash
npx playwright install chromium
npm run test:integration
npm run test:ui
```

En Linux, Playwright puede indicar dependencias del sistema que deban instalarse. Las pruebas de integración usan sitios simulados y no requieren iniciar sesión en los proveedores de IA. Para generar un ZIP instalable de la extensión: `npm run zip`. El código fuente para modificar el proyecto se comparte mediante el repositorio o su ZIP de fuentes.

## Cargar la extensión

Después de compilar, abrir chrome://extensions en Chrome o brave://extensions en Brave, activar modo desarrollador y cargar sin empaquetar la carpeta `.output/chrome-mv3`. Abrir el popup → Ver configuración → Demostración. La carga compilada se comprobó en Chromium automatizado y el usuario confirmó funcionamiento en su navegador; la validación manual exhaustiva sigue pendiente. Compilar no acredita prevención de envíos.

La extensión solicita acceso a `https://chatgpt.com/*`, `https://claude.ai/*` y `https://gemini.google.com/*`. Si ya estaba instalada, actualizarla, aceptar los dos dominios añadidos y recargar las pestañas de las plataformas. Comprobar el indicador de revisión antes de probar con datos sintéticos. El popup mostrará no disponible si no reconoce el editor o no puede cargar la política. [Alcance y validación real pendiente](docs/INTEGRACION_CHATGPT.md).

Para revisar el frontend sin instalar la extensión: `npm run preview:ui` y abrir http://127.0.0.1:5173/. Es una vista previa con ajustes en memoria, sin persistencia ni envíos. Para pruebas de UI: compilar, ejecutar `npx playwright install chromium` y después `npm run test:ui`.

## Documentación

- [Pruebas de límites: resultados, correcciones y pendientes](docs/PRUEBAS_LIMITES.md)
- [Fases](docs/FASES_MVP.md)
- [Contexto del MVP](docs/CONTEXTO_MVP.md)
- [Referencias del frontend](docs/diseno/FRONTEND.md)
- [Motor DLP: API, reglas, pruebas y límites](docs/MOTOR_DLP.md)
- [Frontend implementado: pantallas, demo, pruebas y capturas](docs/FRONTEND_IMPLEMENTADO.md)
- [Fase 5: Claude, Gemini, evidencia y límites](docs/INTEGRACION_MULTIPLATAFORMA.md)
- [Integración experimental ChatGPT: pruebas, límites y validación manual](docs/INTEGRACION_CHATGPT.md)

Base configurada según la [integración oficial de Vue en WXT](https://wxt.dev/guide/essentials/frontend-frameworks.html) y su [estructura de proyecto](https://wxt.dev/guide/essentials/project-structure).
