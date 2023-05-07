/* eslint-disable import/no-extraneous-dependencies */
import NoSleep from 'nosleep.js';
// import { io } from 'socket.io-client';
import { AccelerationChart, DisplacementChart, updateChart } from '../Chart/MotionChart';
import { addSample, getLastSample } from '../../utils/samples';

const noSleep = new NoSleep();
const MAX_SAMPLES = 1000;

const HomePage = () => {
  renderPageLayout();

  noSleep.disable();

  renderInitDetectionMessage();

  const movementDetectionEnable = checkNavigatorPermissionAndRenderIssues();

  if (!movementDetectionEnable) return;

  const accelerationChart = AccelerationChart('#accelerationChartWrapper', MAX_SAMPLES);
  const displacementChart = DisplacementChart('#displacementChartWrapper', MAX_SAMPLES);

  attachOnStartListenener(accelerationChart, displacementChart);

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
    <button id="startBtn" class="btn btn-primary">Start detection</button>
  </div>
  <div id="printDataWrapper" class="alert alert-secondary mt-2 d-none"></div>
  <div class="mt-2">
    <canvas id="accelerationChartWrapper" height="500" width="500"></canvas>
  </div>
  <div class="mt-2">
  <canvas id="displacementChartWrapper" height="500" width="500"></canvas>
</div>`
  ;
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

function attachOnStartListenener(accelerationChart, displacementChart) {
  const startBtn = document.querySelector('#startBtn');
  startBtn.addEventListener('click', () => startMotionDetectionAndDataRendering(accelerationChart, displacementChart));
}

async function startMotionDetectionAndDataRendering(accelerationChart, displacementChart) {
  noSleep.enable();
  removeStartButton();

  attachMotionDetectionListener(accelerationChart, displacementChart);

  /* const messageTransmittedToServer = 'Hi Websocket Server';
  socket.emit('mobile connected', messageTransmittedToServer); */
}

function removeStartButton() {
  const startBtn = document.querySelector('#startBtn');
  startBtn.remove();
}

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
  window.addEventListener('devicemotion', (motionDataEvent) =>
    onMotionData(accelerationChart, displacementChart, motionDataEvent),
  );
}

function onMotionData(accelerationChart, displacementChart, motionDataEvent) {
  const newMotionData = {
    x: motionDataEvent.acceleration.x,
    y: motionDataEvent.acceleration.y,
    z: motionDataEvent.acceleration.z,
    interval: motionDataEvent.interval,
    time: new Date().getTime(),
  };

  renderPrintDataWrapper(newMotionData);

  updateChart(accelerationChart, newMotionData);

  const currentExtendedMotionData = calculateAndSaveNewMotionData(newMotionData);

  updateChart(displacementChart, currentExtendedMotionData, 'displacement');
}

function calculateAndSaveNewMotionData(newMotionData) {
  const currentMotionData = { ...newMotionData };
  const previousMotionData = getLastSample();

  const acceleration = currentMotionData.z;
  const lastAcceleration = previousMotionData?.z ?? 0;
  const lastVelocity = previousMotionData?.velocity ?? 0;
  let velocity = lastVelocity;
  const lastDisplacement = previousMotionData?.displacement ?? 0;
  let displacement = lastDisplacement;
  const timeStep = currentMotionData.interval / 1000; // from ms to s

  // Calculate the change in velocity using the trapezoidal rule
  const deltaVelocity = ((acceleration + (acceleration - lastAcceleration)) / 2) * timeStep;

  // Update the velocity value
  velocity += deltaVelocity;

  // Calculate the change in displacement using the trapezoidal rule
  const deltaDisplacement = ((velocity + (velocity - lastVelocity)) / 2) * timeStep;

  // Update the displacement value and provide it in mm (instead of meters)
  displacement += deltaDisplacement * 1000;

  currentMotionData.velocity = velocity;
  currentMotionData.displacement = displacement;

  addSample(currentMotionData, MAX_SAMPLES);

  return currentMotionData;
}

export default HomePage;
