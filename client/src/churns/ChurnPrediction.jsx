import React, { useState, useEffect } from 'react';

function ChurnPrediction() {
  const [churners, setChurners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(10); 

  useEffect(() => {
    setLoading(true);
    fetch(`https://company-dashboard-lsr7.onrender.com/api/predict_churn?count=${count}`)
      .then(response => response.json())
      .then(data => {
        setChurners(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching churn predictions:", error);
        setLoading(false);
      });
  }, [count]);

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md flex flex-col h-[600px] ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">High-Risk Customers</h2>
        <select 
          value={count} 
          onChange={(e) => setCount(Number(e.target.value))}
          className="border border-gray-300 rounded-md p-1 "
        >
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="20">Top 20</option>
          <option value="50">Top 50</option>
        </select>
      </div>

      <div className="overflow-y-auto">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <table className="w-full text-left ">
            <thead className="bg-gray-50 sticky top-0 ">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Customer ID</th>
                {/* --- NEW COLUMNS --- */}
                <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Last Purchase</th>
                <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Cancellations</th>
                <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Churn Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 ">
              {churners.map(customer => (
                <tr key={customer.customer_id} className="hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap font-medium text-gray-700">{customer.customer_id}</td>
                  {/* --- NEW DATA CELLS --- */}
                  <td className="p-3 whitespace-nowrap text-gray-600">{customer.last_purchase_date}</td>
                  <td className="p-3 whitespace-nowrap text-center text-gray-600">{customer.total_cancellations}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                      customer.subscription_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {customer.subscription_status}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap font-bold text-red-600">
                    {(customer.churn_probability * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ChurnPrediction;