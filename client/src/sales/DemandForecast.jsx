import React, { useState, useEffect } from 'react';

function DemandForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://company-dashboard-lsr7.onrender.com/api/product_demand_forecast')
      .then(response => response.json())
      .then(data => {
        // Check if the backend returned an error
        if (data.error) {
          console.error("Error from backend:", data.error);
          setForecasts([]); // Set to empty array on error
        } else {
          setForecasts(data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching demand forecast:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Demand Forecast</h2>
        <div className="text-center p-4">Loading demand forecast...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Demand Forecast (Next 30 Days)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Product ID</th>
              <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Predicted Units to Sell</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {forecasts.map((product) => (
              <tr key={product.product_id} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap font-medium text-gray-900">{product.product_id}</td>
                <td className="p-3 whitespace-nowrap text-blue-600 font-semibold">
                  {product.forecasted_demand_30_days} Units
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DemandForecast;