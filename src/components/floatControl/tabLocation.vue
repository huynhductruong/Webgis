<template>
  <div id="chart-wrapper">

  </div>
</template>

<script>
import { defineComponent, onMounted, watch, ref } from 'vue';
import Chart from 'chart.js/auto';
import $ from 'jquery';
export default defineComponent({
  name: 'ChartComponent',
  props: {
    chartData: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const chartInstances = ref([]);
    const createCharts = () => {
      $('#chart-wrapper').empty()
      props.chartData.forEach((data_chart, index) => {
        const canvasId = 'myCanvas' + index;
        const canvasContainer = document.createElement('div');
        canvasContainer.classList.add('chart-container');
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvasContainer.appendChild(canvas);
        document.getElementById('chart-wrapper').appendChild(canvasContainer);

        const data = {
          labels: Object.keys(data_chart),
          datasets: [
            {
              label: index.toString(),
              data: Object.values(data_chart),
              backgroundColor: [
                'rgba(160,255,255)',
                'rgba(250, 170, 160)',
                'rgba(255,180,255)',
                '#036b05',
                '#27c50b',
                'rgba(75, 192, 192, 0.2)',

              ],
              borderColor: data_chart.borderColor || '#000',
              borderWidth: data_chart.borderWidth || 1,
            }
          ]
        };

        const config = {
          type: data_chart.type || 'doughnut',
          data: data,
          options: data_chart.options || {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Chart.js Doughnut Chart'
              }
            }
          },
        };
        const chartInstance = new Chart(canvas, config);
        chartInstances.value.push(chartInstance);
      });
    };


    onMounted(createCharts);

    watch(() => props.chartData, (newValue) => {

      chartInstances.value.forEach(chartInstance => {
        chartInstance.destroy();
      });
      chartInstances.value = [];
      createCharts();
    });

    return {
      chartInstances
    };
  }
});
</script>
<style lang="scss" scoped>
#chart-wrapper {
  display: flex;
  max-width: 303px; 
  overflow-x: auto; 
  margin-bottom: 5%;
}
</style>
