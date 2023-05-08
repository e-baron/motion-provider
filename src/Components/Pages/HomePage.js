/* eslint-disable import/no-extraneous-dependencies */
import NoSleep from 'nosleep.js';
// import { io } from 'socket.io-client';
import {
  AccelerationChart,
  DisplacementChart,
  clearChart,
  updateChart,
} from '../Chart/MotionChart';
// eslint-disable-next-line no-unused-vars
import {
  addSample,
  clearSamples,
  downloadSamplesAsJsonFile,
  // eslint-disable-next-line no-unused-vars
  getLastSample,
  resetSamples,
} from '../../utils/samples';

const noSleep = new NoSleep();
const MAX_SAMPLES = 1000;

let acceleration = 0;
let velocity = 0;
let displacement = 0;
let lastDisplacement = 0;
let lastVelocity = 0;

// eslint-disable-next-line prefer-const, no-unused-vars
let lastAcceleration = 0; // in m/s^2
// eslint-disable-next-line prefer-const, no-unused-vars
let lastAccelerationSign = 1; // assume positive acceleration to start
let displacementDirection = 1; // assume positive displacement to start

// Set the threshold value for acceleration
// eslint-disable-next-line no-unused-vars
const accelerationThreshold = 0.3; // in m/s^2

let controller; // = new AbortController();

const HomePage = () => {
  renderPageLayout();

  noSleep.disable();

  renderInitDetectionMessage();

  const movementDetectionEnable = checkNavigatorPermissionAndRenderIssues();

  if (!movementDetectionEnable) return;

  const displacementChart = DisplacementChart('#displacementChartWrapper', MAX_SAMPLES);
  const accelerationChart = AccelerationChart('#accelerationChartWrapper', MAX_SAMPLES);

  attachOnStopStartListenener(accelerationChart, displacementChart);

  attachOnFileSelected(accelerationChart, displacementChart);

  /*
  const socket = io('http://localhost:3000');

  socket.on('error', (error) => {
    console.log('error: ', error);
  }); */

  /* 
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disonnected from server');
  });
  */
};

function renderPageLayout() {
  const main = document.querySelector('main');
  const pageLayout = `<h3>This is your phone movement detector!</h3>
  <div>
    <button id="startStopBtn" class="btn btn-primary">Start detection</button>
  </div>
  <div class="mb-3">
    <label for="formFile" class="form-label">Default file input example</label>
    <input class="form-control" type="file" id="filePicker">
  </div>
  <div id="printDataWrapper" class="alert alert-secondary mt-2 d-none"></div>  
  <div class="mt-2">
  <canvas id="displacementChartWrapper" height="500" width="500"></canvas>
</div>
<div class="mt-2">
    <canvas id="accelerationChartWrapper" height="500" width="500"></canvas>
  </div>
  `;
  main.innerHTML = pageLayout;
}

function renderInitDetectionMessage() {
  const printDataWrapper = document.querySelector('#printDataWrapper');
  printDataWrapper.innerHTML = 'Move your device please ; )';
}

async function checkNavigatorPermissionAndRenderIssues() {
  const printDataWrapper = document.querySelector('#printDataWrapper');
  if (window.DeviceMotionEvent) {
    const permissionResult = await navigator.permissions.query({ name: 'accelerometer' });
    if (permissionResult.state === 'granted') {
      return true;
    }
    if (permissionResult.state === 'prompt') {
      printDataWrapper.innerHTML = 'reload page, permission request is pending !';
      return false;
    }
    printDataWrapper.innerHTML = 'permission request denied !';
    return false;
  }
  printDataWrapper.innerHTML = 'You have no device motion detector available.';
  return false;
}

function attachOnFileSelected(accelerationChart, displacementChart) {
  const filePicker = document.querySelector('#filePicker');

  filePicker.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const jsonString = event.target.result;
      const mySamples = JSON.parse(jsonString);
      resetSamples(mySamples);
      updateChart(accelerationChart, mySamples);
      updateChart(displacementChart, mySamples);
    });

    reader.readAsText(file); // this will resolve to change event
  });
}

function attachOnStopStartListenener(accelerationChart, displacementChart) {
  const startStopBtn = document.querySelector('#startStopBtn');
  startStopBtn.addEventListener('click', () => {
    if (startStopBtn.textContent === 'Start detection') {
      controller = new AbortController();
      startMotionDetectionAndDataRendering(accelerationChart, displacementChart);
    } else stopMotionDetection(accelerationChart, displacementChart);
  });
}

async function startMotionDetectionAndDataRendering(accelerationChart, displacementChart) {
  noSleep.enable();
  const startStopBtn = document.querySelector('#startStopBtn');
  startStopBtn.textContent = 'Stop detection';
  attachMotionDetectionListener(accelerationChart, displacementChart);

  /* const messageTransmittedToServer = 'Hi Websocket Server';
  socket.emit('mobile connected', messageTransmittedToServer); */
}

function stopMotionDetection(accelerationChart, displacementChart) {
  noSleep.disable();
  const startStopBtn = document.querySelector('#startStopBtn');
  startStopBtn.textContent = 'Start detection';
  controller.abort(); // this will remove the devicemotion event listener
  clearChart(accelerationChart);
  clearChart(displacementChart);
  downloadSamplesAsJsonFile();
  clearSamples();
}

// eslint-disable-next-line no-unused-vars
function renderPrintDataWrapper(data) {
  const printDataWrapper = document.querySelector('#printDataWrapper');
  printDataWrapper.classList.remove('d-none');

  printDataWrapper.innerHTML = `<p>Acceleration along the X-axis</p>
        <p>${data.x}</p>
    <p>Acceleration along the Y-axis </p>
    <p>${data.y}</p>
    <p>Acceleration along the Z-axis </p>
    <p>${data.z}</p>
    <p>Data is obtained every ${data.interval} ms</p>
    <p>Frequency : ${1000 / data.interval} samples / s</p>`;
}

function attachMotionDetectionListener(accelerationChart, displacementChart) {
  window.addEventListener(
    'devicemotion',
    (motionDataEvent) => onMotionData(motionDataEvent, accelerationChart, displacementChart),
    { signal: controller.signal },
  );
}

function onMotionData(motionDataEvent, accelerationChart, displacementChart) {
  const newMotionData = {
    x: motionDataEvent.acceleration.x,
    y: motionDataEvent.acceleration.y,
    z: motionDataEvent.acceleration.z,
    zIncludingGravity: motionDataEvent.accelerationIncludingGravity.z,
    interval: motionDataEvent.interval,
    time: new Date().getTime(),
  };

  // renderPrintDataWrapper(newMotionData);

  updateChart(accelerationChart, newMotionData);

  // const currentExtendedMotionData = calculateAndSaveNewMotionDataRungeKuttaMethod(newMotionData);
  const currentExtendedMotionData = calculateAndSaveNewMotionDataTrapezoidalRule(newMotionData);

  // updateChart(accelerationChart, currentExtendedMotionData, 'xyz'); // to test with resultante acceleration

  updateChart(displacementChart, currentExtendedMotionData, 'displacement');
}

// eslint-disable-next-line no-unused-vars
function calculateAndSaveNewMotionDataRungeKuttaMethod(newMotionData) {
  acceleration = newMotionData.z;
  const timeStep = newMotionData.interval / 1000; // from ms to s

  // Check if the acceleration is above the threshold, else consider no change of velocity and displacement
  if (Math.abs(acceleration) <= accelerationThreshold) {
    const currentMotionData = { ...newMotionData, velocity, displacement };
    return currentMotionData;
  }

  // Run the Runge-Kutta method to calculate the change in displacement and velocity
  const k1v = acceleration * timeStep;
  const k1d = velocity * timeStep;

  const k2v = ((acceleration + lastAcceleration) / 2) * timeStep;
  const k2d = (velocity + k1v / 2) * timeStep;

  const k3v = ((acceleration + 2 * lastAcceleration) / 3) * timeStep;
  const k3d = (velocity + k2v / 2) * timeStep;

  const k4v = ((acceleration + 3 * lastAcceleration) / 4) * timeStep;
  const k4d = (velocity + k3v) * timeStep;

  const deltaDisplacement = (k1d + 2 * k2d + 2 * k3d + k4d) / 6;
  const deltaVelocity = (k1v + 2 * k2v + 2 * k3v + k4v) / 6;

  // Check if the displacement and velocity have changed direction and update their sign accordingly
  if (
    (lastDisplacement > 0 && displacement + deltaDisplacement < 0) ||
    (lastDisplacement < 0 && displacement + deltaDisplacement > 0)
  ) {
    displacementDirection *= -1;
  }

  // Update the velocity value using the trapezoidal rule
  velocity += deltaVelocity * displacementDirection;

  // Update the displacement value and show it in mm (instead of meters)
  displacement += deltaDisplacement * displacementDirection * 1000;

  lastDisplacement = displacement;

  const currentMotionData = { ...newMotionData, velocity, displacement, displacementDirection };

  addSample(currentMotionData);

  return currentMotionData;
}

// eslint-disable-next-line no-unused-vars
function calculateAndSaveNewMotionDataTrapezoidalRule(newMotionData) {
  acceleration = newMotionData.z;
  const timeStep = newMotionData.interval / 1000; // from ms to s

  // Check if the acceleration is above the threshold, else consider no change of velocity and displacement
  if (Math.abs(acceleration) <= accelerationThreshold) {
    const currentMotionData = { ...newMotionData, velocity, displacement };
    addSample(currentMotionData, MAX_SAMPLES);
    return currentMotionData;
  }

  // Calculate the change in velocity using the trapezoidal rule
  const deltaVelocity = ((acceleration + (acceleration - lastAcceleration)) / 2) * timeStep;

  // Update the velocity value
  velocity += deltaVelocity;

  // Calculate the change in displacement using the trapezoidal rule
  const deltaDisplacement = ((velocity + (velocity - lastVelocity)) / 2) * timeStep;

  // Update the displacement value and show it in mm (instead of meters)
  displacement += deltaDisplacement * displacementDirection * 1000;

  lastDisplacement = displacement;

  lastAcceleration = acceleration;

  lastVelocity = velocity;

  const currentMotionData = { ...newMotionData, velocity, displacement, displacementDirection };

  addSample(currentMotionData, MAX_SAMPLES);

  return currentMotionData;
}

/*
// eslint-disable-next-line no-unused-vars
function calculateAndSaveNewMotionDataTrapezoidalRule(newMotionData) {
  const currentMotionData = { ...newMotionData };
  const previousMotionData = getLastSample();

  acceleration = currentMotionData.z;
  const lastAcceleration2 = previousMotionData?.z ?? 0;
  const lastVelocity = previousMotionData?.velocity ?? 0;
  let velocity2 = lastVelocity;
  // eslint-disable-next-line no-shadow
  const lastDisplacement = previousMotionData?.displacement ?? 0;
  let displacement2 = lastDisplacement;
  const timeStep = currentMotionData.interval / 1000; // from ms to s

  // Calculate the change in velocity using the trapezoidal rule
  const deltaVelocity = ((acceleration + (acceleration - lastAcceleration2)) / 2) * timeStep;

  // Update the velocity value
  velocity2 += deltaVelocity;

  // Calculate the change in displacement using the trapezoidal rule
  const deltaDisplacement = ((velocity2 + (velocity2 - lastVelocity)) / 2) * timeStep;

  // Update the displacement value and provide it in mm (instead of meters)
  displacement2 += deltaDisplacement * 1000;

  currentMotionData.velocity = velocity2;
  currentMotionData.displacement = displacement2;

  addSample(currentMotionData, MAX_SAMPLES);

  return currentMotionData;
}
*/

/* 
// eslint-disable-next-line no-unused-vars
function calculateAndSaveNewMotionDataRungeKuttaMethodResultantAcceleration(newMotionData) {
  acceleration = Math.sign(newMotionData.z) * Math.sqrt(
    newMotionData.x ** 2 +
    newMotionData.y ** 2 +
    newMotionData.z ** 2
  );

  // Check if the acceleration is above the threshold, else consider no change of velocity and displacement
  if (Math.abs(acceleration) <= accelerationThreshold) {
    const currentMotionData = { ...newMotionData, xyz: acceleration, velocity, displacement};
    return currentMotionData;
  }

  const timeStep = newMotionData.interval / 1000; // from ms to s

  
  // Run the Runge-Kutta method to calculate the change in displacement
  k1 = velocity * timeStep;
  k2 = (velocity + k1 / 2) * timeStep; // 
  k3 = (velocity + k2 / 2) * timeStep;
  k4 = (velocity + k3) * timeStep;
  const deltaDisplacement = ((k1 + 2 * k2 + 2 * k3 + k4) / 6) ; // * Math.sign(acceleration);

  // Update the velocity value using the trapezoidal rule
  const deltaVelocity = acceleration * timeStep; // if we were to use the zWithGravitation : ((acceleration + (acceleration - lastAcceleration)) / 2) * timeStep;
  velocity += deltaVelocity;

  // Update the displacement value and show it in mm (instead of meters)
  displacement += deltaDisplacement * 1000; 

   const currentMotionData = { ...newMotionData, velocity, displacement };

  return currentMotionData;
} */

export default HomePage;
