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
const ROTATION_RATE_POSITIVE_THRESHOLD = 0.5;
const ROTATION_RATE_NEGATIVE_THRESHOLD = -0.5;
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
    /** @xstate-layout N4IgpgJg5mDOIC5QCMBOYCGAXAFgSwDsoA6AVwIGsCB7AdwIGIBlAQQFkAFAGQFEBtAAwBdRKAAO1WHix5qBUSAAeiAIwqA7CuIA2ABwCALAE5t2gEwqjK7QFYANCACeiALQWjxfQGZ1No+oCzAwEBbQBfMIc0TFxCEnIqOkZWTl4+FREkEAkpGTkFZQQVLy8zYiMvG3UzARVgr11TB2cEFw0y9QEjEPabKoEAiKj0bHwiYhzpPAA3MDZqWYBbMAIsZnZufmEFSbz5LMKVM2PiGy8DPQGbWt0zXWbESq0VXQNz6xVr8+11IZBo0ZxCbULArGQYAA2ADkwFBsDM5gswMtVutUltMuJJFN8gdVNoXp4zNonnpSj57k5EGYbMRLCTagJbrdfAYzH8AbFxhJQas8JCYXCZLN5kswWjNulMdlsXsCqp1MZiDVigZFdZXiYHkU7sR1D8fpYvAJiZYOSMuSQeWD+dDYfCRUiUWsUpKzNLdrJ9qBDuojLTGvo6kzSdqLB0BtoKjT9QZdF5zTExiQCPbhYixajXWltllPbifaoXlpLsZTO5rPYqUUDFpdNcTBZXiVbgZE4DuSCbZCOLKEaLkeLsxidn2C0pEPrad1OsFPmomVWWrT6caVEy7mZWezIv8LcngbzwRDe7l+06hxs0hlR2fx4UKgJlVGTRUDA2zF5tevdKcND9jDjLxLhUdtLUPbsTz7R1MxdK9+HdW8cW9CcEH8AwdAMYJjlrc4rHUb99D1SNoyqbQgJ3XcaAgOAFE5ZMkLlPEEE0dRygGQxahsBd621FwsO0HQBi8KxbFZPwwIPBIaHoRivXlIo6gwmxbCsUpdHreM+MqDx13UETK3EoxJKBT0YMHVY5PvRBHzpboNN0RVa0sSkWlKMo3jeT94zZIJQN3ejTK7PkBTTc9YKslDDmuDCQkabiVO0AQvEsPijA8F9bAuU01TZEzxlTIVwosrBIoU6wjF-TR-SqEovO1dziE88kfJw-zhiTIKj1tU8pnM50yuYqwMLjAJfCMO4JvONKMpnC5biZfSzgiCIgA */
    id: 'breathing',
    initial: 'unknown',
    context: {
      positiveThresholdCount: 0,
      negativeThresholdCount: 0,
      lastConfirmedMovement: STATE_VALUES.unknown,
      currentMovementState: STATE_VALUES.unknown,
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
          ],
        },
      },
      positiveMovement: {
        value: STATE_VALUES.positiveMovement,
        entry: [
          'clearPositiveThreshold',
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
          ],
        },
      },
      negativeMovement: {
        value: STATE_VALUES.negativeMovement,
        entry: [
          'clearNegativeThreshold',
          'setLastConfirmedMovementAsNegative',
          'setCurrentMovementStateAsNegative',
        ],
        on: {
          SAMPLE: {
            cond: 'isPotentialFirstPartPositiveMovementDetected',
            target: 'potentialPositiveMovement',
            actions: ['incrementPositiveThreshold'],
          },
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
    },
  },
);

const breathingService = interpret(breathingMachine, { devTools: true }).start();

export { breathingService, breathingMachine, STATE_VALUES };
