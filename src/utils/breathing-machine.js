// eslint-disable-next-line import/no-extraneous-dependencies
import { createMachine, interpret, assign } from 'xstate';
// eslint-disable-next-line import/no-extraneous-dependencies
// import { inspect } from '@xstate/inspect';

/*
inspect({
  // options
  // url: 'https://stately.ai/viz?inspect', // (default)
  iframe: false, // open in new window
});
*/

const EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD = 10;
const EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD = 10;
const ROTATION_RATE_POSITIVE_THRESHOLD = 1; // 0.5;
const ROTATION_RATE_NEGATIVE_THRESHOLD = -1; // -0.5;
const NO_ROTATION_RATE = 0;

const STATE_VALUES = {
  unknown: 0,
  potentialPositiveMovement: 1,
  positiveMovement: 2,
  potentialNegativeMovement: -1,
  negativeMovement: -2,
};

/**
 * Note that the current state returned by the send method is not the latest. Therefore the state has been added to the
 * context...
 */

const breathingMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCMBOYCGAXAFgSwDsoA6AVwIGsCB7AdwIGIBlAQQFkAFAGQFEBtAAwBdRKAAO1WHix5qBUSAAeiAJwB2AGzEAzLoBMAVgAshvQEYNGlQBoQAT0QBaABzPiZgc70ajzlRoE9V20AXxDbNExcQhJyKjpGVk5ePjMRJBAJKRk5BWUEMzM1NWIDVyNi4oENbTVbBwRtM2IVZx8VJoMDHwEjDTCI9Gx8ImIJLDACGQwAGw5JaTwANzA2ahWAW0msZnZufmEFLMXcjPzfEq71dTVnM20y5yN6xG0BbWI9QzM9FV+1Wp6aoDECRYYxMbUCZTPCzebZZardZgLZTXbJfhpI4LHLyM6IC6lAxqMwqMlvIxGAw2ewElQGUp9KlqapdIwqIwgsHRUbjbawuY4xFrTbbdH7Ph6dLiIWnUD5AwWYjONRfDpeSk+AwvBA+ZoaAzaIIkszGVz9cKgoY8kjHGQrEUosVJCWHDJ22R4+WIDz3ZVqdnvAJdA0aHXGEr+N4s5wGX4GQJc60jW1Ch3I1E7F0pLHu2VepQ+wHENQqU01XoebSWHUkrRmPwBDrqMpxpNRFOQ6HTGYAOTAUGwwozzr2KTdMoRcsLCCBt2IFTLAg6918zh1pmVZdL1J62hVBnb4N5UP5s37g-tSNFaOzmOlmXzeUQQKMAmVxg8CYqZh1RiVfRNJYdxmBUTRHjaXZnn2A5DumN5ZmO-BStiU4Fvk5gCO+gG+D+RpPHUtIIK2C7vA2dz7rG9IQZ2BCwVejqZuK44Ph6075KaAgMroRrGKYFhWH+XSMlqLIGsY9KhJa3K0fRw4Icx96oSc6E+iyHyAk07Kie84YqO+sYaHomjVCYbYgjQEBwAoMkxMpuLPggRjaCoRIkmSHS9FSNINI4RQMgEXg+I2gTBDREJxDQ9D2Z6jkWB0LRqN0qr6a4-w6o4RrED4Bqkh59xPNonLScmEJ8jCcJpteTpTDF7GqK47hvoaDzUkUtQ6kUJRYRUvjVO8tRqOFJ4IvBNVYHVqkIGSWiFTltTOSyv5EbcHw-K0DYksYDx6MNqbdgKF5wdVmaTXFu46EEAhJW0vzshuujED1TyBF01T7ntxB0Ze8njWd+IFJo3Gqlp-jMrpK3OGtvx3CqprOeZYRAA */
    id: 'breathing',
    initial: 'unknown',
    context: {
      positiveThresholdCount: 0,
      negativeThresholdCount: 0,
      lastConfirmedMovement: undefined, // has to be in another state than previousLastConfirmedMovement for the
      currentMovementState: STATE_VALUES.unknown,
      previousLastConfirmedMovement: 0,
    },
    predictableActionArguments: true,
    states: {
      unknown: {
        value: STATE_VALUES.unknown,
        entry: ['clearNegativeThreshold', 'clearPositiveThreshold'],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['incrementPositiveThreshold'],
            },
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['incrementNegativeThreshold'],
            },
          ],
        },
      },
      potentialPositiveMovement: {
        value: STATE_VALUES.potentialPositiveMovement,
        entry: ['setCurrentMovementStateAsPotentialPositiveMovement'],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['clearPositiveThreshold', 'incrementNegativeThreshold'],
            },
            {
              cond: 'isPotentialSecondPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['incrementPositiveThreshold'],
            },
            {
              cond: 'isFullPostiveMovementDetected',
              target: 'positiveMovement',
              actions: ['incrementPositiveThreshold'],
            },
            {
              cond: 'isNoPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['clearPositiveThreshold'],
            },
            {
              cond: 'isPotentialFirstPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['incrementPositiveThreshold'],
            },
          ],
        },
      },
      positiveMovement: {
        value: STATE_VALUES.positiveMovement,
        entry: [
          'clearPositiveThreshold',
          'setPreviousLastConfirmedMovement',
          'setLastConfirmedMovementAsPositive',
          'setCurrentMovementStateAsPositive',
        ],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['incrementNegativeThreshold'],
            },
            {
              target: 'positiveMovement',
            },
          ],
        },
      },
      potentialNegativeMovement: {
        value: STATE_VALUES.potentialNegativeMovement,
        entry: ['setCurrentMovementStateAsPotentialNegativeMovement'],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['clearNegativeThreshold', 'incrementPositiveThreshold'],
            },
            {
              cond: 'isPotentialSecondPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['incrementNegativeThreshold'],
            },
            {
              cond: 'isFullNegativeMovementDetected',
              target: 'negativeMovement',
              actions: ['incrementNegativeThreshold'],
            },
            {
              cond: 'isNoNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['clearNegativeThreshold'],
            },
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['incrementNegativeThreshold'],
            },
          ],
        },
      },
      negativeMovement: {
        value: STATE_VALUES.negativeMovement,
        entry: [
          'clearNegativeThreshold',
          'setPreviousLastConfirmedMovement',
          'setLastConfirmedMovementAsNegative',
          'setCurrentMovementStateAsNegative',
        ],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['incrementPositiveThreshold'],
            },
          ],
        },
      },
    },
  },
  {
    actions: {
      incrementPositiveThreshold: assign({
        positiveThresholdCount: (context) => context.positiveThresholdCount + 1,
      }),
      incrementNegativeThreshold: assign({
        negativeThresholdCount: (context) => context.negativeThresholdCount + 1,
      }),
      clearPositiveThreshold: assign({
        positiveThresholdCount: () => 0,
      }),
      clearNegativeThreshold: assign({
        negativeThresholdCount: () => 0,
      }),
      setLastConfirmedMovementAsPositive: (context) => {
        context.lastConfirmedMovement = STATE_VALUES.positiveMovement;
      },
      setLastConfirmedMovementAsNegative: assign({
        lastConfirmedMovement: () => STATE_VALUES.negativeMovement,
      }),
      setCurrentMovementStateAsPositive: assign({
        currentMovementState: () => STATE_VALUES.positiveMovement,
      }),
      setCurrentMovementStateAsPotentialPositiveMovement: assign({
        currentMovementState: () => STATE_VALUES.potentialPositiveMovement,
      }),
      setCurrentMovementStateAsNegative: assign({
        currentMovementState: () => STATE_VALUES.negativeMovement,
      }),
      setCurrentMovementStateAsPotentialNegativeMovement: assign({
        currentMovementState: () => STATE_VALUES.potentialNegativeMovement,
      }),
      setPreviousLastConfirmedMovement: assign({
        previousLastConfirmedMovement: (context) => context.previousLastConfirmedMovement,
      }),
    },
    guards: {
      isFullPostiveMovementDetected: (context, event) =>
        event.currentRotationRate > NO_ROTATION_RATE &&
        context.positiveThresholdCount === EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD - 1,

      isPotentialFirstPartPositiveMovementDetected: (context, event) =>
        event.currentRotationRate > ROTATION_RATE_POSITIVE_THRESHOLD &&
        context.positiveThresholdCount === 0,

      isPotentialSecondPartPositiveMovementDetected: (context, event) =>
        event.currentRotationRate > NO_ROTATION_RATE &&
        context.positiveThresholdCount > 0 &&
        context.positiveThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD - 1,

      isNoPositiveMovementDetected: (context, event) =>
        event.currentRotationRate <= NO_ROTATION_RATE,

      isFullNegativeMovementDetected: (context, event) =>
        event.currentRotationRate < NO_ROTATION_RATE &&
        context.negativeThresholdCount === EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD - 1,

      isPotentialFirstPartNegativeMovementDetected: (context, event) =>
        event.currentRotationRate < ROTATION_RATE_NEGATIVE_THRESHOLD &&
        context.negativeThresholdCount === 0,

      isPotentialSecondPartNegativeMovementDetected: (context, event) =>
        event.currentRotationRate < NO_ROTATION_RATE &&
        context.negativeThresholdCount > 0 &&
        context.negativeThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD - 1,

      isNoNegativeMovementDetected: (context, event) =>
        event.currentRotationRate >= NO_ROTATION_RATE,
    },
  },
);

const breathingService = interpret(breathingMachine, { devTools: true }).start();

export { breathingService, breathingMachine, STATE_VALUES };
