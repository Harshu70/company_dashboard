import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend );

function ChurnTrendChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://company-dashboard-lsr7.onrender.com/api/churn_trends')
      .then(response => response.json())
      .then(data => {
        setChartData({
          labels: data.months,
          datasets: [
            {
              label: 'Number of Churned Customers',
              data: data.churn_counts,
              borderColor: 'rgb(220, 53, 69)',
              backgroundColor: 'rgba(220, 53, 69, 0.5)',
              tension: 0.1
            },
          ],
        });
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching churn trend data:", error);
        setLoading(false);
      });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Customer Churn Trends', font: { size: 18 } },
    },
  };

  if (loading) {
    return <div className="text-center p-4">Loading churn trend chart...</div>;
  }

  // Add Tailwind classes for a card-like container
  return (
    <div className="bg-white p-4 md:p-1 rounded-lg shadow-md mb-4"
    >
      {chartData && <Line options={options} data={chartData} />}
    </div>
  );
}

export default ChurnTrendChart;