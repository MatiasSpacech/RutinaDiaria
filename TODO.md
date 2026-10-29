# TODO — RutinaDiaria

Lista detallada de implementación. Se marca cada punto al completarlo.

## Fase 0 — Plan y repositorio

- [x] Guardar `PLAN.md` con alcance, arquitectura, modelo de datos y fases.
- [x] Guardar `TODO.md` con los pasos detallados.
- [x] Inicializar repositorio git local.
- [x] Crear repositorio público `RutinaDiaria` en GitHub.
- [x] Commit inicial con el plan y push.

## Fase 1 — Scaffold y diseño base

- [x] Crear proyecto Expo SDK 58 con TypeScript y expo-router.
- [x] Configurar `app.json`: nombre RutinaDiaria, slug, paquete Android, tema oscuro.
- [x] Instalar dependencias: expo-sqlite, zustand, date-fns, react-native-gifted-charts, react-native-svg, expo-haptics, expo-keep-awake, expo-audio.
- [x] Crear tokens de tema (colores claro/oscuro, espaciados, radios, tipografía).
- [x] Crear componentes base: Screen, Card, Button, Chip, MetricCard, SectionHeader, EmptyState, TextField, FAB, ProgressBar.
- [x] Configurar navegación por pestañas: Inicio, Actividades, Medidas, Progreso; ajustes desde el header.
- [x] Configurar estado global inicial con Zustand.
- [x] Verificar typecheck y lint.
- [x] Commit y push de la fase.

## Fase 2 — Datos y dominio

- [x] Crear cliente SQLite y sistema de migraciones con `PRAGMA user_version`.
- [x] Definir tablas: profile, exercises, routines, routine_exercises, activities, strength_sets, measurements.
- [x] Crear repositorios por entidad.
- [x] Crear semilla de ejercicios comunes por grupo muscular.
- [x] Implementar cálculos: IMC y clasificación OMS, ritmo, velocidad, volumen, 1RM Epley, rachas, agregados y variación.
- [x] Implementar conversión de unidades métrico/imperial.
- [x] Configurar tests (jest-expo) y cubrir cálculos de dominio.
- [x] Integrar inicialización de BD y migraciones al arranque de la app.
- [x] Verificar typecheck, lint y tests.
- [x] Commit y push de la fase.

## Fase 3 — Perfil, onboarding y mediciones

- [x] Pantalla de onboarding con datos personales y objetivos.
- [x] Guardar perfil y detectar primer inicio.
- [x] CRUD de mediciones corporales.
- [x] Cálculo y clasificación de IMC en la ficha de medida.
- [x] Gráficos de peso con objetivo, IMC y medidas seleccionables.
- [x] Selector de rango temporal (1M, 3M, 6M, 1A, todo) y variación/tendencia.
- [x] Pantalla de ajustes básicos de perfil.
- [x] Verificar typecheck, lint y pruebas manuales.
- [x] Commit y push de la fase.

## Fase 4 — Actividades

- [x] Historial de actividades con filtros por tipo y fecha.
- [x] Formulario de caminata/senderismo/cardio con distancia, desnivel, duración, terreno, RPE y notas.
- [x] Cálculo de ritmo y velocidad en el detalle.
- [x] Editor de rutinas de fuerza con ejercicios objetivo.
- [x] Flujo de sesión de fuerza: elegir rutina o sesión libre, agregar ejercicios y series (reps, peso, RPE).
- [x] Cálculo de volumen de la sesión.
- [x] Detalle de actividad con edición y borrado.
- [x] Verificar typecheck, lint y pruebas manuales.
- [x] Commit y push de la fase.

## Fase 5 — Rutinas por tiempo y timer

- [x] Extender rutinas con modo tiempo: rondas, preparación y descansos.
- [x] Editor de rutina por tiempo con duración y descanso por ejercicio.
- [x] Implementar motor de timer sin deriva basado en timestamps.
- [x] Tests del motor: secuencia de fases, rondas, pausa, saltar, +15 s y fin.
- [x] Runner full screen: anillo de progreso, ejercicio actual/próximo, ronda y tiempo total.
- [x] Controles: iniciar/pausar, saltar fase, +15 s y terminar con confirmación.
- [x] Pantalla encendida y pausa automática al pasar a segundo plano.
- [x] Avisos con pitidos en últimos 3 s y cambios de fase.
- [x] Vibración en transiciones.
- [x] Resumen final y guardado automático de la sesión.
- [x] Verificar typecheck, lint y tests.
- [x] Commit y push de la fase.

## Fase 6 — Inicio y progreso

- [x] Dashboard con resumen semanal, racha, último peso/IMC, meta de peso y actividad reciente.
- [x] Estadísticas semanales de sesiones, minutos, volumen, distancia y desnivel.
- [x] Gráfico de barras de actividad semanal.
- [x] Heatmap de actividad tipo calendario.
- [x] Distribución por tipo de actividad.
- [x] Récords personales por ejercicio con 1RM estimado.
- [x] Verificar typecheck, lint y pruebas manuales.
- [x] Commit y push de la fase.

## Fase 7 — Ajustes, exportación y QA

- [ ] Ajustes de unidades y tema.
- [ ] Exportación de backup JSON mediante el selector de compartir.
- [ ] Opción de borrar datos con confirmación.
- [ ] Recorrido completo en emulador Android y corrección de hallazgos.
- [ ] README con descripción, funcionalidades, capturas e instrucciones de ejecución.
- [ ] Typecheck, lint y todos los tests en verde.
- [ ] Commit y push final.
