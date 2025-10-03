import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';

function GeoChart() {
  const [chartData, setChartData] = useState([['Country', 'Users']]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/user_distribution')
      .then(res => res.json())
      .then(data => {
        // Format the data for the GeoChart
        const formattedData = [['Country', 'Users']];
        data.forEach(item => {
          formattedData.push([item.country, item.user_count]);
        });
        setChartData(formattedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching geo data:", error);
        setLoading(false);
      });
  }, []);

  const options = {
    colorAxis: { colors: ['#a7d7f9', '#005a9c'] }, // Light to dark blue
    backgroundColor: '#f8fafc', // A light gray background
    datalessRegionColor: '#e5e7eb', // Color for countries with no data
    defaultColor: '#f8fafc',
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">User Distribution by Country</h2>
      {loading ? (
        <div>Loading Map...</div>
      ) : (
        <Chart
          chartType="GeoChart"
          width="100%"
          height="400px"
          data={chartData}
          options={options}
        />
      )}
    </div>
  );
}

export default GeoChart;