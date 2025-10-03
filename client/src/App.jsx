// src/App.jsx

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { HiMenu } from 'react-icons/hi';

// Import all your individual components
import ChurnPrediction from './churns/ChurnPrediction';
import ChurnTrendChart from './churns/ChurnTrendChart';
import ChurnSegment from './churns/ChurnSegment';
import GeoChart from './churns/GeoChart';
import SalesForecast from './sales/SalesForcast';
import SalesKPIs from './sales/SalesKpis';
import TopProducts from './sales/TopProducts';
import DemandForecast from './sales/DemandForecast';
import FileUpload from './FileUpload';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeComponent, setActiveComponent] = useState('sales-kpis'); 

  const componentMap = {
    'churn-prediction': <ChurnPrediction />,
    'churn-trend': <ChurnTrendChart />,
    'churn-segment': <ChurnSegment />,
    'user-geo': <GeoChart />,
    'sales-forecast': <SalesForecast />,
    'sales-kpis': <SalesKPIs />,
    'top-products': <TopProducts />,
    'demand-forecast': <DemandForecast />,
    'file-upload': <FileUpload />,
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* Header bar for the content area */}
        <header className="p-4 bg-white border-b border-gray-200 flex items-center">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <HiMenu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-700">Analytics Dashboard</h1>
        </header>

        {/* The actual component rendering area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {componentMap[activeComponent] || <p>Select a component to view.</p>}
        </main>
      </div>
      {/* <DbStatsChart /> */}

      
    </div>
  );
}

export default App;