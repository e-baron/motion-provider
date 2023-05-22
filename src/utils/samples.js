// eslint-disable-next-line import/no-extraneous-dependencies
import KalmanFilter from 'kalmanjs';

import { STATE_VALUES, breathingService } from './breathing-machine';

let kalmanFilter;
const setKalmanFilter = (configuration = { R: 0.01, Q: 3 }) => {
  kalmanFilter = new KalmanFilter(configuration);
};

const getKalmanFilter = () => kalmanFilter;

const samples = [];

let counter = 0;

/*
const EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD = 10;
const EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD = 10;
const ROTATION_RATE_POSITIVE_THRESHOLD = 0.5;
const ROTATION_RATE_NEGATIVE_THRESHOLD = -0.5;
let currentBreathingState = 0;
let currentRotationRateCountAbovePositiveThreshold = 0;
let currentRotationRateCountAboveNegativeThreshold = 0;
*/

/**
 * Add a new sample to an array. If the array contains already maxSamples elements :
 * - remove the first element
 * - add the new sample to the end of the array
 * @param {Object} newSample
 * @param {Number} maxSamples
 */
function addSample(newSample, maxSamples = 1000) {
  if (counter >= maxSamples) {
    samples.shift();
  } else {
    counter += 1;
  }
  // Add the new sample to the end of the array
  samples.push(newSample);
}

/**
 *
 * @returns the last element or undefined if there are no elements
 */
function getLastSample() {
  if (samples.length === 1) return undefined;
  return samples[samples.length - 1];
}

function clearSamples() {
  samples.splice(0, samples.length);
}

function downloadSamplesAsJsonFile() {
  const jsonString = JSON.stringify(samples);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `samples-${new Date().toLocaleString()}.json`;
  link.click();
}

/**
 * Clear the current array and reset it to newSamples array
 * @param {Array} newSamples
 */
function resetSamples(newSamples) {
  clearSamples();
  samples.concat(newSamples);
}

/**
 * Add a new sample to an array and add a new property for the given. If the array contains already maxSamples elements :
 * - remove the first element
 * - add the new sample to the end of the array
 * @param {Object} newSample
 * @param {Number} maxSamples
 * @return the extended sample data with filtered info under the property name equals to keyToFilter + "Filter"
 * Example : if keyToFilter = 'z', then {...newSample, zFiltered : ...} will be returned
 */
async function addSampleAndFiltering(
  newSample,
  options = {
    maxSamples: 1000,
    keyToFilters: ['z'],
    kalmanFilter: { R: 0.01, Q: 3 },
    keyToDetermineInOut: 'rotationRateAlpha',
  },
) {
  if (counter >= options.maxSamples) {
    samples.shift();
  } else {
    counter += 1;
  }
  // Add the new sample to the end of the array
  const extendedSample = { ...newSample };

  options.keyToFilters.forEach((key) => {
    extendedSample[`${key}Filtered`] = kalmanFilter.filter(extendedSample[key]);
  });

  // extendedSample.inOut = await determineInOutState(newSample, options.keyToDetermineInOut);
  const inOutData = await determineInOutState(newSample, options.keyToDetermineInOut);
  const furtherExtendedSample = { ...extendedSample, ...inOutData };

  samples.push(furtherExtendedSample);
  return extendedSample;
}

/**
 * Determine if the current sample, based on a rotationRate, corresponds to an in or out breath
 * @param {Object} newSample
 * @param {String} keyToDetermineInOut
 * @returns the in or out status breath (0 is the unknown status, 1 is in, -1 is out)
 */
async function determineInOutState(newSample, keyToDetermineInOut) {
  const currentRotationRate = newSample[keyToDetermineInOut];
  // console.log('currentRotationRate : ', currentRotationRate);
  // await sendWithState({ type: 'SAMPLE', currentRotationRate });
  breathingService.send({ type: 'SAMPLE', currentRotationRate });
  const currentState = breathingService.getSnapshot();
  const currentStateValue = STATE_VALUES[currentState.value];
  const inOutData = { inOut: currentStateValue, ...currentState.context };
  // console.log('inOutData:', inOutData);

  // return currentStateValue;
  return inOutData;
}

// eslint-disable-next-line no-unused-vars
function sendWithState(event) {
  return new Promise((resolve) => {
    breathingService.onTransition((state) => {
      resolve(state);
    });
    breathingService.send(event);
  });
}

/**
 * Determine if the current sample, based on a rotationRate, corresponds to an in or out breath
 * @param {Object} newSample
 * @param {String} keyToDetermineInOut
 * @returns the in or out status breath (0 is the unknown status, 1 is in, -1 is out)
 */

/*
function determineInOutState(newSample, keyToDetermineInOut) {
  const currentRotationRate = newSample[keyToDetermineInOut];

  if (currentBreathingState === 0) {
    if (
      currentRotationRateCountAboveNegativeThreshold === 0 &&
      currentRotationRateCountAbovePositiveThreshold === 0
    ) {
      if (currentRotationRate >= ROTATION_RATE_POSITIVE_THRESHOLD) {
        currentRotationRateCountAbovePositiveThreshold += 1;
        return currentBreathingState; // 0
      }

      if (currentRotationRate <= ROTATION_RATE_NEGATIVE_THRESHOLD) {
        currentRotationRateCountAboveNegativeThreshold += 1;
        return currentBreathingState; // 0
      }
    }

    if (currentRotationRateCountAbovePositiveThreshold >= 1) {
      if (currentRotationRate > 0) {
        currentRotationRateCountAbovePositiveThreshold += 1;
        if (
          currentRotationRateCountAbovePositiveThreshold ===
          EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD
        ) {
          currentBreathingState = 1;
          // reinit other state variables
          currentRotationRateCountAbovePositiveThreshold = 0;
          return currentBreathingState; // 1
        }
        // threshold not met
        return currentBreathingState; // 0
      }
      // currentRotationRate <= 0 => reset state variables
      currentRotationRateCountAbovePositiveThreshold = 0;
      if (currentRotationRate < ROTATION_RATE_NEGATIVE_THRESHOLD) {
        currentRotationRateCountAboveNegativeThreshold = +1;
      }
      return currentBreathingState; // 0
    }

    if (currentRotationRateCountAboveNegativeThreshold >= 1) {
      if (currentRotationRate < 0) {
        currentRotationRateCountAboveNegativeThreshold += 1;
        if (
          currentRotationRateCountAboveNegativeThreshold ===
          EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD
        ) {
          currentBreathingState = -1;
          // reinit other state variables
          currentRotationRateCountAboveNegativeThreshold = 0;
          return currentBreathingState; // -1
        }
        // threshold not met
        return currentBreathingState; // 0
      }
      // currentRotationRate >= 0 => reset state variables
      currentRotationRateCountAboveNegativeThreshold = 0;
      if (currentRotationRate > ROTATION_RATE_POSITIVE_THRESHOLD) {
        currentRotationRateCountAbovePositiveThreshold = +1;
      }
      return currentBreathingState; // 0
    }
  }

  if (currentBreathingState === 1) {
    if (currentRotationRateCountAboveNegativeThreshold === 0) {
      if (currentRotationRate <= ROTATION_RATE_NEGATIVE_THRESHOLD) {
        currentRotationRateCountAboveNegativeThreshold += 1;
        return currentBreathingState; // 1
      }
      // nothing to be done
      return currentBreathingState; // 1
    }

    if (currentRotationRateCountAboveNegativeThreshold >= 1) {
      if (currentRotationRate < 0) {
        currentRotationRateCountAboveNegativeThreshold += 1;
        if (
          currentRotationRateCountAboveNegativeThreshold ===
          EXPECTED_SAMPLE_COUNT_ABOVE_NEGATIVE_THRESHOLD
        ) {
          currentBreathingState = -1;
          // reinit other state variables
          currentRotationRateCountAboveNegativeThreshold = 0;
          return currentBreathingState; // -1
        }
        // threshold not met
        return currentBreathingState; // 1
      }
      // currentRotationRate >= 0 => reset state variables
      currentRotationRateCountAboveNegativeThreshold = 0;
      return currentBreathingState; // 1
    }
  }

  if (currentBreathingState === -1) {
    if (currentRotationRateCountAbovePositiveThreshold === 0) {
      if (currentRotationRate >= ROTATION_RATE_POSITIVE_THRESHOLD) {
        currentRotationRateCountAbovePositiveThreshold += 1;
        return currentBreathingState; // -1
      }
      // nothing to be done
      return currentBreathingState; // -1
    }

    if (currentRotationRateCountAbovePositiveThreshold >= 1) {
      if (currentRotationRate > 0) {
        currentRotationRateCountAbovePositiveThreshold += 1;
        if (
          currentRotationRateCountAbovePositiveThreshold ===
          EXPECTED_SAMPLE_COUNT_ABOVE_POSITIVE_THRESHOLD
        ) {
          currentBreathingState = 1;
          // reinit other state variables
          currentRotationRateCountAbovePositiveThreshold = 0;
          return currentBreathingState; // 1
        }
        // threshold not met
        return currentBreathingState; // 0
      }
      // currentRotationRate <= 0 => reset state variables
      currentRotationRateCountAbovePositiveThreshold = 0;
      return currentBreathingState; // -1
    }
  }
  return 0;
} */

export {
  samples,
  addSample,
  getLastSample,
  clearSamples,
  downloadSamplesAsJsonFile,
  resetSamples,
  addSampleAndFiltering,
  getKalmanFilter,
  setKalmanFilter,
};
