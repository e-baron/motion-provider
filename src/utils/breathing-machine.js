// eslint-disable-next-line import/no-extraneous-dependencies
import { createMachine, interpret, assign } from 'xstate';

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
    /** @xstate-layout N4IgpgJg5mDOIC5QCMBOYCGAXAFgSwDsoA6AVwIGsCB7AdwIGEMAbAWwGIBlAQQFkAFADIBRANoAGALqJQAB2qw8WPNQIyQAD0QBaAOwAWfcQCsAZgAcp-eIBspgEzn7p0wBoQATx27TxUzfFdG3MbQ11jfSCAXyj3NExcQhJyKjpGFg4eARFRAEZpJBB5RWVVdS0EbVzTXNy-fRtc23CATl1c-XcvBCDiXR8Gp2N7XMdnGLj0bHwiMkoaen5qLDACZRYlkrwANzBeal3WVawuPiExKXVipRU1Qoqq-V9c3Udh8UtX+2MuxFHxPo2XTib42ewtaqhfQTEDxaZJOapRbLY54DYKG67faHY6nbJifJXDGlO6gB4vAHggJNGoOXLmcy-BD0lrEcTiBwhUyBFpPew2GFwxKzFILAhLFZrNHMTaYvYHMBHNZ486iewFOTE27lHR1XItZziFq84zGA3BNyeRDDczEez6CH6M323QtcTGQVTYXJeZpCWolgAOTAUGwO3lOOVWVVl0K1xJOsqLTBxGNjQ+5lsIKZ9qMILdxiBxohtnsnoSMx9SPFKKlQZDYaxCqVJ2jOUJca1ZXuuv1AMLAXET3MBn09l0TLsumITys4VCRt0IXL8JFvuRkvWzGDoeUTcjrbOOXVRK23bJOidxHMkQZLhaI-aH0nyZMBo5+hCxn1LVMK+9xDxuG2KKribYXBqRRdqSmiXv0fTuv4xg+KaTg2EyFgAkapgGNyuSFvSf6xLCXqVoBWr7qBawAOpKDg-p1tuDZ7hGVGHviEiQUB56wZU5hNMQ1QPtyrpBD4E5WggVg2Gy-TIR0jQ2I6RGTBWCJAZRLa0bgDFbjujasS2Krtlx0GJnouQye09jfO0LwOKYLRMsY5jGMQNhKT4dj6kuZj-mRGmGcc2n0bWenMcBzZgUeYgnp2Z4wRU9lshYvk+B8ToSd0Doyb+LIGJYTpjtCxFCmRBARZp0UcbGmoJeZbSsoE+j4d+ASuaYPySU4vhLuCOE+eOJWqauJAVbukUHiFunSrKLEgUZ4GcaeNw8eSbp9FyZgOvxtROZJvl+OCI44eI+HcipJFqbM40GQtwV0TN6JbFVUYxXkpn1T2lSjG5dm-pY34NBCTItdOzQ3t8ImFt8-kIrd81RTRj1hbNFFBW9HFxXVq2JX8KbBAEOEhB5gTPpJ-j2PUjThPagMjDExE0BAcDqGVSQrQm31VJ1rLSU0QJmu0nSSVUATXgEQTJqayH9LocNrtWTBsJz2rc0CuW-qa4nAh8uRMr0-TSUMIxjB6pWkQiop+qjz1yvdayq2tOjGEa17AmC86uTepoG1ZAzBN8ptDArVZik9TETa9WBO3jP1nbadhjv45jJgy-J+30Acm6MPWh+RL0YzH8W4+ZoKpkCS7BK5Q7k90Li+LyLyFtYrw3vngUO1g0225Hd1I8XONcxelQOm5HxGo+YLDL+lrZTe7n2lOLQuZDoT5wjk1sbH5ka6mWvIThuv8QbDp2tnQe55d7M3ZVRc95uaOF13O-q70xqdYf-Tsif3WWFnxtL6OCIjEIAA */
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

const breathingService = interpret(breathingMachine).start();

export { breathingService, breathingMachine, STATE_VALUES };
