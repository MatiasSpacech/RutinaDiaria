import {
  addSeconds,
  buildTimerPhases,
  createTimerState,
  finishTimer,
  getCurrentPhase,
  getElapsedSeconds,
  getRemainingSeconds,
  getTotalRemainingSeconds,
  pauseTimer,
  skipPhase,
  startTimer,
  tickTimer,
  type TimerPlan,
} from '@/domain/timer';

const plan: TimerPlan = {
  rounds: 2,
  prepSeconds: 5,
  restBetweenExercisesSeconds: 0,
  restBetweenRoundsSeconds: 15,
  exercises: [
    { name: 'Sentadilla', durationSeconds: 30, restSeconds: 10 },
    { name: 'Press', durationSeconds: 20, restSeconds: 0 },
  ],
};

describe('secuencia de fases', () => {
  it('arma preparación, trabajo, descansos y rondas', () => {
    const phases = buildTimerPhases(plan);

    expect(phases.map((phase) => `${phase.kind}:${phase.round}:${phase.exerciseIndex}`)).toEqual([
      'prep:1:0',
      'work:1:0',
      'rest:1:0',
      'work:1:1',
      'roundRest:1:1',
      'work:2:0',
      'rest:2:0',
      'work:2:1',
    ]);
    expect(phases.reduce((total, phase) => total + phase.durationSeconds, 0)).toBe(140);
  });

  it('omite la preparación si está en cero', () => {
    const phases = buildTimerPhases({ ...plan, prepSeconds: 0 });
    expect(phases[0].kind).toBe('work');
  });
});

describe('motor de timer', () => {
  function createStarted(now = 1000) {
    return startTimer(createTimerState(plan), now);
  }

  it('inicia en preparación y avanza sin deriva al terminar una fase', () => {
    let state = createStarted(1000);
    expect(state.status).toBe('running');
    expect(getRemainingSeconds(state, 5000)).toBe(1);

    state = tickTimer(state, 7000);
    expect(getCurrentPhase(state)?.kind).toBe('work');
    expect(getCurrentPhase(state)?.exerciseIndex).toBe(0);
    expect(getRemainingSeconds(state, 7000)).toBe(29);
  });

  it('pausa y reanuda conservando el tiempo restante', () => {
    let state = createStarted(1000);
    state = tickTimer(state, 7000);
    state = pauseTimer(state, 7000);

    expect(state.status).toBe('paused');
    expect(getRemainingSeconds(state, 507000)).toBe(29);
    expect(tickTimer(state, 508000)).toBe(state);

    state = startTimer(state, 20000);
    expect(state.status).toBe('running');
    expect(getRemainingSeconds(state, 20000)).toBe(29);
  });

  it('permite sumar tiempo y saltar fases', () => {
    let state = createStarted(1000);
    state = addSeconds(state, 2000, 5);
    expect(getRemainingSeconds(state, 2000)).toBe(9);

    state = skipPhase(state, 2000);
    expect(getCurrentPhase(state)?.kind).toBe('work');
    expect(getRemainingSeconds(state, 2000)).toBe(30);
  });

  it('calcula el restante total y el transcurrido', () => {
    let state = createStarted(1000);
    expect(getTotalRemainingSeconds(state, 1000)).toBe(140);
    expect(getElapsedSeconds(state, 1000)).toBe(0);

    state = tickTimer(state, 7000);
    expect(getTotalRemainingSeconds(state, 7000)).toBe(134);
    expect(getElapsedSeconds(state, 7000)).toBe(6);
  });

  it('termina al completar todas las fases', () => {
    let state = createStarted(0);
    state = tickTimer(state, 141000);

    expect(state.status).toBe('finished');
    expect(state.phaseIndex).toBe(state.phases.length);
    expect(getTotalRemainingSeconds(state, 141000)).toBe(0);
    expect(getElapsedSeconds(state, 141000)).toBe(140);
  });

  it('permite finalizar antes de tiempo y conserva el transcurrido', () => {
    let state = createStarted(1000);
    state = tickTimer(state, 7000);
    state = finishTimer(state, 12000);

    expect(state.status).toBe('finished');
    expect(getElapsedSeconds(state, 12000)).toBe(11);
  });
});
