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
  context.negativeThresholdCount < EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD;

const STATE_VALUES = {
  unknown: 0,
  unknownPotentialPositiveMovement: 1,
  unknownPotentialNegativeMovement: -1,
  positiveMovement: 3,
  positiveMovementWithPotentialNegativeMovement: 2,
  negativeMovement: -3,
  negativeMovementWithPotentialPositiveMovement: -2,
};

const breathingMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCMBOYCGAXAFgSwDsoA6AVwIGsCB7AdwIGIBlAQQFkAFAGQFEBtAAwBdRKAAO1WHix5qBUSAAeiAMwBGACzEArBoBsADm0B2fRoBMATm0CNAGhABPRHr0DixvStsqNmyyp6GgC+wQ5omLiEJORUdIysnLx8aiJIIBJSMnIKygjqWrqGJmZWNvZOqhoGxBaWemqWxqbmumqh4ejY+ERklDT0HNRYYAQyGAA2Q1l4AG5gbNTzALajWMzs3PzCCpnSsvLpeWrG5mrEBvoqKp5NGgJqDs4I2k3Evl7aKiZqmtp6HRAEW60T6cUGwzWeEm03280WKzWGyS-FSu0k+xyR0Q5gE5i0lxuhgM5nUAgCT0Q-3MtSsem0BlM90s5gMgOBUV6sQGBCGIzG0KmGJk8KWYFWY2RWz45jS4mFB1yOLxBI0RIMJLJFMqCFcxneejugUClksjPZXU5MX68T5UMmADkwFBsHMFmKJetEtKduk9tlDqA8g19dSzI1tGp1JSEKztMQHlYNAFmiyAWEgZaetbwbzIQLHc7XaLEZLvck0X6FVig4gNSpaWoDAJjFHTQZNDGbvrPEnrMZGeTLCEMxzs2CeXaCxMnS6Re7S17NslZeiZjWlHWDA2LE2W22zZ2dWoHh5zEEgmpcTczhbIuP-W6EeKkeXtnKMtXA5vY18acZfGTapdBUEkY10fUPm8FRLF+WCR06e9QUfEsXzGAB1aQcCncYZyLedn09KVkl9eV12-PJWXqYh6SCM4WVeQwu3MGlvhJBkNH0AQHgMdNEJBXoUIXNCsEw3AcMFWdi2Eoi3xSD9Hw3Si-w8QDhyMNUwJ1GDzhOepNGqckbl4u8BJIITCLWMTsPzXCpIIj1X2XfhVyrcilV-FR-18bRfJg89Wz0GMO1qU16gEAxTW+aDTKtYgCHwp9HLLZzBAUr8PM0AQGxPFM8V+RlLBjfF42vARtBY+42VHLNQQSucksXayJJhBVUNk1LSM-dzsQQE5suIJp6Q1CqKosFQYzUVwPDxdtI2TJpQNi8d6ukyyMKwlqhRmdqnJReS10xCjlXxC41U8DVSVyiadUjc4WXqM4AOHTxjGWurEt2jbxNswVYQcxdiJc9KetrWMVTO9VNWu4rTqG5NTleXFyWqjMaAgOAFDHaJDoDDyAFogp1Qn3q5G16FxxVeosGM3D0Yg9K8bx8SaepSZzSdftanaZLWSmlMQKagh0U5hy+QKvIMWmKrOpmNTUSMOz4zMkLJ3MtvsxqRP546Xn+GjGQ0VtAiMFjjC7e4dCvepQOsbibgQlWzOICzkqwHWPJY6azU4plvFbBXwNOj4rHK7cjdg9mXba3nvps-k7M+2P3bco7PYHAljEjEpjFgo9nm7C4GROXyWJbARlex3pVoB7XU7x3rflaHQ9FaK9TCzy4u10DxW8eqNyvpbKo5rrXPWarntrhZOPcb14GyMzufJDG7nhYmkyoHryW0jUJQiAA */
    id: 'breathing',
    initial: 'unknown',
    context: {
      positiveThresholdCount: 0,
      negativeThresholdCount: 0,
    },
    states: {
      unknown: {
        value: STATE_VALUES.unknown,
        entry: ['clearNegativeThreshold', 'clearPositiveThreshold'],
        on: {
          SAMPLE: [
            {
              cond: isPotentialFirstPartPositiveMovementDetected,
              target: 'unknownPotentialPositiveMovement',
            },
            {
              cond: isPotentialFirstPartNegativeMovementDetected,
              target: 'unknownPotentialNegativeMovement',
            },
          ],
        },
      },
      unknownPotentialPositiveMovement: {
        value: STATE_VALUES.unknownPotentialPositiveMovement,
        entry: ['incrementPositiveThreshold'],
        on: {
          SAMPLE: [
            {
              cond: isPotentialSecondPartPositiveMovementDetected,
              target: 'unknownPotentialPositiveMovement',
            },
            {
              cond: isFullPostiveMovementDetected,
              target: 'positiveMovement',
            },
            {
              cond: isPotentialFirstPartNegativeMovementDetected,
              target: 'positiveMovementWithPotentialNegativeMovement',
              actions: ['clearPositiveThreshold'],
            },
          ],
        },
      },
      unknownPotentialNegativeMovement: {
        value: STATE_VALUES.unknownPotentialNegativeMovement,
        entry: ['incrementNegativeThreshold'],
        on: {
          SAMPLE: [
            {
              cond: isPotentialSecondPartNegativeMovementDetected,
              target: 'unknownPotentialNegativeMovement',
            },
            {
              cond: isFullNegativeMovementDetected,
              target: 'negativeMovement',
            },
            {
              cond: isPotentialFirstPartPositiveMovementDetected,
              target: 'negativeMovementWithPotentialPositiveMovement',
              actions: ['clearNegativeThreshold'],
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
              cond: isPotentialFirstPartNegativeMovementDetected,
              target: 'positiveMovementWithPotentialNegativeMovement',
            },
          ],
        },
      },
      positiveMovementWithPotentialNegativeMovement: {
        value: STATE_VALUES.positiveMovementWithPotentialNegativeMovement,
        entry: ['incrementNegativeThreshold'],
        on: {
          SAMPLE: [
            {
              cond: isPotentialSecondPartNegativeMovementDetected,
              target: 'positiveMovementWithPotentialNegativeMovement',
            },
            {
              cond: isFullNegativeMovementDetected,
              target: 'negativeMovement',
            },
            {
              cond: isPotentialFirstPartPositiveMovementDetected,
              target: 'negativeMovementWithPotentialPositiveMovement',
              actions: ['clearNegativeThreshold'],
            },
          ],
        },
      },
      negativeMovement: {
        value: STATE_VALUES.negativeMovement,
        entry: ['clearNegativeThreshold'],
        on: {
          SAMPLE: [
            {
              cond: isPotentialFirstPartPositiveMovementDetected,
              target: 'negativeMovementWithPotentialPositiveMovement',
            },
          ],
        },
      },
      negativeMovementWithPotentialPositiveMovement: {
        value: STATE_VALUES.negativeMovementWithPotentialPositiveMovement,
        entry: ['incrementPositiveThreshold'],
        on: {
          SAMPLE: [
            {
              cond: isPotentialSecondPartPositiveMovementDetected,
              target: 'negativeMovementWithPotentialPositiveMovement',
            },
            {
              cond: isFullPostiveMovementDetected,
              target: 'positiveMovement',
            },
            {
              cond: isPotentialFirstPartNegativeMovementDetected,
              target: 'positiveMovementWithPotentialNegativeMovement',
              actions: ['clearPositiveThreshold'],
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
  },
);

const breathingService = interpret(breathingMachine, { devTools: true }).start();

export { breathingService, breathingMachine, STATE_VALUES };
