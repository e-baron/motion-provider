// eslint-disable-next-line import/no-extraneous-dependencies
import KalmanFilter from 'kalmanjs';

let kalmanFilter ;
const setKalmanFilter = (configuration = { R: 0.01, Q: 3 }) => {
  kalmanFilter = new KalmanFilter(configuration);
};

const getKalmanFilter = () => kalmanFilter;

const samples = [];

let counter = 0;

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
function addSampleAndFiltering(
  newSample,
  options = { maxSamples: 1000, keyToFilter: 'z', kalmanFilter: { R: 0.01, Q: 3 } },
) {
  if (counter >= options.maxSamples) {
    samples.shift();
  } else {
    counter += 1;
  }
  // Add the new sample to the end of the array
  const extendedSample = { ...newSample };
  extendedSample[`${options.keyToFilter}Filtered`] = kalmanFilter.filter(
    extendedSample[options.keyToFilter],
  );

  samples.push(extendedSample);
  return extendedSample;
}

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
