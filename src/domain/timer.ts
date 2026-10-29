import type { RoutineWithExercises } from '@/domain/types';

export type TimerExercisePlan = {
  name: string;
  durationSeconds: number;
  restSeconds?: number | null;
};

export type TimerPlan = {
  exercises: TimerExercisePlan[];
  rounds: number;
  prepSeconds: number;
  restBetweenExercisesSeconds: number;
  restBetweenRoundsSeconds: number;
};

export type TimerPhaseKind = 'prep' | 'work' | 'rest' | 'roundRest';

export type TimerPhase = {
  kind: TimerPhaseKind;
  round: number;
  exerciseIndex: number;
  durationSeconds: number;
};

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type TimerState = {
  plan: TimerPlan;
  phases: TimerPhase[];
  phaseIndex: number;
  phaseStartedAt: number;
  pausedRemainingMs: number | null;
  status: TimerStatus;
  finishedElapsedSeconds: number | null;
};

const MS_PER_SECOND = 1000;

export function createTimerPlan(routine: RoutineWithExercises): TimerPlan {
  return {
    rounds: Math.max(1, routine.rounds),
    prepSeconds: Math.max(0, routine.prepSeconds),
    restBetweenExercisesSeconds: Math.max(0, routine.restBetweenExercisesSeconds),
    restBetweenRoundsSeconds: Math.max(0, routine.restBetweenRoundsSeconds),
    exercises: routine.exercises.map((exercise) => ({
      name: exercise.name,
      durationSeconds: Math.max(1, exercise.durationSeconds ?? 30),
      restSeconds: exercise.restSeconds,
    })),
  };
}

export function buildTimerPhases(plan: TimerPlan): TimerPhase[] {
  const phases: TimerPhase[] = [];
  const rounds = Math.max(1, plan.rounds);

  if (plan.prepSeconds > 0) {
    phases.push({
      kind: 'prep',
      round: 1,
      exerciseIndex: 0,
      durationSeconds: plan.prepSeconds,
    });
  }

  for (let round = 1; round <= rounds; round += 1) {
    plan.exercises.forEach((exercise, exerciseIndex) => {
      phases.push({
        kind: 'work',
        round,
        exerciseIndex,
        durationSeconds: Math.max(1, exercise.durationSeconds),
      });

      const isLastExercise = exerciseIndex === plan.exercises.length - 1;
      if (!isLastExercise) {
        const restSeconds =
          exercise.restSeconds === null || exercise.restSeconds === undefined
            ? plan.restBetweenExercisesSeconds
            : exercise.restSeconds;
        if (restSeconds > 0) {
          phases.push({
            kind: 'rest',
            round,
            exerciseIndex,
            durationSeconds: restSeconds,
          });
        }
      } else if (round < rounds && plan.restBetweenRoundsSeconds > 0) {
        phases.push({
          kind: 'roundRest',
          round,
          exerciseIndex,
          durationSeconds: plan.restBetweenRoundsSeconds,
        });
      }
    });
  }

  return phases;
}

export function createTimerState(plan: TimerPlan): TimerState {
  const phases = buildTimerPhases(plan);
  return {
    plan,
    phases,
    phaseIndex: 0,
    phaseStartedAt: 0,
    pausedRemainingMs: null,
    status: phases.length === 0 ? 'finished' : 'idle',
    finishedElapsedSeconds: phases.length === 0 ? 0 : null,
  };
}

export function getCurrentPhase(state: TimerState): TimerPhase | null {
  return state.phases[state.phaseIndex] ?? null;
}

export function getNextPhase(state: TimerState): TimerPhase | null {
  return state.phases[state.phaseIndex + 1] ?? null;
}

function phaseDurationMs(phase: TimerPhase): number {
  return phase.durationSeconds * MS_PER_SECOND;
}

export function getRemainingMs(state: TimerState, now: number): number {
  if (state.status === 'finished') return 0;
  const phase = getCurrentPhase(state);
  if (!phase) return 0;

  if (state.status === 'idle') return phaseDurationMs(phase);
  if (state.status === 'paused') return Math.max(0, state.pausedRemainingMs ?? 0);
  return Math.max(0, phaseDurationMs(phase) - (now - state.phaseStartedAt));
}

export function getRemainingSeconds(state: TimerState, now: number): number {
  return getRemainingMs(state, now) / MS_PER_SECOND;
}

export function getPlannedTotalSeconds(state: TimerState): number {
  return state.phases.reduce((total, phase) => total + phase.durationSeconds, 0);
}

export function getTotalRemainingSeconds(state: TimerState, now: number): number {
  if (state.status === 'finished') return 0;
  const currentRemaining = getRemainingSeconds(state, now);
  const rest = state.phases
    .slice(state.phaseIndex + 1)
    .reduce((total, phase) => total + phase.durationSeconds, 0);
  return currentRemaining + rest;
}

export function getElapsedSeconds(state: TimerState, now: number): number {
  if (state.status === 'finished') {
    return state.finishedElapsedSeconds ?? getPlannedTotalSeconds(state);
  }
  return Math.max(0, getPlannedTotalSeconds(state) - getTotalRemainingSeconds(state, now));
}

function startNextPhase(state: TimerState, now: number): TimerState {
  const nextIndex = state.phaseIndex + 1;
  if (nextIndex >= state.phases.length) {
    return {
      ...state,
      phaseIndex: state.phases.length,
      phaseStartedAt: now,
      pausedRemainingMs: null,
      status: 'finished',
      finishedElapsedSeconds: getElapsedSeconds(state, now),
    };
  }

  return {
    ...state,
    phaseIndex: nextIndex,
    phaseStartedAt: now,
    pausedRemainingMs: null,
    status: 'running',
  };
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'finished') return state;
  if (state.status === 'running') return state;
  if (state.status === 'paused') {
    const phase = getCurrentPhase(state);
    if (!phase) return state;
    const remainingMs = state.pausedRemainingMs ?? 0;
    return {
      ...state,
      status: 'running',
      phaseStartedAt: now - (phaseDurationMs(phase) - remainingMs),
      pausedRemainingMs: null,
    };
  }

  return {
    ...state,
    status: 'running',
    phaseStartedAt: now,
  };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  return {
    ...state,
    status: 'paused',
    pausedRemainingMs: getRemainingMs(state, now),
  };
}

export function tickTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  const phase = getCurrentPhase(state);
  if (!phase) return state;

  let remainingMs = phaseDurationMs(phase) - (now - state.phaseStartedAt);
  if (remainingMs > 0) return state;

  let nextState = state;
  while (remainingMs <= 0 && nextState.status === 'running') {
    const previousIndex = nextState.phaseIndex;
    const previousStartedAt = nextState.phaseStartedAt;
    const previousDuration = phaseDurationMs(nextState.phases[previousIndex]);
    const exactNextStart = previousStartedAt + previousDuration;

    nextState = startNextPhase(nextState, exactNextStart);

    if (nextState.status === 'finished') {
      nextState = {
        ...nextState,
        finishedElapsedSeconds: getPlannedTotalSeconds(state),
      };
      break;
    }

    remainingMs = phaseDurationMs(nextState.phases[nextState.phaseIndex]) - (now - nextState.phaseStartedAt);
  }

  return nextState;
}

export function skipPhase(state: TimerState, now: number): TimerState {
  if (state.status === 'finished') return state;
  return startNextPhase({ ...state, status: 'running' }, now);
}

export function addSeconds(state: TimerState, now: number, seconds: number): TimerState {
  if (state.status === 'finished' || seconds <= 0) return state;

  if (state.status === 'idle') {
    const current = getCurrentPhase(state);
    if (!current) return state;
    const phases = state.phases.map((phase, index) =>
      index === state.phaseIndex
        ? { ...phase, durationSeconds: phase.durationSeconds + seconds }
        : phase,
    );
    return { ...state, phases };
  }

  if (state.status === 'paused') {
    return {
      ...state,
      pausedRemainingMs: (state.pausedRemainingMs ?? 0) + seconds * MS_PER_SECOND,
    };
  }

  return {
    ...state,
    phaseStartedAt: state.phaseStartedAt + seconds * MS_PER_SECOND,
  };
}

export function finishTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'finished') return state;
  return {
    ...state,
    status: 'finished',
    pausedRemainingMs: null,
    finishedElapsedSeconds: getElapsedSeconds(state, now),
  };
}
