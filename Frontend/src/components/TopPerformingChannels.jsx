import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopPerformingChannels = ({ info }) => {
    console.log(info);
    
  
  if (!info || info.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Top Performing Channels</h2>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No channel data available. Please select filters.</p>
        </div>
      </div>
    );
  }

  try {
    // Extract channel names and order counts
    const labels = info.map(item => item.channel || 'Unknown');
    const orderCounts = info.map(item => Number(item.total_orders) || 0);

    // Creative color palette
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
      '#F7DC6F', // Yellow
      '#BB8FCE', // Purple
      '#85C1E2', // Light Blue
      '#F8B88B', // Peach
      '#A9DFBF'  // Light Green
    ];

    const chartColors = colors.slice(0, info.length);

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Orders Count',
          data: orderCounts,
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color + 'DD'),
          borderWidth: 2,
          hoverBorderWidth: 4,
          hoverOffset: 8
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `Orders: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    };

    return (
      <div className="w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Top Performing Channels</h2>
        <p className="text-sm text-gray-500 mb-6">Order distribution across channels</p>
        <div className="flex justify-center" style={{ height: '350px' }}>
          <Pie data={chartData} options={chartOptions} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {info.map((channel, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded border-l-4" style={{ borderColor: chartColors[index] }}>
              <p className="text-sm font-semibold text-gray-800">{channel.channel || 'Unknown'}</p>
              <p className="text-lg font-bold" style={{ color: chartColors[index] }}>
                {channel.total_orders || 0} orders
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering top performing channels:", error);
    return (
      <div className="w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Top Performing Channels</h2>
        <div className="flex items-center justify-center h-80">
          <p className="text-red-500">Error loading channel data.</p>
        </div>
      </div>
    );
  }
};

export default TopPerformingChannels;
