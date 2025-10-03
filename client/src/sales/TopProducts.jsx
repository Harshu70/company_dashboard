import React, { useState, useEffect } from 'react';

function TopProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://company-dashboard-lsr7.onrender.com/api/top_products')
      .then(response => response.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching top products:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading top products...</div>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Top 10 Selling Products</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
              <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap font-medium text-gray-900">{product.product_name}</td>
                <td className="p-3 whitespace-nowrap text-gray-600">{product.category}</td>
                <td className="p-3 whitespace-nowrap text-green-600 font-semibold">
                  ${parseFloat(product.total_sales).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TopProducts;