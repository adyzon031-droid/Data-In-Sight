# Data In Sight · MVP 1

Extensión DLP con análisis local para plataformas de IA. El código fuente, las pruebas, los recursos visuales y la documentación están en [`MVP-1`](MVP-1/README.md).

## Inicio rápido

Requisitos: Node.js 22.12 o superior, npm y Chrome o Brave.

```bash
git clone https://github.com/WhiteDrk/Data-In-Sight-MVP-1.git
cd Data-In-Sight-MVP-1/MVP-1
npm ci
npm run build
```

Cargar `.output/chrome-mv3` desde la página de extensiones del navegador con el modo desarrollador activado. Para modificar el proyecto, abrir `MVP-1` en el editor y ejecutar `npm run dev`.

El repositorio es privado: cada colaborador necesita acceso para clonarlo. La versión actual no requiere backend, base de datos ni claves API. Consultar [instrucciones completas](MVP-1/README.md) y [límites conocidos](MVP-1/docs/PRUEBAS_LIMITES.md).
