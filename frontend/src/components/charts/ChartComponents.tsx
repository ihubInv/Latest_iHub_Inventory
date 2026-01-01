import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Inventory Trend Line Chart
export const InventoryTrendChart: React.FC<{ data: any }> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Total Items',
        data: data.totalItems,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        borderWidth: 3,
      },
      {
        label: 'Available Items',
        data: data.availableItems,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        borderWidth: 3,
      },
    ],
  };

  return <Line options={options} data={chartData} />;
};

// Request Status Doughnut Chart
export const RequestStatusChart: React.FC<{ data: any }> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
      },
    },
    cutout: '60%',
  };

  const chartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [data.pending, data.approved, data.rejected],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(251, 191, 36)',
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
      },
    ],
  };

  return <Doughnut options={options} data={chartData} />;
};

// Category Distribution Bar Chart
export const CategoryDistributionChart: React.FC<{ data: any }> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
      },
    },
  };

  const chartData = {
    labels: data.categories,
    datasets: [
      {
        label: 'Items',
        data: data.counts,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(6, 182, 212, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(168, 85, 247)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(6, 182, 212)',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(6, 182, 212, 1)',
        ],
      },
    ],
  };

  return <Bar options={options} data={chartData} />;
};

// Asset Condition Pie Chart
export const AssetConditionChart: React.FC<{ data: any }> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
      },
    },
  };

  const chartData = {
    labels: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
    datasets: [
      {
        data: [data.excellent, data.good, data.fair, data.poor, data.damaged],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
      },
    ],
  };

  return <Pie options={options} data={chartData} />;
};

// Monthly Activity Line Chart
export const MonthlyActivityChart: React.FC<{ data: any }> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 5,
        hoverRadius: 7,
      },
    },
  };

  const chartData = {
    labels: data.months,
    datasets: [
      {
        label: 'Items Added',
        data: data.itemsAdded,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        borderWidth: 3,
      },
      {
        label: 'Requests Submitted',
        data: data.requestsSubmitted,
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        borderWidth: 3,
      },
    ],
  };

  return <Line options={options} data={chartData} />;
};

// Pivot Data Bar Chart
export const PivotBarChart: React.FC<{ pivotData: any; config: any }> = ({ pivotData, config }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = config.aggregation === 'avg' 
              ? parseFloat(context.parsed.y).toFixed(2) 
              : context.parsed.y.toLocaleString();
            return `${label}: ${value}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6B7280',
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6B7280',
          callback: function(value: any) {
            return config.aggregation === 'avg' 
              ? parseFloat(value).toFixed(1)
              : value.toLocaleString();
          }
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      },
    },
  };

  // Generate colors for each column
  const colors = [
    'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(168, 85, 247, 0.8)',
    'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)',
    'rgba(245, 101, 101, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(167, 139, 250, 0.8)'
  ];

  const borderColors = [
    'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(168, 85, 247)',
    'rgb(251, 191, 36)', 'rgb(239, 68, 68)', 'rgb(6, 182, 212)',
    'rgb(245, 101, 101)', 'rgb(52, 211, 153)', 'rgb(167, 139, 250)'
  ];

  const chartData = {
    labels: pivotData.rows,
    datasets: pivotData.columns.map((col: string, index: number) => ({
      label: col,
      data: pivotData.rows.map((row: string) => pivotData.data[row][col] || 0),
      backgroundColor: colors[index % colors.length],
      borderColor: borderColors[index % borderColors.length],
      borderWidth: 2,
      hoverBackgroundColor: borderColors[index % borderColors.length],
    }))
  };

  return <Bar options={options} data={chartData} />;
};

// Pivot Data Pie Chart
export const PivotPieChart: React.FC<{ pivotData: any; config: any }> = ({ pivotData, config }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 10,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = config.aggregation === 'avg' 
              ? parseFloat(context.parsed).toFixed(2) 
              : context.parsed.toLocaleString();
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  // Calculate row totals for pie chart
  const rowTotals = pivotData.rows.map((row: string) => 
    pivotData.columns.reduce((sum: number, col: string) => sum + (pivotData.data[row][col] || 0), 0)
  );

  const colors = [
    'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(168, 85, 247, 0.8)',
    'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)',
    'rgba(245, 101, 101, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(167, 139, 250, 0.8)'
  ];

  const borderColors = [
    'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(168, 85, 247)',
    'rgb(251, 191, 36)', 'rgb(239, 68, 68)', 'rgb(6, 182, 212)',
    'rgb(245, 101, 101)', 'rgb(52, 211, 153)', 'rgb(167, 139, 250)'
  ];

  const chartData = {
    labels: pivotData.rows,
    datasets: [{
      data: rowTotals,
      backgroundColor: colors.slice(0, pivotData.rows.length),
      borderColor: borderColors.slice(0, pivotData.rows.length),
      borderWidth: 2,
      hoverBackgroundColor: borderColors.slice(0, pivotData.rows.length),
    }]
  };

  return <Pie options={options} data={chartData} />;
};

// Pivot Data Line Chart
export const PivotLineChart: React.FC<{ pivotData: any; config: any }> = ({ pivotData, config }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = config.aggregation === 'avg' 
              ? parseFloat(context.parsed.y).toFixed(2) 
              : context.parsed.y.toLocaleString();
            return `${label}: ${value}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6B7280',
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6B7280',
          callback: function(value: any) {
            return config.aggregation === 'avg' 
              ? parseFloat(value).toFixed(1)
              : value.toLocaleString();
          }
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const colors = [
    'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(168, 85, 247)',
    'rgb(251, 191, 36)', 'rgb(239, 68, 68)', 'rgb(6, 182, 212)',
    'rgb(245, 101, 101)', 'rgb(52, 211, 153)', 'rgb(167, 139, 250)'
  ];

  const chartData = {
    labels: pivotData.rows,
    datasets: pivotData.columns.map((col: string, index: number) => ({
      label: col,
      data: pivotData.rows.map((row: string) => pivotData.data[row][col] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      fill: false,
      borderWidth: 3,
    }))
  };

  return <Line options={options} data={chartData} />;
};

// Pivot Data Heatmap
export const PivotHeatmap: React.FC<{ pivotData: any; config: any }> = ({ pivotData, config }) => {
  // Calculate min and max values for color scaling
  const allValues = pivotData.rows.flatMap((row: string) =>
    pivotData.columns.map((col: string) => pivotData.data[row][col] || 0)
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;

  // Color scale function
  const getColorIntensity = (value: number) => {
    if (valueRange === 0) return 0.1;
    return Math.max(0.1, (value - minValue) / valueRange);
  };

  const getColor = (value: number) => {
    const intensity = getColorIntensity(value);
    const red = Math.floor(255 * (1 - intensity));
    const green = Math.floor(255 * intensity);
    const blue = 100;
    return `rgb(${red}, ${green}, ${blue})`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#0d559e]/10 to-[#1a6bb8]/10 rounded-xl p-4">
      {/* Enhanced Legend */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="font-medium text-gray-700">Low</span>
          </div>
          <div className="flex-1 mx-6">
            <div className="h-6 bg-gradient-to-r from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7] rounded-full shadow-inner relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d559e]/50 via-[#1a6bb8]/50 to-[#2c7bc7]/50 rounded-full opacity-50"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">High</span>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">Color intensity represents value magnitude</span>
        </div>
      </div>

      {/* Enhanced Heatmap Grid */}
      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="min-w-full">
          {/* Enhanced Header Row */}
          <div className="flex border-b-2 border-gray-300 bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10">
            <div className="w-40 p-4 text-sm font-bold text-gray-700 bg-gradient-to-r from-[#0d559e]/20 to-[#1a6bb8]/20 border-r border-gray-300 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Category
            </div>
            {pivotData.columns.map((col: string) => (
              <div key={col} className="flex-1 p-4 text-sm font-bold text-gray-700 text-center border-r border-gray-300 flex items-center justify-center">
                <span className="truncate">{col}</span>
              </div>
            ))}
          </div>

          {/* Enhanced Data Rows */}
          {pivotData.rows.map((row: string, rowIndex: number) => (
            <div key={row} className={`flex border-b border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="w-40 p-4 text-sm font-semibold text-gray-900 border-r border-gray-300 flex items-center bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="truncate">{row}</span>
              </div>
              {pivotData.columns.map((col: string, colIndex: number) => {
                const value = pivotData.data[row][col] || 0;
                const color = getColor(value);
                const intensity = getColorIntensity(value);
                return (
                  <div
                    key={col}
                    className="flex-1 p-4 text-sm text-center border-r border-gray-200 relative group cursor-pointer transition-all duration-200 hover:shadow-lg hover:z-10"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: intensity > 0.7 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <span className={`font-bold text-sm ${
                      intensity > 0.5 ? 'text-white drop-shadow-sm' : 'text-gray-900'
                    }`}>
                      {config.aggregation === 'avg' ? value.toFixed(1) : value.toLocaleString()}
                    </span>
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20 shadow-xl">
                      <div className="font-semibold">{row} × {col}</div>
                      <div className="text-xs text-gray-300 mt-1">
                        Value: {config.aggregation === 'avg' ? value.toFixed(2) : value.toLocaleString()}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-2 mb-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="text-sm font-bold text-blue-900">Data Statistics</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">Minimum</div>
            <div className="text-lg font-bold text-blue-900">
              {config.aggregation === 'avg' ? minValue.toFixed(2) : minValue.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">Maximum</div>
            <div className="text-lg font-bold text-blue-900">
              {config.aggregation === 'avg' ? maxValue.toFixed(2) : maxValue.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">Range</div>
            <div className="text-lg font-bold text-blue-900">
              {config.aggregation === 'avg' ? valueRange.toFixed(2) : valueRange.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};