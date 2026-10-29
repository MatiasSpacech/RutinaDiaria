import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  AppText,
  Button,
  Card,
  MetricCard,
  PageHeader,
  ProgressBar,
  RpeSelector,
  Screen,
  TextField,
} from '@/components';
import {
  createActivity,
  getActivity,
  updateActivity,
} from '@/db/repositories/activities';
import { getRoutine } from '@/db/repositories/routines';
import { formatTimerDuration } from '@/domain/calculations';
import type { RoutineWithExercises } from '@/domain/types';
import {
  createTimerPlan,
  createTimerState,
  finishTimer,
  getCurrentPhase,
  getNextPhase,
  getPlannedTotalSeconds,
  getRemainingMs,
  getRemainingSeconds,
  getTotalRemainingSeconds,
  pauseTimer,
  skipPhase,
  startTimer,
  tickTimer,
  addSeconds,
  type TimerPhase,
  type TimerPlan,
  type TimerState,
} from '@/domain/timer';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { toLocalDateTime } from '@/utils/date';

const phaseTitles: Record<TimerPhase['kind'], string> = {
  prep: 'Preparación',
  work: 'Trabajo',
  rest: 'Descanso',
  roundRest: 'Descanso entre rondas',
};

function phaseName(phase: TimerPhase | null, plan: TimerPlan): string {
  if (!phase) return 'Fin';
  switch (phase.kind) {
    case 'work':
      return plan.exercises[phase.exerciseIndex]?.name ?? 'Ejercicio';
    case 'rest':
      return 'Descanso';
    case 'roundRest':
      return 'Descanso entre rondas';
    case 'prep':
      return 'Preparate';
  }
}

function completedRounds(state: TimerState, plan: TimerPlan, elapsedSeconds: number): number {
  if (state.status === 'finished') {
    const planned = getPlannedTotalSeconds(state);
    if (elapsedSeconds >= planned - 0.5) return plan.rounds;
    const phase = state.phases[state.phaseIndex];
    if (!phase) return plan.rounds;
    if (phase.kind === 'work' || phase.kind === 'rest') return Math.max(0, phase.round - 1);
    if (phase.kind === 'roundRest') return phase.round;
    return 0;
  }
  return 0;
}

export default function TimerRunnerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  useKeepAwake();

  const [routine] = useState<RoutineWithExercises | null>(() => getRoutine(Number(id)));
  const [plan] = useState<TimerPlan | null>(() =>
    routine ? createTimerPlan(routine) : null,
  );
  const [timer, setTimer] = useState<TimerState | null>(() =>
    plan ? createTimerState(plan) : null,
  );
  const [now, setNow] = useState(Date.now());
  const [savedActivityId, setSavedActivityId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const beepPlayer = useAudioPlayer(require('../../../assets/sounds/beep.wav'));
  const finishPlayer = useAudioPlayer(require('../../../assets/sounds/finish.wav'));

  const savedRef = useRef(false);
  const lastPhaseRef = useRef(-1);
  const lastSecondRef = useRef<number | null>(null);

  useEffect(() => {
    beepPlayer.volume = 0.55;
    finishPlayer.volume = 0.65;
  }, [beepPlayer, finishPlayer]);

  const timerStatus = timer?.status;

  useEffect(() => {
    if (timerStatus !== 'running') return;
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      setTimer((current) => (current ? tickTimer(current, currentNow) : current));
    }, 250);
    return () => clearInterval(interval);
  }, [timerStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        const currentNow = Date.now();
        setNow(currentNow);
        setTimer((current) => (current ? pauseTimer(current, currentNow) : current));
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!timer || !plan) return;
    if (timer.status !== 'running') {
      lastSecondRef.current = null;
      return;
    }

    if (lastPhaseRef.current !== timer.phaseIndex) {
      lastPhaseRef.current = timer.phaseIndex;
      lastSecondRef.current = null;
      playSound(beepPlayer);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    const remainingSeconds = Math.ceil(getRemainingSeconds(timer, now));
    if (
      remainingSeconds > 0 &&
      remainingSeconds <= 3 &&
      lastSecondRef.current !== remainingSeconds
    ) {
      lastSecondRef.current = remainingSeconds;
      playSound(beepPlayer);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [timer, now, plan, beepPlayer]);

  useEffect(() => {
    if (!timer || !plan || !routine || timer.status !== 'finished' || savedRef.current) {
      return;
    }
    savedRef.current = true;
    try {
      const elapsed = timer.finishedElapsedSeconds ?? getPlannedTotalSeconds(timer);
      const rounds = completedRounds(timer, plan, elapsed);
      const activityId = createActivity({
        type: 'strength',
        title: routine.name,
        performedAt: toLocalDateTime(new Date()),
        durationMinutes: Math.max(1, Math.round(elapsed / 60)),
        distanceKm: null,
        elevationGainM: null,
        terrain: null,
        rpe: null,
        notes: null,
        routineId: routine.id,
        roundsCompleted: rounds,
        details: JSON.stringify({
          timer: true,
          plannedSeconds: getPlannedTotalSeconds(timer),
          elapsedSeconds: Math.round(elapsed),
          rounds: plan.rounds,
          exercises: plan.exercises.map((exercise) => exercise.name),
        }),
        sets: [],
      });
      setTimeout(() => setSavedActivityId(activityId), 0);
      playSound(finishPlayer);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo guardar la sesión';
      setTimeout(() => setSaveError(message), 0);
    }
  }, [timer, plan, routine, finishPlayer]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => subscription.remove();
  });

  function playSound(player: ReturnType<typeof useAudioPlayer>) {
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => {});
  }

  function handleExit() {
    if (!timer || timer.status === 'finished') {
      router.back();
      return;
    }
    Alert.alert(
      'Salir del entrenamiento',
      'La rutina en curso no se va a guardar.',
      [
        { text: 'Seguir', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => router.back() },
      ],
    );
  }

  if (!routine || !plan || !timer || routine.mode !== 'time') {
    return (
      <Screen>
        <PageHeader title="Timer" onBack={() => router.back()} />
        <Card>
          <AppText variant="body">
            Esta rutina no está disponible o no es una rutina por tiempo.
          </AppText>
        </Card>
      </Screen>
    );
  }

  const phase = getCurrentPhase(timer);
  const nextPhase = getNextPhase(timer);
  const totalPlanned = Math.max(1, getPlannedTotalSeconds(timer));
  const totalRemaining = Math.ceil(getTotalRemainingSeconds(timer, now));
  const remainingSeconds = Math.ceil(getRemainingMs(timer, now) / 1000);
  const round = phase?.round ?? plan.rounds;
  const ringSize = 260;
  const ringStroke = 14;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const durationMs = (phase?.durationSeconds ?? 1) * 1000;
  const remainingFraction = Math.max(0, Math.min(1, getRemainingMs(timer, now) / durationMs));
  const phaseColor =
    phase?.kind === 'rest'
      ? colors.info
      : phase?.kind === 'roundRest'
        ? colors.warning
        : phase?.kind === 'prep'
          ? colors.info
          : colors.primary;

  function handleStart() {
    const currentNow = Date.now();
    setNow(currentNow);
    setTimer((current) => (current ? startTimer(current, currentNow) : current));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }

  function handlePause() {
    const currentNow = Date.now();
    setNow(currentNow);
    setTimer((current) => (current ? pauseTimer(current, currentNow) : current));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  function handleSkip() {
    const currentNow = Date.now();
    setNow(currentNow);
    setTimer((current) => (current ? skipPhase(current, currentNow) : current));
  }

  function handleAddTime() {
    const currentNow = Date.now();
    setNow(currentNow);
    setTimer((current) => (current ? addSeconds(current, currentNow, 15) : current));
  }

  function handleFinishEarly() {
    Alert.alert('Terminar sesión', '¿Querés finalizar la rutina ahora?', [
      { text: 'Seguir', style: 'cancel' },
      {
        text: 'Terminar',
        style: 'destructive',
        onPress: () => {
          const currentNow = Date.now();
          setNow(currentNow);
          setTimer((current) => (current ? finishTimer(current, currentNow) : current));
        },
      },
    ]);
  }

  function handleSaveSummary() {
    if (!savedActivityId) return;
    const saved = getActivity(savedActivityId);
    if (!saved) return;

    updateActivity(saved.id, {
      type: saved.type,
      title: saved.title,
      performedAt: saved.performedAt,
      durationMinutes: saved.durationMinutes,
      distanceKm: saved.distanceKm,
      elevationGainM: saved.elevationGainM,
      terrain: saved.terrain,
      rpe,
      notes: notes.trim() || null,
      routineId: saved.routineId,
      roundsCompleted: saved.roundsCompleted,
      details: saved.details,
      sets: [],
    });

    router.replace({ pathname: '/activity/[id]', params: { id: String(saved.id) } });
  }

  if (timer.status === 'finished') {
    const elapsed = timer.finishedElapsedSeconds ?? 0;
    const rounds = completedRounds(timer, plan, elapsed);

    return (
      <Screen>
        <PageHeader title="Sesión finalizada" onBack={() => router.back()} />
        <Card style={[styles.finishedHero, { backgroundColor: colors.primarySoft }]}>
          <View style={[styles.finishedIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="check" size={34} color={colors.onPrimary} />
          </View>
          <View style={styles.finishedText}>
            <AppText variant="subtitle">¡Buen trabajo!</AppText>
            <AppText variant="body" color="textSecondary">
              {routine.name}
            </AppText>
          </View>
        </Card>

        <View style={styles.metricsRow}>
          <MetricCard
            label="Tiempo total"
            value={formatTimerDuration(elapsed)}
            icon="clock-outline"
          />
          <MetricCard
            label="Rondas"
            value={`${rounds}/${plan.rounds}`}
            icon="repeat"
            tone="success"
          />
        </View>

        <Card style={styles.summaryCard}>
          <AppText variant="bodyStrong">¿Cómo te sentiste?</AppText>
          <RpeSelector value={rpe} onChange={setRpe} label="RPE de la sesión" />
          <TextField
            label="Notas"
            placeholder="Opcional"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          {saveError ? (
            <AppText variant="caption" color="danger">
              {saveError}
            </AppText>
          ) : (
            <AppText variant="caption" color="textMuted">
              La sesión ya quedó guardada en tu historial.
            </AppText>
          )}
          <Button
            label="Guardar y ver actividad"
            onPress={handleSaveSummary}
            disabled={!savedActivityId}
            size="lg"
          />
          <Button label="Volver al inicio" variant="ghost" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  const phaseLabel =
    timer.status === 'idle'
      ? 'Listo para empezar'
      : phase?.kind === 'work'
        ? phaseName(phase, plan)
        : phaseTitles[phase?.kind ?? 'prep'];

  const currentSubtitle =
    phase?.kind === 'work'
      ? `Ejercicio ${phase.exerciseIndex + 1} de ${plan.exercises.length}`
      : phase?.kind === 'rest'
        ? 'Recuperá para la próxima serie'
        : phase?.kind === 'roundRest'
          ? `Ronda ${phase.round} completada`
          : timer.status === 'idle'
            ? `Primer ejercicio: ${plan.exercises[0]?.name ?? ''}`
            : `Primer ejercicio: ${plan.exercises[0]?.name ?? ''}`;

  const nextLabel = nextPhase ? phaseName(nextPhase, plan) : 'Fin de la rutina';

  return (
    <Screen>
      <PageHeader
        title={routine.name}
        subtitle="Entrenamiento por tiempo"
        onBack={handleExit}
        right={
          <View style={[styles.roundBadge, { backgroundColor: colors.primarySoft }]}>
            <AppText variant="label" style={{ color: colors.primary }}>
              {Math.min(round, plan.rounds)}/{plan.rounds}
            </AppText>
          </View>
        }
      />

      <View style={styles.phaseRow}>
        <View style={[styles.phaseBadge, { backgroundColor: colors.surface }]}>
          <AppText variant="caption" color="textSecondary">
            {phaseLabel.toUpperCase()}
          </AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          {currentSubtitle}
        </AppText>
      </View>

      <View style={styles.ringWrapper}>
        <Svg width={ringSize} height={ringSize}>
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke={colors.border}
            strokeWidth={ringStroke}
            fill="transparent"
          />
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke={phaseColor}
            strokeWidth={ringStroke}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - remainingFraction)}
            strokeLinecap="round"
            rotation={-90}
            originX={ringSize / 2}
            originY={ringSize / 2}
          />
        </Svg>
        <View style={styles.ringContent}>
          <AppText variant="timer">
            {formatTimerDuration(remainingSeconds)}
          </AppText>
          <AppText variant="caption" color="textMuted">
            restante
          </AppText>
        </View>
      </View>

      <View style={styles.nextRow}>
        <MaterialCommunityIcons name="skip-next-outline" size={18} color={colors.textMuted} />
        <AppText variant="caption" color="textSecondary">
          Siguiente: {nextLabel}
        </AppText>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <AppText variant="caption" color="textMuted">
            Progreso total
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {formatTimerDuration(totalRemaining)} restantes
          </AppText>
        </View>
        <ProgressBar progress={1 - totalRemaining / totalPlanned} color={colors.primary} />
      </View>

      {timer.status === 'idle' ? (
        <View style={styles.controls}>
          <Button
            label="Iniciar entrenamiento"
            onPress={handleStart}
            size="lg"
            icon={<MaterialCommunityIcons name="play" size={20} color={colors.onPrimary} />}
          />
          <Button label="Salir" variant="ghost" onPress={handleExit} />
        </View>
      ) : (
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Button
              label={timer.status === 'paused' ? 'Reanudar' : 'Pausar'}
              onPress={timer.status === 'paused' ? handleStart : handlePause}
              icon={
                <MaterialCommunityIcons
                  name={timer.status === 'paused' ? 'play' : 'pause'}
                  size={18}
                  color={colors.onPrimary}
                />
              }
              fullWidth={false}
              style={styles.controlButton}
            />
            <Button
              label="+15 s"
              variant="secondary"
              onPress={handleAddTime}
              fullWidth={false}
              style={styles.controlButton}
            />
          </View>
          <View style={styles.controlRow}>
            <Button
              label="Saltar fase"
              variant="secondary"
              onPress={handleSkip}
              fullWidth={false}
              style={styles.controlButton}
            />
            <Button
              label="Terminar"
              variant="ghost"
              onPress={handleFinishEarly}
              fullWidth={false}
              style={styles.controlButton}
            />
          </View>
        </View>
      )}

      <AppText variant="caption" color="textMuted" align="center">
        Mantené la pantalla abierta. Si salís de la app, la sesión se pausa.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  controlButton: {
    flex: 1,
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controls: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  finishedHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  finishedIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  finishedText: {
    flex: 1,
    gap: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  phaseBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  phaseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  progressBlock: {
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  roundBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryCard: {
    gap: spacing.lg,
  },
});
