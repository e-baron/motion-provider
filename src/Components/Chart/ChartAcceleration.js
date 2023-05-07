/* eslint-disable no-param-reassign */
import Chart from 'chart.js/auto';
import * as Utils from '../../utils/chart-utils';

const MAX_SAMPLES = 1000;

/**
 * Start a chart diagram with no data. Call the updateChart function to add data
 * @param {String} wrapperSelector 
 * @returns 
 */
const ChartAcceleration = (wrapperSelector) => {
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
    type: 'line', // 'scatter', // 'line',
    data: currentData,
    options: {
      responsive: false, // true,
      height: 500,
      /* parsing: {
        xAxisKey: 'time',
        yAxisKey: 'z',
      }, */
      scales: {
       /* y: {
          min: -1,
          max: 1,
          ticks: {
            stepSize: 0.1,
          },
        }, */
        x: {
          type: 'linear',
          min: 0,
          max: MAX_SAMPLES -1,
          title: {
            display: true,
            text: 'Samples',
          },
          display: true,
        },
      },
      // indexAxis: 'x',
      /* interaction: {
        intersect: false,
      }, */ 
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

  const chart = new Chart(chartWrapper, config);

  return chart;
};

function addData(chart, data) {
  const dataset = chart.data.datasets[0];
  const reformatedDataForXandYaxises = { x: dataset.data.length, y: data.z };

  if (dataset.data.length === MAX_SAMPLES) {
    dataset.data.shift();
    dataset.data.push(reformatedDataForXandYaxises);
    dataset.data = dataset.data.map((element, index) => ({ x: index, y: element.y }));
    chart.data.labels = dataset.data.map((_, index) => index);
  } else {
    dataset.data.push(reformatedDataForXandYaxises);
    chart.data.labels.push(dataset.data.length - 1);
  }
  chart.update();
}

function updateChart(chart, newData) {
  addData(chart, newData);
}

export { ChartAcceleration, updateChart };
