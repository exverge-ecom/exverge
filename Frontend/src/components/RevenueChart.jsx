import React from 'react'

const RevenueChart = ({ info }) => {
  console.log("Revenue info:", info);

  if (!info || info.length === 0) {
    return (
      <div className="w-22 h-14 bg-white p-4 rounded shadow flex items-center justify-center">
        <p className="text-gray-500">No revenue data.</p>
      </div>
    );
  }

  return (
    <div className='w-18 h-16 bg-blue-700 text-white font-bold p-3 rounded shadow grid items-center justify-center'>
        <div className=' '>Net Revenue</div>
      { info[0].net_revenue }
    </div>
  );
}

export default RevenueChart
