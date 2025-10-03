import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function SalesByAgeGroup() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://company-dashboard-lsr7.onrender.com/api/sales_by_age") 
      .then((response) => response.json())
      .then((data) => {
        setSalesData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sales data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading chart...</div>;
  }

  const chartData = {
    labels: salesData.map((item) => item.age_group),
    datasets: [
      {
        label: "Sales",
        data: salesData.map((item) => item.total_sales),
        backgroundColor: [
          "#60a5fa", // 18-25 (blue)
          "#6366f1", // 26-35 (indigo)
          "#ec4899", // 36-45 (pink)
          "#34d399", // 46-60 (green)
          "#facc15"  // 60+ (yellow)
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#e5e7eb", // Tailwind gray-200
        },
      },
    },
  };

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2 text-white">Sales by Age Group</h2>
      <p className="text-gray-400 mb-4">Pie chart of age group sales</p>
      <div className="w-full max-w-sm mx-auto">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

export default SalesByAgeGroup;
