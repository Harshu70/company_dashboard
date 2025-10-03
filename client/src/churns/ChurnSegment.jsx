import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function ChurnSegment() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [segmentData, setSegmentData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/churn_segmentation")
      .then((response) => response.json())
      .then((data) => {
        setSegmentData(data); // Store raw data
        const labels = Object.keys(data);
        const values = Object.values(data);
        const backgroundColors = [
          "rgba(239, 68, 68, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(16, 185, 129, 1)",
        ];

        setChartData({
          labels: labels,
          datasets: [
            {
              label: "# of Customers",
              data: values,
              backgroundColor: backgroundColors,
              borderColor: "#ffffff",
              borderWidth: 3,
              legendColors: backgroundColors,
            },
          ],
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching segmentation data:", error);
        setLoading(false);
      });
  }, []);

  const options = {
    responsive: true,
    cutout: "70%", // ---> Makes the doughnut ring thinner, closer to the image
    plugins: {
      legend: {
        display: false, // ---> IMPORTANT: Hides the default legend
      },
      title: {
        display: false, // ---> Hides the default title
      },
      tooltip: {
        // ---> Optional: Style the tooltip on hover
        backgroundColor: "#333",
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
      },
    },
  };

  if (loading) {
    return <div className="text-center p-4">Loading segmentation chart...</div>;
  }

  // ---> Custom Legend Component
  const CustomLegend = ({ data }) => {
    // Get colors from the chartData state if available
    const colors = chartData?.datasets[0]?.legendColors || [];

    return (
      <div className="flex flex-col justify-center w-full md:w-auto">
        <h2 className="text-lg font-semibold mb-4 underline">
          Detailed Counts
        </h2>
        {Object.entries(data).map(([label, value], index) => (
          <div key={label} className="flex items-start mb-4">
            <span
              className="w-5 h-5 rounded-full mr-3 mt-1 flex-shrink-0"
              style={{ backgroundColor: colors[index] || "#ccc" }}
            ></span>
            <div>
              <p className="text-gray-600">{label}</p>
              <p className="text-2xl font-bold text-gray-800">
                {value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    // ---> Main container uses flexbox for side-by-side layout on medium screens and up
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-full h-full">
      <h1 className="text-2xl mb-2 text-gray-700 font-semibold">Customer Segmentaion by Churn Likelihood</h1>
      <div className=" flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        {/* ---> Chart Container */}
        <div className="w-full md:w-1/2 max-w-xs md:max-w-sm">
          {chartData && <Doughnut options={options} data={chartData} />}
        </div>

        {/* ---> Custom Legend Container */}
        {segmentData && <CustomLegend data={segmentData} />}
      </div>
    </div>
  );
}

export default ChurnSegment;
