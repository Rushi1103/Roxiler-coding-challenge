import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ chartData }) => {
  const data = {
    labels: Object.keys(chartData),
    datasets: [
      {
        label: '# of Items',
        data: Object.values(chartData),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Price Range Distribution',
      },
    },
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h2 className="card-title">Price Range Chart</h2>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default BarChart;
