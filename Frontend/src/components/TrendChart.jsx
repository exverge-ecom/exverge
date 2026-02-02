import React from 'react';
// import { Line } from 'react-chartjs-2';
// import React from "react";
// import { Bar } from "react-chartjs-2";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";


ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function TrendChart(props) {

  const {info} = props;
   
  console.log(info);

  if (!info || info.length === 0) {
    return (
      <div className="w-[500px] h-96 bg-white p-4 rounded shadow flex items-center justify-center">
        <p className="text-gray-500">No data available. Please select filters.</p>
      </div>
    );
  }

  const dateLabel = info.map((x)=>{
    const d = new Date(x.date);
    const formattedDate = d.toISOString().split('T')[0];
    return formattedDate;
  });

  const totalOrders = info.map((x)=>{
   return parseInt(x.total_orders) || 0;
  })

  const data = {
    labels: dateLabel,
    datasets: [
      {
        label: "Total Orders",
        data: totalOrders,
        backgroundColor: "#0055b0",
      },
    ],
 
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="w-[800px] h-96 bg-white p-4 rounded shadow">
      <Line data={data} options={options} />
    </div>
  );
}


