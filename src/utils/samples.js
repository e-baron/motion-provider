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

function resetSamples(newSamples) {
  clearSamples();
  samples.concat(newSamples);
}

export { samples, addSample, getLastSample, clearSamples, downloadSamplesAsJsonFile, resetSamples };
