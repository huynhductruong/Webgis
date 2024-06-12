<template>
  <div id="chart-wrapper">

  </div>
</template>

<script>
import { defineComponent, onMounted, watch, ref } from 'vue';
import Chart from 'chart.js/auto';
import $ from 'jquery';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);
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
      let chartDT = [{1:5,2:4, 3:4,4:5,5:6,6:7,title:"LienChieu"},{1:5,2:4, 3:4,4:5,5:6,6:7,title:"Hoa Khanh"}]
      chartDT.forEach((data_chart, index) => {
        const canvasId = 'myCanvas' + index;
        const canvasContainer = document.createElement('div');
        canvasContainer.classList.add('chart-container');
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvasContainer.appendChild(canvas);
        document.getElementById('chart-wrapper').appendChild(canvasContainer);
        const entries = Object.entries(data_chart);
        const slicedEntries = entries.slice(0, 6);
        const slicedObj = Object.fromEntries(slicedEntries);
        const data = {
          labels: ["Sông, nước", "Đất công nghiệp", "Đất ở", "Rừng thưa", "Rừng tươi tốt", "Rừng rậm"],
          datasets: [
            {
              label: index.toString(),
              data: Object.values(slicedObj),
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
                position: 'right',
                labels: {
                  boxWidth: 15, 
                  padding: 20,  
                },
              },
              title: {
                display: true,
                text: `Hiện trạng sử dụng đất: ${data_chart.title}`
              },
              datalabels: {
                formatter: (value, ctx) => {
                  let sum = 0;
                  let dataArr = ctx.chart.data.datasets[0].data;
                  dataArr.map(data => {
                    sum += data;
                  });
                  let percentage = (value * 100 / sum).toFixed(2) + "%";
                  return percentage;
                },
                color: '#000',
                font: {
                  weight: 'bold',
                  size: '8'
                }
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
  max-width: 300px;
  overflow-x: auto;
  margin-bottom: 5%;
  margin-left: 10px;
}
</style>
