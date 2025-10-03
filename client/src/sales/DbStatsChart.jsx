import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DbStatsChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [cancelledPercentage, setCancelledPercentage] = useState(0);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/db_stats")
      .then((response) => response.json())
      .then((data) => {
        setTotalEntries(data.total_entries ?? 0);
        setCancelledCount(data.cancelled_count ?? 0);
        setCancelledPercentage(data.cancelled_percentage ?? 0);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching db stats:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="p-6 text-center">Loading database stats...</div>;
  if (error)
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  const activeCount = Math.max(totalEntries - cancelledCount, 0);

  const data = {
    labels: ["Active", "Cancelled"],
    datasets: [
      {
        data: [activeCount, cancelledCount],
        backgroundColor: ["#10B981", "#EF4444"],
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: "bottom" },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Database: Entries & Cancelled Subscriptions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Total Entries</span>
          <span className="text-3xl font-bold">{totalEntries}</span>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Cancelled (%)</span>
          <span className="text-3xl font-bold">{cancelledPercentage}%</span>
          <span className="text-xs text-gray-400">{cancelledCount} users cancelled</span>
        </div>
      </div>

      <div className="h-80 bg-white shadow-md rounded-lg p-4">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}
