import React from 'react'

const AverageOrderValue = ({netRevenue, trendData}) => {

    if(!netRevenue || !trendData || netRevenue.length === 0 || trendData.length === 0){
        return (
      <div className="w-full h-24 bg-white p-4 rounded shadow flex items-center justify-center">
        <p className="text-gray-500">No data available.</p>
      </div>
    );
    }
    
    try {
      const revenue = Number(netRevenue[0].net_revenue);
      
      let totalOrders = 0;
      for (const item of trendData) {
        totalOrders += Number(item.total_orders);
      }
      
      if (totalOrders === 0) {
        return (
          <div className="w-full h-24 bg-white p-4 rounded shadow flex items-center justify-center">
            <p className="text-gray-500">No orders found.</p>
          </div>
        );
      }
      
      const averageOrderValue = (revenue / totalOrders).toFixed(2);
      
      return (
        <div className="w-full bg-white p-6 rounded shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Average Order Value</h3>
          <p className="text-2xl font-bold text-green-600">₹{averageOrderValue}</p>
          <p className="text-xs text-gray-400 mt-2">Total Orders: {totalOrders}</p>
        </div>
      );
    } catch (error) {
      console.error("Error calculating average order value:", error);
      return (
        <div className="w-full h-24 bg-white p-4 rounded shadow flex items-center justify-center">
          <p className="text-red-500">Error loading data.</p>
        </div>
      );
    }
}

export default AverageOrderValue
