/* eslint-disable import/no-extraneous-dependencies */
import NoSleep from 'nosleep.js';
import * as Utils from '../../utils/chart-utils';
// import { io } from 'socket.io-client';
import { MotionChart, clearChart, updateChart } from '../Chart/MotionChart';
// eslint-disable-next-line no-unused-vars
import {
  addSample,
  addSampleAndFiltering,
  clearSamples,
  downloadSamplesAsJsonFile,
  // eslint-disable-next-line no-unused-vars
  getLastSample,
  resetSamples,
  setKalmanFilter,
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

let controller;

// eslint-disable-next-line no-unused-vars
const TIME_TO_WAIT_PRIOR_TO_SAMPLING = 1000; // in ms;

const KALMAN_OPTIONS = { R: 0.01, Q: 0.5, A: 1.2 };

const HomePage = () => {
  renderPageLayout();

  noSleep.disable();

  renderInitDetectionMessage();

  const movementDetectionEnable = checkNavigatorPermissionAndRenderIssues();

  if (!movementDetectionEnable) return;

  const accelerationChartOptions = {
    label: 'Z axis acceleration',
    type: 'scatter',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.red,
    height: 500,
    width: 500,
    // yMin: -0.2,
    // yMax: 0.2,
    yAxisKey: 'z',
    wrapperSelector: 'zChartWrapper',
  };

  const accelerationFilteredChartOptions = {
    label: 'Z axis filtered acceleration',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.green,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'zFiltered',
    wrapperSelector: 'zFilteredChartWrapper',
  };

  const displacementChartOptions = {
    label: 'Z axis displacement',
    type: 'scatter',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'displacement',
    wrapperSelector: 'displacemntChartWrapper',
  };

  const alphaRotationRateChartOptions = {
    label: 'alpha rotation rate : rotation of Z axis around X',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'rotationRateAlpha',
    wrapperSelector: 'rotationRateAlphaChartWrapper',
    stepSize: 0.5,
  };

  const alphaRotationRateFilteredChartOptions = {
    label: 'alpha rotation rate filtered : rotation of Z axis around X)',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'rotationRateAlphaFiltered',
    wrapperSelector: 'rotationRateAlphaFilteredChartWrapper',
  };

  const betaRotationRateChartOptions = {
    label: 'beta rotation rate : rotation of X axis around Y',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'rotationRateBeta',
    wrapperSelector: 'rotationRateBetaChartWrapper',
  };

  const gammaRotationRateChartOptions = {
    label: 'gamma rotation rate : rotation of Y axis around Z',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'rotationRateGamma',
    wrapperSelector: 'rotationRateGammaChartWrapper',
  };

  const inOutChartOptions = {
    label: 'In or out (and potentially in or out)',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'inOut',
    wrapperSelector: 'inOutChartWrapper',
  };

  const inOutSummaryChartOptions = {
    label: 'In or out only',
    type: 'line',
    xMax: 1000,
    xTitle: 'Samples',
    lineColor: Utils.CHART_COLORS.blue,
    height: 500,
    width: 500,
    yMin: undefined,
    yMax: undefined,
    yAxisKey: 'lastConfirmedMovement',
    wrapperSelector: 'inOutSummaryChartWrapper',
  };

  const chartsOptions = [
    inOutChartOptions,
    inOutSummaryChartOptions,
    alphaRotationRateChartOptions,
    alphaRotationRateFilteredChartOptions,
    accelerationChartOptions,
    accelerationFilteredChartOptions,
    displacementChartOptions,
    gammaRotationRateChartOptions,
    betaRotationRateChartOptions,
  ];

  renderChartWrappers(chartsOptions);

  const inOutChart = MotionChart(inOutChartOptions);

  const inOutSummaryChart = MotionChart(inOutSummaryChartOptions);

  const accelerationChart = MotionChart(accelerationChartOptions);

  const accelerationFilteredChart = MotionChart(accelerationFilteredChartOptions);

  const displacementChart = MotionChart(displacementChartOptions);

  const betaRotationRateChart = MotionChart(betaRotationRateChartOptions);

  const gammaRotationRateChart = MotionChart(gammaRotationRateChartOptions);

  const alphaRotationRateFilteredChart = MotionChart(alphaRotationRateFilteredChartOptions);

  const alphaRotationRateChart = MotionChart(alphaRotationRateChartOptions);

  const charts = [
    inOutChart,
    inOutSummaryChart,
    accelerationChart,
    accelerationFilteredChart,
    displacementChart,
    betaRotationRateChart,
    gammaRotationRateChart,
    alphaRotationRateFilteredChart,
    alphaRotationRateChart,
  ];

  setKalmanFilter(KALMAN_OPTIONS);

  attachOnStopStartListeneners(charts);

  attachOnFileSelected(charts);

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
  const pageLayout = `<h3>Phone movement detection on the Z axis</h3>
  
    <button id="startStopBtnDetection" class="btn btn-primary">Start detection</button>
  
  
    <button id="startStopBtnRealTimeChart" class="btn btn-primary mx-3">Start real time charts</button>
  
  <div class="mb-3">
    <label class="form-label">Provide a Json file</label>
    <input class="form-control" type="file" id="filePicker">
  </div>
  <div id="printDataWrapper" class="alert alert-secondary mt-2 d-none"></div>  
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

function renderChartWrappers(chartsOptions) {
  const main = document.querySelector('main');
  let chartWrappers = '';
  chartsOptions.forEach((chartOptions) => {
    chartWrappers += `<div  id="${chartOptions.wrapperSelector}" class="mt-2"></div>`;
  });

  main.innerHTML += chartWrappers;
}

function attachOnFileSelected(charts) {
  const filePicker = document.querySelector('#filePicker');

  filePicker.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const jsonString = event.target.result;
      const mySamples = JSON.parse(jsonString);
      resetSamples(mySamples);

      charts.forEach((chart) => updateChart(chart, mySamples));
    });

    reader.readAsText(file); // this will resolve to change event
  });
}

function attachOnStopStartListeneners(charts) {
  const startStopBtnDetection = document.querySelector('#startStopBtnDetection');
  startStopBtnDetection.addEventListener('click', () => {
    if (startStopBtnDetection.textContent === 'Start detection') {
      controller = new AbortController();
      startDataSampling();
    } else stopMotionDetection();
  });

  const startStopBtnRealTimeChart = document.querySelector('#startStopBtnRealTimeChart');
  startStopBtnRealTimeChart.addEventListener('click', () => {
    if (startStopBtnRealTimeChart.textContent === 'Start real time charts') {
      controller = new AbortController();
      startMotionDetectionAndDataRendering(charts);
    } else stopMotionDetectionAndCharts(charts);
  });
}

async function startMotionDetectionAndDataRendering(charts) {
  noSleep.enable();
  const startStopBtnRealTimeChart = document.querySelector('#startStopBtnRealTimeChart');
  startStopBtnRealTimeChart.textContent = 'Stop real time charts';
  attachMotionDetectionListener(charts);

  /* const messageTransmittedToServer = 'Hi Websocket Server';
  socket.emit('mobile connected', messageTransmittedToServer); */
}

async function startDataSampling() {
  noSleep.enable();
  const startStopBtnDetection = document.querySelector('#startStopBtnDetection');
  startStopBtnDetection.textContent = 'Stop detection';
  attachMotionDetectionListener();

  /* const messageTransmittedToServer = 'Hi Websocket Server';
  socket.emit('mobile connected', messageTransmittedToServer); */
}

function stopMotionDetectionAndCharts(charts) {
  noSleep.disable();
  const startStopBtnRealTimeChart = document.querySelector('#startStopBtnRealTimeChart');
  startStopBtnRealTimeChart.textContent = 'Start real time charts';
  controller.abort(); // this will remove the devicemotion event listener
  charts.forEach((chart) => clearChart(chart));
  downloadSamplesAsJsonFile();
  clearSamples();
}

function stopMotionDetection() {
  noSleep.disable();
  const startStopBtnDetection = document.querySelector('#startStopBtnDetection');
  startStopBtnDetection.textContent = 'Start detection';
  controller.abort(); // this will remove the devicemotion event listener
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

function attachMotionDetectionListener(charts) {
  window.addEventListener(
    'devicemotion',
    (motionDataEvent) => onMotionData(motionDataEvent, charts),
    { signal: controller.signal },
  );
}

async function onMotionData(motionDataEvent, charts) {
  /*
  if (firstSamplesToBeFiltered < TIME_TO_WAIT_PRIOR_TO_SAMPLING / motionDataEvent.interval) {
    firstSamplesToBeFiltered += 1;
    return undefined;
  } */

  const newMotionData = {
    x: motionDataEvent.acceleration.x,
    y: motionDataEvent.acceleration.y,
    z: motionDataEvent.acceleration.z,
    zIncludingGravity: motionDataEvent.accelerationIncludingGravity.z,
    interval: motionDataEvent.interval,
    rotationRateAlpha: motionDataEvent.rotationRate.alpha,
    rotationRateBeta: motionDataEvent.rotationRate.beta,
    rotationRateGamma: motionDataEvent.rotationRate.gamma,
    time: new Date().getTime(),
  };

  // renderPrintDataWrapper(newMotionData);

  // const currentExtendedMotionData = calculateAndSaveNewMotionDataRungeKuttaMethod(newMotionData);

  if (!charts) {
    await calculateAndSaveNewMotionDataTrapezoidalRule(newMotionData, Infinity);
    return;
  }

  const currentExtendedMotionData = await calculateAndSaveNewMotionDataTrapezoidalRule(
    newMotionData,
  );

  charts.forEach((chart) => updateChart(chart, currentExtendedMotionData));
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
async function calculateAndSaveNewMotionDataTrapezoidalRule(
  newMotionData,
  maxSamples = MAX_SAMPLES,
) {
  acceleration = newMotionData.z;
  const timeStep = newMotionData.interval / 1000; // from ms to s

  // Check if the acceleration is above the threshold, else consider no change of velocity and displacement
  /* if (Math.abs(acceleration) <= accelerationThreshold) {
    const currentMotionData = { ...newMotionData, velocity, displacement };
    const extendedMotionDataWithFiltering =  addSampleAndFiltering(currentMotionData, { maxSamples: 1000, keyToFilter: 'z' });
    return extendedMotionDataWithFiltering;
  } */

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

  const extendedMotionDataWithFiltering = await addSampleAndFiltering(currentMotionData, {
    maxSamples,
    keyToFilters: ['z', 'rotationRateAlpha'],
    kalmanFilter: KALMAN_OPTIONS,
    keyToDetermineInOut: 'rotationRateAlpha',
  });

  return extendedMotionDataWithFiltering;
}

export default HomePage;
