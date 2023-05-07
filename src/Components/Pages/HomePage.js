/* eslint-disable import/no-extraneous-dependencies */
import NoSleep from 'nosleep.js';
// import { io } from 'socket.io-client';
import { AccelerationChart, updateChart } from '../Chart/MotionChart';

const noSleep = new NoSleep();
const MAX_SAMPLES = 1000;

const HomePage = () => {
  renderPageLayout();

  noSleep.disable();

  renderInitDetectionMessage();

  const movementDetectionEnable = checkNavigatorPermissionAndRenderIssues();

  if (!movementDetectionEnable) return;

  const accelerationChart = AccelerationChart('#accelerationChartWrapper', MAX_SAMPLES);

  attachOnStartListenener(accelerationChart);

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
  </div>`;
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

function attachOnStartListenener(accelerationChart) {
  const startBtn = document.querySelector('#startBtn');
  startBtn.addEventListener('click', () => startMotionDetectionAndDataRendering(accelerationChart));
}

async function startMotionDetectionAndDataRendering(accelerationChart) {
  noSleep.enable();
  removeStartButton();

  attachMotionDetectionListener(accelerationChart);

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

function attachMotionDetectionListener(accelerationChart) {
  window.addEventListener('devicemotion', (motionDataEvent) =>
    onMotionData(accelerationChart, motionDataEvent),
  );
}

function onMotionData(accelerationChart, motionDataEvent) {
  const newData = {
    x: motionDataEvent.acceleration.x,
    y: motionDataEvent.acceleration.y,
    z: motionDataEvent.acceleration.z,
    interval: motionDataEvent.interval,
    time: new Date().getTime(),
  };

  renderPrintDataWrapper(newData);

  updateChart(accelerationChart, newData);
}

export default HomePage;
