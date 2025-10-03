import React, { useState } from 'react';
import { FiUsers, FiTrendingUp, FiUpload, FiPieChart, FiMapPin, FiBarChart, FiDollarSign, FiBox, FiActivity } from 'react-icons/fi';
import { FaChartLine } from "react-icons/fa";

const menuConfig = {
  sales: {
    title: 'Sales Dashboard',
    icon: <FiDollarSign size={22} />,
    subItems: [
      { id: 'sales-kpis', title: 'Sales KPIs', icon: <FiBarChart /> },
      { id: 'sales-forecast', title: 'Sales Forecast', icon: <FiTrendingUp /> },
      { id: 'top-products', title: 'Top Products', icon: <FiBox /> },
      { id: 'demand-forecast', title: 'Demand Forecast', icon: <FiActivity /> },
    ],
  },
  churn: {
    title: 'Churn Dashboard',
    icon: <FaChartLine size={22} />,
    subItems: [
      { id: 'churn-prediction', title: 'High-Risk Customers', icon: <FiUsers /> },
      { id: 'churn-trend', title: 'Churn Trends', icon: <FiTrendingUp /> },
      { id: 'churn-segment', title: 'Risk Segments', icon: <FiPieChart /> },
      { id: 'user-geo', title: 'User Distribution', icon: <FiMapPin /> },
    ],
  },
  
  upload: {
    title: 'Upload File',
    icon: <FiUpload size={22} />,
    subItems: [
      { id: 'file-upload', title: 'Upload Excel/CSV', icon: <FiUpload /> },
    ],
  },
};

function Sidebar({ isOpen, activeComponent, setActiveComponent }) {
  const [activeDashboard, setActiveDashboard] = useState('sales');

  const handleDashboardClick = (dashboardKey) => {
    setActiveDashboard(dashboardKey);
    setActiveComponent(menuConfig[dashboardKey].subItems[0].id);
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-10 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-center h-16 border-b border-slate-700">
        <h1 className={`text-2xl font-bold transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>MyDash</h1>
      </div>
      
      <nav className="mt-4">
        {Object.keys(menuConfig).map((key) => {
          const dashboard = menuConfig[key];
          return (
            <div key={key} className="px-2">
              <button
                onClick={() => handleDashboardClick(key)}
                className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors ${activeDashboard === key ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
              >
                <span className="flex-shrink-0">{dashboard.icon}</span>
                <span className={`ml-4 font-semibold transition-all duration-200 ${!isOpen && 'opacity-0 scale-0'}`}>
                  {dashboard.title}
                </span>
              </button>
              
              {/* Submenu Items */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeDashboard === key ? 'max-h-96' : 'max-h-0'}`}>
                {isOpen && dashboard.subItems.map(item => (
                  <a
                    href="#"
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveComponent(item.id);
                    }}
                    className={`flex items-center p-2 pl-10 my-1 rounded-md text-sm transition-colors ${activeComponent === item.id ? 'bg-slate-900 text-blue-300' : 'text-slate-300 hover:bg-slate-700'}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;