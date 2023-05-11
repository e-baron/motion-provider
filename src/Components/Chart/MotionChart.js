/* eslint-disable no-param-reassign */
import Chart from 'chart.js/auto';
import * as Utils from '../../utils/chart-utils';

/**
 * Start a motion chart diagram with no data and configure with options.
 * Call the rerenderChart function to add data
 * @param {String} wrapperSelector
 * @param {Object} options
 * @returns the configured chart.js chart
 */

const MotionChart = (wrapperSelector, options) => {
  const givenOptions = {};
  givenOptions.label = options?.label ?? 'Z axis acceleration';
  givenOptions.type = options?.type ?? 'scatter';
  givenOptions.xMin = options?.xMin ?? 0;
  givenOptions.xMax = options?.xMax ?? undefined;
  givenOptions.xTitle = options?.xTitle ?? 'Samples';
  givenOptions.lineColor = options?.lineColor ?? Utils.CHART_COLORS.red;
  givenOptions.height = options?.height ?? undefined ; // 500;
  givenOptions.width = options?.width ?? undefined ; // 500;
  givenOptions.yMin = options?.yMin ?? undefined;
  givenOptions.yMax = options?.yMax ?? undefined;
  givenOptions.yAxisKey = options?.yAxisKey ?? undefined;
  givenOptions.responsive = options?.responsive ?? true;
  givenOptions.maintainAspectRatio = options?.maintainAspectRatio ?? false;


  MotionChartLayout(wrapperSelector, givenOptions);

  const chartWrapper = document.querySelector(`${wrapperSelector}Main`);

  const currentData = {
    datasets: [
      {
        label: givenOptions.label,
        data: [],
        borderColor: givenOptions.lineColor,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
      },
    ],
  };

  const config = {
    type: givenOptions.type, // 'scatter', // 'line',
    data: currentData,
    options: {
      yAxisKey: givenOptions.yAxisKey,
      responsive: givenOptions.responsive, // true,
      // height: givenOptions.height,
      // width: givenOptions.width,
      maintainAspectRatio : false,
      scales: {
        y: {
          min: givenOptions.yMin,
          max: givenOptions.yMax,
          /* ticks: {
            stepSize: 0.1,
          }, */
        },
        x: {
          type: 'linear',
          min: givenOptions.xMin,
          max: givenOptions.xMax,
          title: {
            display: true,
            text: givenOptions.xTitle,
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
          text: givenOptions.label,
        },
      },
    },
  };

  const chart = new Chart(chartWrapper, config);

  MotionChartHeader(wrapperSelector, chart, givenOptions);

  return chart;
};

// eslint-disable-next-line no-unused-vars
function MotionChartLayout(wrapperSelector, options) {
  const chartWrapper = document.querySelector(wrapperSelector);
  chartWrapper.innerHTML = `<div id="${wrapperSelector.substring(1)}Header"></div>
  <div id="${wrapperSelector.substring(1)}MainDiv" style="position:relative;height:${options.height}px; width:${options.width}px">
    <canvas id="${wrapperSelector.substring(
      1,
    )}Main"></canvas>
  </div>
  `;

  /* chartWrapper.innerHTML = `<div id="${wrapperSelector.substring(1)}Header"></div>
  <canvas id="${wrapperSelector.substring(1)}Main"></canvas>
  `; */
}

function MotionChartHeader(wrapperSelector, chart, options) {
  const chartHeaderWrapper = document.querySelector(`${wrapperSelector}Header`);
  const chartType = options?.type ?? 'scatter';
  const selectTypeId = `${wrapperSelector.substring(1)}chartTypeSelect`;
  const xMinId = `${wrapperSelector.substring(1)}xMin`;
  const xMaxId = `${wrapperSelector.substring(1)}xMax`;
  const widthId = `${wrapperSelector.substring(1)}width`;
  const heightId = `${wrapperSelector.substring(1)}height`;
  chartHeaderWrapper.innerHTML = `<select id="${selectTypeId}" class="form-select" aria-label="line type">
  <option ${chartType === 'scatter' ? 'selected' : ''}>scatter</option>
  <option ${chartType === 'line' ? 'selected' : ''}>line</option> 
</select>
<div class="mt-3">
  <input id="${xMinId}" class="form-control" type="number" placeholder="x min" aria-label="x min">
</div>
<div class="mt-3">
  <input id="${xMaxId}" class="form-control" type="number" placeholder="x max" aria-label="x max">
</div>
<div class="mt-3">
  <input id="${widthId}" class="form-control" type="number" placeholder="width" aria-label="width">
</div>
<div class="mt-3">
  <input id="${heightId}" class="form-control" type="number" placeholder="height" aria-label="height">
</div>

`;

  const chartTypeSelect = document.querySelector(`#${selectTypeId}`);
  const xMinInput = document.querySelector(`#${xMinId}`);
  const xMaxInput = document.querySelector(`#${xMaxId}`);
  const widthInput = document.querySelector(`#${widthId}`);
  const heightInput = document.querySelector(`#${heightId}`);

  chartTypeSelect.addEventListener('change', (e) => {
    chart.config.type = e.target.options[e.target.selectedIndex].value;
    chart.update('none');
  });

  xMinInput.addEventListener('blur', (e) => {
    const newValue = e.target.value;
    if (!newValue) return;
    chart.options.scales.x.min = Number(newValue);
    chart.update('none');
  });

  xMaxInput.addEventListener('blur', (e) => {
    const newValue = e.target.value;
    if (!newValue) return;
    chart.options.scales.x.max = Number(newValue);
    chart.update('none');
  });

  widthInput.addEventListener('blur', (e) => {
    const newValue = e.target.value;
    if (!newValue) return;
    chart.options.width = Number(newValue);    
    const chartWrapperDiv = document.querySelector(`${wrapperSelector}MainDiv`);
    chartWrapperDiv.style.width = `${chart.options.width}px`;
    chart.resize();
  });

  heightInput.addEventListener('blur', (e) => {
    const newValue = e.target.value;
    if (!newValue) return;
    chart.options.height = Number(newValue);
    const chartWrapperDiv = document.querySelector(`${wrapperSelector}MainDiv`);
    chartWrapperDiv.style.height = `${chart.options.height}px`;
    
  });
}

/**
 * Rerender the given chart with the new data. This creates a streaming chart.
 * Note that if an array of data is provided, the chart is completely redrawn !
 * @param {Chart} chart
 * @param {Object} newData
 */
function updateChart(chart, newData) {
  const dataset = chart.data.datasets[0];
  const { yAxisKey } = chart.options;

  if (Array.isArray(newData)) {
    dataset.data = newData.map((element, index) => ({ x: index, y: element[yAxisKey] }));
    chart.data.labels = newData.map((_, index) => index);
    chart.options.scales.x.max = newData.length - 1;
    chart.update('none');
    return;
  }

  // chart.options.scales.x.max = options.maxSamples;
  const reformatedDataForXandYaxises = { x: dataset.data.length, y: newData[yAxisKey] };

  if (dataset.data.length === chart.options.scales.x.max) {
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
  chart.update('none');
}

function clearChart(chart) {
  const dataset = chart.data.datasets[0];
  dataset.data = [];
  chart.data.labels = [];
  chart.update('none');
}

function updateChartOptions(chart, updatedChartOptions) {
  const dataset = chart.data.datasets[0];

  if ('label' in updatedChartOptions) dataset.label = updateChartOptions.label;

  if ('lineColor' in updatedChartOptions) dataset.borderColer = updatedChartOptions.lineColor;

  if ('type' in updatedChartOptions) chart.type = updatedChartOptions.type;

  if ('xTitle' in updatedChartOptions)
    chart.options.plugins.title.text = updatedChartOptions.xTitle;

  if ('xMax' in updatedChartOptions) chart.options.scales.x.max = updatedChartOptions.xMax;

  if ('height' in updatedChartOptions) chart.options.height = updatedChartOptions.height;

  if ('yMin' in updatedChartOptions) chart.options.scales.y.min = updatedChartOptions.yMin;

  if ('yMax' in updatedChartOptions) chart.options.scales.y.max = updatedChartOptions.xMax;

  if ('yAxisKey' in updatedChartOptions) chart.options.yAxisKey = updatedChartOptions.yAxisKey;

  chart.update('none');
}

export { updateChart, clearChart, MotionChart, updateChartOptions };
