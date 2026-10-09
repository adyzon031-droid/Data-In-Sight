# Data-In-Sight
Desarrollo del proyecto: Extensión para el escaneo y análisis de documentación mediante inteligencia artificial.

extension-seguridad-ia/
│
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploader.vue
│   │   │   ├── ScanResults.vue
│   │   │   └── SecurityAlert.vue
│   │   │
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── HistoryView.vue
│   │   │   └── SettingsView.vue
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── content/
│   │   │   └── content.js
│   │   │
│   │   ├── background/
│   │   │   └── service-worker.js
│   │   │
│   │   ├── assets/
│   │   ├── App.vue
│   │   └── main.js
│   │
│   ├── popup.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/main/kotlin/
│   │   └── com/seguridadia/
│   │       ├── Main.kt
│   │       │
│   │       ├── controllers/
│   │       │   ├── ScanController.kt
│   │       │   └── DocumentController.kt
│   │       │
│   │       ├── services/
│   │       │   ├── ScanService.kt
│   │       │   ├── DetectionService.kt
│   │       │   └── SecurityService.kt
│   │       │
│   │       ├── models/
│   │       │   ├── Document.kt
│   │       │   └── ScanResult.kt
│   │       │
│   │       ├── repositories/
│   │       │   └── ScanRepository.kt
│   │       │
│   │       ├── config/
│   │       │   └── DatabaseConfig.kt
│   │       │
│   │       └── utils/
│   │           └── FileValidator.kt
│   │
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── build.gradle.kts
│   └── settings.gradle.kts
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── tests/
│   ├── frontend/
│   └── backend/
│
├── docs/
│   ├── arquitectura.md
│   ├── matriz-riesgos.md
│   └── normas-estandares.md
│
├── .gitignore
├── docker-compose.yml
└── README.md
