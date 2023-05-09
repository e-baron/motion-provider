/* eslint-disable no-param-reassign */
import Chart from 'chart.js/auto';
import * as Utils from '../../utils/chart-utils';

/**
 * Start an acceleration chart diagram (Z axis) with no data. Call the updateChart function to add data
 * @param {String} wrapperSelector
 * @returns
 */
const AccelerationChart = (wrapperSelector, maxSamples = 1000) => {
  const chartWrapper = document.querySelector(wrapperSelector);

  const currentData = {
    datasets: [
      {
        label: 'Z axis acceleration',
        data: [],
        borderColor: Utils.CHART_COLORS.red,
        // backgroundColor: Utils.transparentize(Utils.CHART_COLORS.red),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
      },
    ],
  };

  const config = {
    type: 'scatter', // 'scatter', // 'line',
    data: currentData,
    options: {
      responsive: false, // true,
      height: 500,
      scales: {
        y: {
          min: -1,
          max: 1,
          ticks: {
            stepSize: 0.1,
          },
        },
        x: {
          type: 'linear',
          min: 0,
          max: maxSamples - 1,
          title: {
            display: true,
            text: 'Samples',
          },
          display: true,
        },
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Z axis acceleration',
        },
      },
    },
  };

  return new Chart(chartWrapper, config);
};

/**
 * Start a displacement chart (Z axis) diagram with no data. Call the updateChart function to add data
 * @param {String} wrapperSelector
 * @returns
 */
const DisplacementChart = (wrapperSelector, maxSamples = 1000) => {
  const chartWrapper = document.querySelector(wrapperSelector);

  const currentData = {
    datasets: [
      {
        label: 'Z axis displacement',
        data: [],
        borderColor: Utils.CHART_COLORS.blue,
        // backgroundColor: Utils.transparentize(Utils.CHART_COLORS.red),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
      },
    ],
  };

  const config = {
    type: 'scatter', // 'scatter', // 'line',
    data: currentData,
    options: {
      responsive: false, // true,
      height: 500,
      scales: {
        y: {
          min: -300,
          max: 300,
        },
        x: {
          type: 'linear',
          min: 0,
          max: maxSamples - 1,
          title: {
            display: true,
            text: 'Samples',
          },
          display: true,
        },
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Z axis displacement',
        },
      },
    },
  };

  return new Chart(chartWrapper, config);
};

/**
 * Rerender the given chart with the new data. This creates a streaming chart.
 * Note that if an array of data is provided, the chart is completely redrawn !
 * @param {Chart} chart
 * @param {Object} newData
 * @param {String} yKey : this is the name of the property given in newData for the Y Axis
 */
function updateChart(chart, newData, options = { yKey: 'z', maxSamples: 1000 }) {
  const dataset = chart.data.datasets[0];

  if (Array.isArray(newData)) {
    dataset.data = newData.map((element, index) => ({ x: index, y: element[options.yKey] }));
    chart.data.labels = newData.map((_, index) => index);
    chart.options.scales.x.max = newData.length - 1;
    chart.update('none');
    return;
  }

  chart.options.scales.x.max = options.maxSamples;
  const reformatedDataForXandYaxises = { x: dataset.data.length, y: newData[options.yKey] };

  if (dataset.data.length === options.maxSamples) {
    dataset.data.shift();
    dataset.data.push(reformatedDataForXandYaxises);
    // update the x data for all elements
    dataset.data = dataset.data.map((element, index) => ({ x: index, y: element.y}));
    // strangely having x updated is not enough, labels have to be also updated
    chart.data.labels = dataset.data.map((_, index) => index);
  } else {
    dataset.data.push(reformatedDataForXandYaxises);
    // strangely adding x is not sufficient, corresponding labels have to be added
    chart.data.labels.push(dataset.data.length - 1);
  }
  chart.update('none');
}

function clearChart(chart) {
  const dataset = chart.data.datasets[0];
  dataset.data = [];
  chart.data.labels = [];
  chart.update('none');
}

export { AccelerationChart, DisplacementChart, updateChart, clearChart };
