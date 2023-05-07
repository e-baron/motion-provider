/* eslint-disable no-param-reassign */
import Chart from 'chart.js/auto';
import * as Utils from '../../utils/chart-utils';

/**
 * Start an acceleration chart diagram with no data. Call the updateChart function to add data
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
    type: 'line', // 'scatter', // 'line',
    data: currentData,
    options: {
      responsive: false, // true,
      height: 500,
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
 * Rerender the given chart with the new data. This creates a streaming chart.
 * @param {Chart} chart 
 * @param {Object} newData 
 */
function updateChart(chart, newData) {
  const dataset = chart.data.datasets[0];
  const reformatedDataForXandYaxises = { x: dataset.data.length, y: newData.z };

  if (dataset.data.length === chart.options.scales.x.max + 1) {
    dataset.data.shift();
    dataset.data.push(reformatedDataForXandYaxises);
    // update the x data for all elements
    dataset.data = dataset.data.map((element, index) => ({ x: index, y: element.y }));
    // strangely having x updated is not enough, labels have to be also updated
    chart.data.labels = dataset.data.map((_, index) => index);
  } else {
    dataset.data.push(reformatedDataForXandYaxises);
    // strangely adding x is not sufficient, corresponding labels have to be added
    chart.data.labels.push(dataset.data.length - 1);
  }
  chart.update();
}

export { AccelerationChart, updateChart };
