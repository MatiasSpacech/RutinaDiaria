# RutinaDiaria — Plan de implementación

Aplicación móvil Android para registrar ejercicios, rutinas, caminatas y senderismo, y llevar el control de medidas corporales con gráficos de evolución. Funciona 100 % offline, en español y con datos locales.

## Decisiones del producto

- **Plataforma:** Android (Expo + React Native).
- **Stack:** Expo SDK 58, TypeScript, expo-router, expo-sqlite, Zustand, date-fns, react-native-gifted-charts, react-native-svg.
- **Persistencia:** SQLite local, sin cuenta ni nube. Backup manual en JSON.
- **Nombre:** RutinaDiaria.
- **Estilo:** dark-first con acento lima, soporte de tema claro/oscuro.
- **Idioma de la interfaz:** español. Unidades métricas por defecto (kg, km) con opción imperial (lb, mi).
- **GPS:** fuera de la v1; las caminatas y el senderismo se registran manualmente.
- **Rutinas por tiempo:** intervalos trabajo/descanso con rondas, cuenta regresiva inicial y descansos configurables. Avisos con pitidos y vibración. Al finalizar se guarda automáticamente la sesión con RPE y notas editables.
- **Timer:** motor sin deriva basado en timestamps, pausa/reanudación, saltar fase, +15 s, pantalla encendida y pausa al pasar a segundo plano.
- **Meta de v1:** experiencia completa offline con historial, gráficos, estadísticas, rachas y exportación.

## Funcionalidades v1

1. **Perfil y onboarding:** nombre, fecha de nacimiento/edad, sexo, altura, nivel de actividad, peso objetivo, meta semanal y unidades.
2. **Actividades:**
   - Fuerza: rutinas/plantillas, ejercicios de una biblioteca semilla, series con reps, peso y RPE; volumen total.
   - Caminata, senderismo y cardio: distancia, duración, desnivel, terreno, RPE y notas; ritmo calculado.
   - Otros: duración, distancia opcional, intensidad y notas.
   - Historial con filtros, detalle, edición y borrado.
3. **Mediciones corporales:** peso, IMC automático con clasificación OMS, cintura, cadera, pecho, brazo, muslo, % grasa opcional y notas.
4. **Gráficos de evolución:** peso con línea de objetivo, IMC, medidas seleccionables y rangos 1M/3M/6M/1A/todo; variación y tendencia.
5. **Inicio:** resumen semanal, racha, último peso/IMC, meta de peso, meta semanal y actividad reciente.
6. **Progreso:** sesiones, minutos, volumen, distancia y desnivel por semana, gráfico de barras, heatmap de actividad y récords personales (incluye 1RM estimado Epley).
7. **Rutinas por tiempo:** editor con rondas, preparación, descansos y duración por ejercicio; runner full screen con anillo de progreso, ejercicio actual/próximo, controles y guardado automático.
8. **Ajustes:** perfil, unidades, tema, exportar backup JSON, borrar datos.

## Ideas para versiones futuras

- v1.1: cronómetro libre, recordatorios locales, exportación CSV, logros, avisos con pantalla bloqueada.
- v2: fotos de progreso, GPS y rutas con mapa, Google Fit/Health Connect, widgets e informes mensuales.

## Modelo de datos (SQLite)

- `profile`: fila única con nombre, fecha de nacimiento, sexo, altura, nivel de actividad, peso objetivo, meta semanal, unidades y tema.
- `exercises`: biblioteca semilla y ejercicios personalizados (nombre, grupo muscular, es personalizado).
- `routines`: plantillas de fuerza o por tiempo (modo, rondas, preparación, descansos).
- `routine_exercises`: ejercicios ordenados de una rutina con objetivo de series/reps o duración/descanso.
- `activities`: sesiones realizadas (tipo, título, fecha, duración, distancia, desnivel, terreno, RPE, notas, rutina asociada, rondas completadas, detalle JSON).
- `strength_sets`: series realizadas (actividad, ejercicio, orden, reps, peso, RPE).
- `measurements`: fecha, peso, cintura, cadera, pecho, brazo, muslo, % grasa y notas.
- Migraciones versionadas con `PRAGMA user_version`, índices por fecha y por actividad.
- Capa de repositorios para aislar SQL de la UI.

## Cálculos de dominio

- IMC = peso / altura² y clasificación OMS.
- Ritmo (min/km) y velocidad media.
- Volumen de fuerza = Σ(reps × peso).
- 1RM estimado (Epley) = peso × (1 + reps / 30).
- Rachas, agregados semanales, variación de peso y tendencia.
- Conversión de unidades métrico/imperial.

## Arquitectura

```
app/                      Rutas de expo-router
  (tabs)/                 Inicio, Actividades, Medidas, Progreso
  activity/               Alta y detalle de actividad
  measurement/            Alta y detalle de medición
  routine/                Editor y detalle de rutina
  timer/                  Runner de rutina por tiempo y resumen
  onboarding.tsx
  settings.tsx
src/
  components/             Componentes de UI reutilizables
  db/                     Cliente SQLite, migraciones, repositorios, semilla
  domain/                 Tipos, cálculos, validaciones, motor de timer
  store/                  Estado global (Zustand)
  theme/                  Tokens, tipografía y tema claro/oscuro
  utils/                  Fechas, formatos, exportación
```

## Fases de implementación

1. **Fase 0 — Plan y repositorio:** guardar plan, lista de tareas, git init y repo público en GitHub.
2. **Fase 1 — Scaffold y diseño base:** Expo + TypeScript, dependencias, tema, navegación y componentes.
3. **Fase 2 — Datos y dominio:** SQLite, migraciones, repositorios, semilla, cálculos y tests.
4. **Fase 3 — Perfil y mediciones:** onboarding, ajustes básicos, CRUD de medidas y gráficos.
5. **Fase 4 — Actividades:** fuerza con series y rutinas, caminata/senderismo/cardio manual, historial y detalle.
6. **Fase 5 — Rutinas por tiempo:** editor, motor de timer, runner, avisos y guardado automático.
7. **Fase 6 — Inicio y progreso:** resumen, racha, estadísticas, heatmap y récords.
8. **Fase 7 — Ajustes y QA:** exportación, README, pruebas en emulador Android, typecheck, lint y tests.

Después de cada fase se hace commit y push a `MatiasSpacech/RutinaDiaria`.

## Verificación

- App funcional en el emulador Android `Medium_Phone` (API 37) con datos de prueba persistidos.
- `npx tsc --noEmit` sin errores.
- Lint sin errores.
- Tests de dominio y del motor de timer en verde.
- Recorrido manual: onboarding → medidas → actividad de fuerza → rutina por tiempo → historial → estadísticas → exportación.
