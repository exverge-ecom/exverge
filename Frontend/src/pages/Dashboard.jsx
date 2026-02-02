import React, { useEffect, useState } from "react";
import TrendChart from "../components/TrendChart.jsx";
import Filters from "../components/Filters.jsx";
// import { getOrderTrendAPI } from "../utils/api.js";
import { FilterProvider } from "../context/filterContext.jsx";
import RevenueChart from "../components/RevenueChart.jsx";
import AverageOrderValue from "../components/AverageOrderValue.jsx";
import TopSellingProducts from "../components/TopSellingProducts.jsx";
import TopPerformingChannels from "../components/TopPerformingChannels.jsx";
// import PrivateRoute from "../components/PrivateRoute.jsx";

const Dashboard = () => {
  const [trendData, setTrendData] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [topSellingProduct, setTopSellingProduct] = useState([]);
  const [topPerformingChannnel, setTopPerformingChannel] = useState([]);

  return (
    <div className=" w-screen h-screen">
      <FilterProvider>
        <div className="my-10">
          <Filters
            trendData={trendData}
            setTrendData={setTrendData}
            setRevenue={setRevenue}
            setTopSellingProduct={setTopSellingProduct}
            setTopPerformingChannel={setTopPerformingChannel}
          />
        </div>
        <div className="flex">
          <div className="w-1/4 mb-2">
            <RevenueChart info={revenue} />
          </div>
          <div className="ml-4">
            <AverageOrderValue netRevenue={revenue} trendData={trendData} />
          </div>
        </div>
        <div className="w-1/2 ">
          <TrendChart info={trendData} className="mt-10" />
        </div>
        <div>
          <TopSellingProducts info={topSellingProduct} />
        </div>
        <div>
          <TopPerformingChannels info={topPerformingChannnel} />
        </div>
      </FilterProvider>

      {/* {data.map((x, i) => (
        <div key={i}>{JSON.stringify(x)}</div>
      ))} */}
    </div>
  );
};

export default Dashboard;
