import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function SalesChartToggle() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("monthly"); // "monthly" or "yearly"

  useEffect(() => {
    const endpoint =
      view === "monthly"
        ? "https://company-dashboard-lsr7.onrender.com/api/monthly_sales"
        : "https://company-dashboard-lsr7.onrender.com/api/yearly_sales";

    setLoading(true);
    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        setSalesData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sales data:", error);
        setLoading(false);
      });
  }, [view]);

  if (loading) {
    return <div className="text-center p-4">Loading chart...</div>;
  }

  const chartData = {
    labels:
      view === "monthly"
        ? salesData.map((item) => item.month) // "January 2024"
        : salesData.map(
            (item) =>
              item.year?.toString() || item.last_purchase_date?.toString()
          ),
    datasets: [
      {
        label:
          view === "monthly"
            ? "Total Quantity (Monthly)"
            : "Total Quantity (Yearly)",
        data: salesData.map((item) => item.total_quantity),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: view === "monthly" ? "Monthly Sales Trend" : "Yearly Sales Trend",
        font: { size: 18 },
      },
    },
  };

  return (
    <div className="w-full">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-4 w-full">
        {/* Toggle Buttons */}
        <div className="flex justify-end mb-4 space-x-2">
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              view === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setView("monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              view === "yearly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setView("yearly")}
          >
            Yearly
          </button>
        </div>

        {/* Chart */}
        <div className="h-72 flex w-full justify-center">
        <Line data={chartData} options={options}  />

        </div>
      </div>
    </div>
  );
}

export default SalesChartToggle;
