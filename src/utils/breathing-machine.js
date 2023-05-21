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

/*
const isFullPostiveMovementDetected = (context, event) =>
  event.currentRotationRate > NO_ROTATION_RATE &&
  context.positiveThresholdCount === EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD;

const isPotentialFirstPartPositiveMovementDetected = (context, event) =>
  event.currentRotationRate > ROTATION_RATE_POSITIVE_THRESHOLD &&
  context.positiveThresholdCount === 0;

const isPotentialSecondPartPositiveMovementDetected = (context, event) =>
  event.currentRotationRate > NO_ROTATION_RATE &&
  context.positiveThresholdCount > 0 &&
  context.positiveThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD;

const isFullNegativeMovementDetected = (context, event) =>
  event.currentRotationRate < NO_ROTATION_RATE &&
  context.negativeThresholdCount === EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD;

const isPotentialFirstPartNegativeMovementDetected = (context, event) =>
  event.currentRotationRate < ROTATION_RATE_NEGATIVE_THRESHOLD &&
  context.negativeThresholdCount === 0;

const isPotentialSecondPartNegativeMovementDetected = (context, event) =>
  event.currentRotationRate < NO_ROTATION_RATE &&
  context.negativeThresholdCount > 0 &&
  context.negativeThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD; */

const STATE_VALUES = {
  unknown: 0,
  potentialPositiveMovement: 1,
  positiveMovement: 2,
  potentialNegativeMovement: -1,
  negativeMovement: -2,
};

const breathingMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCMBOYCGAXAFgSwDsoA6AVwIGsCB7AdwIGIBlAQQFkAFAGQFEBtAAwBdRKAAO1WHix5qBUSAAeiAIwqA7CuIA2ABwCALAE5t2gEwqjK7QFYANCACeiALQWjxfQGZ1No+oCzAwEBbQBfMIc0TFxCEnIqOkZWTl4+FREkEAkpGTkFZQQVLy8zYiMvG3UzARVgr11TB2cEFw0y9QEjEPabKoEAiKj0bHwiYhzpPAA3MDZqWYBbMAIsZnZufmEFSbz5LMKVM2PiGy8DPQGbWt0zXWbESq0VXQNz6xVr8+11IZBo0ZxCbULArGQYAA2ADkwFBsDM5gswMtVutUltMuJJFN8gdVNoXp4zNonnpSj57k5EGYbMRLCTagJbrdfAYzH8AbFxhJQas8JCYXCZLN5kswWjNulMdlsXsCqp1MZiDVigZFdZXiYHkU7sR1D8fpYvAJiZYOSMuSQeWD+dDYfCRUiUWsUpKzNLdrJ9qBDuojLTGvo6kzSdqLB0BtoKjT9QZdF5zTExiQCPbhYixajXWltllPbifaoXlpLsZTO5rPYqUUDFpdNcTBZXiVbgZE4DuSCbZCOLKEaLkeLsxidn2C0pEPrad1OsFPmomVWWrT6caVEy7mZWezIv8LcngbzwRDe7l+06hxs0hlR2fx4UKgJlVGTRUDA2zF5tevdKcND9jDjLxLhUdtLUPbsTz7R1MxdK9+HdW8cW9CcEH8AwdAMYJjlrc4rHUb99D1SNoyqbQgJ3XcaAgOAFE5ZMkLlPEEE0dRygGQxahsBd621FwsO0HQBi8KxbFZPwwIPBIaHoRivXlIo6gwmxbCsUpdHreM+MqDx13UETK3EoxJKBT0YMHVY5PvRBHzpboNN0RVa0sSkWlKMo3jeT94zZIJQN3ejTK7PkBTTc9YKslDDmuDCQkabiVO0AQvEsPijA8F9bAuU01TZEzxlTIVwosrBIoU6wjF-TR-SqEovO1dziE88kfJw-zhiTIKj1tU8pnM50yuYqwMLjAJfCMO4JvONKMpnC5biZfSzgiCIgA */
    id: 'breathing',
    initial: 'unknown',
    context: {
      positiveThresholdCount: 0,
      negativeThresholdCount: 0,
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
            },
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
            },
          ],
        },
      },
      positiveMovement: {
        value: STATE_VALUES.positiveMovement,
        entry: ['clearPositiveThreshold'],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
            },
          ],
        },
      },
      potentialNegativeMovement: {
        value: STATE_VALUES.potentialNegativeMovement,
        entry: ['incrementNegativeThreshold'],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
              actions: ['clearNegativeThreshold'],
            },
            {
              cond: 'isPotentialSecondPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
            },
            {
              cond: 'isFullNegativeMovementDetected',
              target: 'negativeMovement',
            },
          ],
        },
      },
      negativeMovement: {
        value: STATE_VALUES.negativeMovement,
        entry: ['clearNegativeThreshold'],
        on: {
          SAMPLE: {
            cond: 'isPotentialFirstPartPositiveMovementDetected',
            target: 'potentialPositiveMovement',
          },
        },
      },
      potentialPositiveMovement: {
        value: STATE_VALUES.potentialPositiveMovement,
        entry: ['incrementPositiveThreshold'],
        on: {
          SAMPLE: [
            {
              cond: 'isPotentialFirstPartNegativeMovementDetected',
              target: 'potentialNegativeMovement',
              actions: ['clearPositiveThreshold'],
            },
            {
              cond: 'isPotentialSecondPartPositiveMovementDetected',
              target: 'potentialPositiveMovement',
            },
            {
              cond: 'isFullPostiveMovementDetected',
              target: 'positiveMovement',
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
    },
    guards: {
      isFullPostiveMovementDetected: (context, event) =>
        event.currentRotationRate > NO_ROTATION_RATE &&
        context.positiveThresholdCount === EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD,

      isPotentialFirstPartPositiveMovementDetected: (context, event) =>
        event.currentRotationRate > ROTATION_RATE_POSITIVE_THRESHOLD &&
        context.positiveThresholdCount === 0,

      isPotentialSecondPartPositiveMovementDetected: (context, event) =>
        event.currentRotationRate > NO_ROTATION_RATE &&
        context.positiveThresholdCount > 0 &&
        context.positiveThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD,

      isFullNegativeMovementDetected: (context, event) =>
        event.currentRotationRate < NO_ROTATION_RATE &&
        context.negativeThresholdCount === EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD,

      isPotentialFirstPartNegativeMovementDetected: (context, event) =>
        event.currentRotationRate < ROTATION_RATE_NEGATIVE_THRESHOLD &&
        context.negativeThresholdCount === 0,

      isPotentialSecondPartNegativeMovementDetected: (context, event) =>
        event.currentRotationRate < NO_ROTATION_RATE &&
        context.negativeThresholdCount > 0 &&
        context.negativeThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD,
    },
  },
);

const breathingService = interpret(breathingMachine, { devTools: true }).start();

export { breathingService, breathingMachine, STATE_VALUES };
