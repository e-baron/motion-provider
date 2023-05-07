const samples = [];

const MAX_SAMPLES = 1000;

let counter = 0;

function addSample(newSample) {
  if (counter >= MAX_SAMPLES) {
    samples.shift();
  } else {
    counter += 1;
  }
  // Add the new sample to the end of the array
  samples.push(newSample);
}

export { samples, addSample };
