import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler );

function SalesForecastChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  // --- NEW: State to manage the forecast period in days ---
  const [forecastDays, setForecastDays] = useState(90); // Default to 90 days (a quarter)

  useEffect(() => {
    setLoading(true);
    // The fetch URL is now dynamic based on the forecastDays state
    fetch(`http://127.0.0.1:5000/api/full_sales_view?days=${forecastDays}`)
      .then(response => response.json())
      .then(data => {
        const allLabels = [...data.historical_dates, ...data.forecast_dates];
        setChartData({
          labels: allLabels,
          datasets: [
            {
              label: 'Historical Daily Sales',
              data: data.historical_sales,
              borderColor: '#3b82f6',
              backgroundColor: '#3b82f6',
              pointRadius: 1,
              tension: 0.3,
            },
            {
              label: 'Forecasted Sales',
              data: Array(data.historical_sales.length).fill(null).concat(data.forecast_sales),
              borderColor: '#3b82f6',
              borderDash: [5, 5],
              pointRadius: 0,
              tension: 0.3,
              fill: true,
              backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                return gradient;
              },
            },
          ],
        });
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching sales data:", error);
        setLoading(false);
      });
  }, [forecastDays]); // The effect re-runs whenever forecastDays changes

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        // The title is now dynamic
        text: `Historical Sales & ${forecastDays}-Day Forecast`,
        font: { size: 18, weight: '600' },
        color: '#334155'
      },
    },
     scales: {
       x: { grid: { display: false } },
       y: {
        beginAtZero: true,
        title: { display: true, text: 'Sales Amount ($)' },
        grid: { color: '#e2e8f0' }
      }
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md h-[450px] flex flex-col">
      {/* --- NEW: Buttons to control the forecast period --- */}
      <div className="flex justify-end space-x-2 mb-4">
        <button 
          onClick={() => setForecastDays(90)}
          className={`px-3 py-1 text-sm rounded-md ${forecastDays === 90 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Next Quarter
        </button>
        <button 
          onClick={() => setForecastDays(365)}
          className={`px-3 py-1 text-sm rounded-md ${forecastDays === 365 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Next Year
        </button>
      </div>

      <div className="flex-grow">
        {loading ? (
          <div className="text-center p-4">Loading sales chart...</div>
        ) : (
          chartData && <Line options={options} data={chartData} />
        )}
      </div>
    </div>
  );
}

export default SalesForecastChart;