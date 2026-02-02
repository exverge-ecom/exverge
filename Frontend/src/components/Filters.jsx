import { useState, useEffect } from "react";
import { useFilters } from "../context/filterContext.jsx";
import {
  getOrderTrendAPI,
  getRevenueTrendAPI,
  getTopPerformingChannelsAPI,
  getTopSellingProductsAPI,
} from "../utils/api.js";

export default function DashboardFilters(props) {
  const { setTrendData, setRevenue, setTopSellingProduct, setTopPerformingChannel } = props;
  const { filterData, updateFilter } = useFilters();
  const [openChannel, setOpenChannel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calling api
  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        setLoading(true);

        const [orders, revenue, topSellingProduct, topPerformingChannel] = await Promise.all([
          loadTrends(),
          loadRevenueTrends(),
          loadTopSellingProducts(),
          loadTopPerformingChannel()
        ]);

        if (!active) return;

        setTrendData(orders);
        setRevenue(revenue);
        setTopSellingProduct(topSellingProduct);
        setTopPerformingChannel(topPerformingChannel)
      } catch (e) {
        console.error(e);
      } finally {
        active && setLoading(false);
      }
    };

    fetchAll();

    return () => {
      active = false;
    };
  }, [filterData, setTrendData, setRevenue, setTopSellingProduct, setTopPerformingChannel]);

  // Trend Calling

  const loadTrends = async () => {
    try {
      if (filterData.from == "" || filterData.to == "") {
        return [];
      }
      const response = await getOrderTrendAPI.getTrend(filterData);
      return response.data;
    } catch (error) {
      console.error("Error in loading get Trends", error);
      return [];
    }
  };

  // Revenue Trend Function
  const loadRevenueTrends = async () => {
    try {
      if (filterData.from == "" || filterData.to == "") {
        return [];
      }

      const response = await getRevenueTrendAPI.getRevenue(filterData);
      console.log("revenue", response.data);

      return response.data;
    } catch (error) {
      console.error("Error in loading Revenue", error);
      return [];
    }
  };

  // Top Selling Product Function

  const loadTopSellingProducts = async () => {
    try {
      if (filterData.from == "" || filterData.to == "") {
        return [];
      }

      const response = await getTopSellingProductsAPI.getTopSellingProducts(
        filterData
      );
      console.log("Top Selling Products", response.data);

      return response.data;
    } catch (error) {
      console.error("Error in loading Top Selling Products", error);
      return [];
    }
  };

  // Top Performing Channels

  const loadTopPerformingChannel = async ()=>{
    try {
      if (filterData.from == "" || filterData.to == "") {
        return [];
      }
         
      const response = await getTopPerformingChannelsAPI.getTopPerformingChannels(filterData);
      console.log("Top Performing Channels", response.data);

      return response.data;

    } catch (error) {
       console.error("Error in loading Top Performing Channels", error);
       return [];
    }
  }

  //Date-time formatting

  const formatDateTime = (date, isEnd = false) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    const time = isEnd ? "23:59:59" : "00:00:00";

    return `${year}-${month}-${day} ${time}`;
  };

  const handleDurationChange = (value) => {
    const today = new Date();
    let start = "",
      end = "";

    switch (value) {
      case "today":
        start = formatDateTime(today, false);
        end = formatDateTime(today, true);
        break;

      case "yesterday":
        const yest = new Date(today);
        yest.setDate(today.getDate() - 1);
        start = formatDateTime(yest, false);
        end = formatDateTime(yest, true);
        break;

      case "last7":
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 6);
        start = formatDateTime(last7, false);
        end = formatDateTime(today, true);
        break;

      case "1month":
        const oneMonth = new Date(today);
        oneMonth.setMonth(today.getMonth() - 1);
        start = formatDateTime(oneMonth, false);
        end = formatDateTime(today, true);
        break;

      case "3month":
        const threeMonth = new Date(today);
        threeMonth.setMonth(today.getMonth() - 3);
        start = formatDateTime(threeMonth, false);
        end = formatDateTime(today, true);
        break;

      default:
        start = "";
        end = "";
    }

    console.log(
      "DEBUG Filters:",
      "duration =",
      value,
      "from =",
      start,
      "to =",
      end
    );

    updateFilter("from", start);
    updateFilter("to", end);
  };

  const channelOptions = [
    "KH_GMTPL_FLIPKART",
    "KH_GMT_MEESHO",
    "KH_GMTPL_AMAZON",
  ];

  const warehouseOptions = ["GMT_KH"];

  const brand = ["Kraftlik Handicrafts", "exverge", "Indian Motley"];

  const status = ["Created"];

  const toggleChannel = (channel) => {
    updateFilter("channel", channel);
  };

  return (
    <div className="bg-white p-4 rounded shadow w-full">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Duration Preset Dropdown */}
        <div>
          <label className="text-sm font-medium">Duration</label>
          <select
            // value={timeFrame}
            // onClick={(e)=> setTimeFrame(e.target.value)}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full border rounded px-2 py-2"
          >
            <option value="">Custom</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="1month">Last 1 Month</option>
            <option value="3month">Last 3 Months</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="text-sm font-medium">From</label>
          <input
            type="date"
            value={filterData.from}
            onChange={(e) => updateFilter("from", formatDate(e.target.value))}
            className="w-full border rounded px-2 py-2"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="text-sm font-medium">To</label>
          <input
            type="date"
            value={filterData.to}
            onChange={(e) => updateFilter("to", formatDate(e.target.value))}
            className="w-full border rounded px-2 py-2"
          />
        </div>

        {/* Warehouse Dropdown */}
        <div>
          <label className="text-sm font-medium">Warehouse</label>
          <select
            value={filterData.warehouseIdentifier}
            onChange={(e) =>
              updateFilter("warehouseIdentifier", e.target.value)
            }
            className="w-full border rounded px-2 py-2"
          >
            <option value="">All Warehouses</option>
            {warehouseOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Brands */}
        <div>
          <label className="text-sm font-medium">Brands</label>
          <select
            value={filterData.brand}
            onChange={(e) => updateFilter("brand", e.target.value)}
            className="w-full border rounded px-2 py-2"
          >
            <option value="">All Brands</option>
            {brand.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Channel Multi-select Dropdown */}
        <div className="relative">
          <label className="text-sm font-medium">Channel</label>
          <button
            type="button"
            onClick={() => setOpenChannel(!openChannel)}
            className="w-full border rounded px-2 py-2 text-left bg-white"
          >
            {filterData.channel.length > 0
              ? `${filterData.channel.length} Selected`
              : "Select Channels"}
          </button>

          {openChannel && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
              {channelOptions.map((channel) => (
                <label
                  key={channel}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filterData.channel.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="mr-2"
                  />
                  {channel}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
