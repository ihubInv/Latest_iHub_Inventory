import React, { useState } from 'react'
import { 
  Package, 
  PlusCircle, 
  CheckCircle, 
  MapPin, 
  ClipboardList,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useGetDashboardStatsQuery } from '../store/api/dashboardApi'
import { useGetInventoryStatsQuery } from '../store/api/inventoryApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
)

const StockManagerDashboard: React.FC = () => {
  const { data: inventoryStats, isLoading: loadingInventoryStats } = useGetInventoryStatsQuery()
  const { data: dashboardStats, isLoading: loadingDashboardStats } = useGetDashboardStatsQuery()
  
  // State for month and year filters
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  
  const totalItems = inventoryStats?.data?.totalItems ?? 0
  const totalValue = inventoryStats?.data?.totalValue ?? 0
  const issuedItems = (((inventoryStats?.data as any)?.byStatus) || []).find((s: any) => s._id === 'issued')?.count ?? 0
  const totalCategories = (dashboardStats?.data as any)?.overview?.totalCategories ?? (dashboardStats?.data as any)?.totalCategories ?? 0
  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  
  // Mock data for monthly price distribution by category
  // In production, this should come from an API based on selectedMonth and selectedYear
  const monthlyPriceData = {
    labels: ['Laptops', 'Monitors', 'Accessories', 'Furniture', 'Networking'],
    datasets: [
      {
        data: [380000, 240000, 110000, 80000, 45000],
        backgroundColor: [
          '#0d559e',
          '#1a6bb8',
          '#2c7bc7',
          '#5fa4da',
          '#9bc5ea',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }
  
  const totalMonthlyPrice = monthlyPriceData.datasets[0].data.reduce((sum, val) => sum + val, 0)
  
  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i)
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Total Inventory</div>
            <div className="text-2xl font-bold text-gray-900">{loadingInventoryStats || loadingDashboardStats ? '—' : totalItems}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0d559e]/10">
            <Package className="w-6 h-6 text-[#0d559e]" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Issued Items</div>
            <div className="text-2xl font-bold text-gray-900">{loadingInventoryStats || loadingDashboardStats ? '—' : issuedItems}</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Total Inventory Value</div>
            <div className="text-2xl font-bold text-gray-900">{loadingInventoryStats || loadingDashboardStats ? '—' : currencyFormatter.format(totalValue)}</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-100">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Total Categories</div>
            <div className="text-2xl font-bold text-gray-900">{loadingInventoryStats || loadingDashboardStats ? '—' : totalCategories}</div>
          </div>
          <div className="p-3 rounded-lg bg-indigo-100">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>
      
      {/* Analytics Overview - Charts */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0d559e]">Analytics Overview</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          {/* Line Chart */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-[#0d559e]/5 to-[#1a6bb8]/5 h-64 sm:h-72">
            <div className="text-sm font-medium text-gray-700 mb-2">Issues over last 6 months</div>
            <div className="w-full h-[calc(100%-1.75rem)]">
            <Line
              data={{
                labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                datasets: [
                  {
                    label: 'Direct Issued',
                    data: [9, 14, 12, 18, 16, 20],
                    borderColor: '#0d559e',
                    backgroundColor: 'rgba(13,85,158,0.2)',
                    tension: 0.35,
                    fill: true,
                  },
                  {
                    label: 'Via Requests',
                    data: [6, 8, 7, 9, 10, 11],
                    borderColor: '#2c7bc7',
                    backgroundColor: 'rgba(44,123,199,0.18)',
                    tension: 0.35,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 8 },
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: {
                  x: { grid: { color: 'rgba(0,0,0,0.05)' } },
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                },
              }}
            />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-[#0d559e]/5 to-[#1a6bb8]/5 h-64 sm:h-72">
            <div className="text-sm font-medium text-gray-700 mb-2">Top issued categories</div>
            <div className="w-full h-[calc(100%-1.75rem)]">
            <Bar
              data={{
                labels: ['Laptops', 'Monitors', 'Accessories', 'Furniture', 'Networking'],
                datasets: [
                  {
                    label: 'Issued',
                    data: [60, 40, 55, 18, 12],
                    backgroundColor: ['#0d559e', '#1a6bb8', '#2c7bc7', '#5fa4da', '#9bc5ea'],
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 8 },
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: 'rgba(0,0,0,0.05)' } },
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                },
              }}
            />
            </div>
          </div>

          {/* Donut Chart - Monthly Price */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-[#0d559e]/5 to-[#1a6bb8]/5 h-64 sm:h-72 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Monthly Price Distribution</div>
            </div>
            
            {/* Month and Year Filters */}
            <div className="flex gap-2 mb-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0d559e]"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0d559e]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Monthly Price */}
            <div className="text-center mb-2">
              <div className="text-xs text-gray-600">Total Value</div>
              <div className="text-lg font-bold text-[#0d559e]">
                {currencyFormatter.format(totalMonthlyPrice)}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="w-full h-full max-h-[140px] flex items-center justify-center">
                <Doughnut
                  data={monthlyPriceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 8,
                          font: { size: 10 },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${currencyFormatter.format(value)}`;
                          }
                        }
                      }
                    },
                    cutout: '60%',
                  }}
                />
              </div>
            </div>
          </div>

          
        </div>
      </div>
      
      {/* Request Management Overview for Stock Managers */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-800">Request Management</h2>
            <p className="text-blue-700">Approve or reject employee asset requests</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Pending</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">8</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Approved</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">32</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">  
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Rejected</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">5</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">45</div>
          </div>
        </div>
        
        <Link 
          to="/requests" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Review Requests
        </Link>
      </div>
      
      
      {/* Stock Management Actions */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-800">Stock Management</h2>
            <p className="text-emerald-700">Essential inventory management tools</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link 
            to="/inventory" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Inventory</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Manage inventory items and stock levels</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              View Inventory →
            </div>
          </Link>
          
          <Link 
            to="/add-inventory" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Add Items</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Add new inventory items to the system</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              Add Inventory →
            </div>
          </Link>
          
          <Link 
            to="/issued-items" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Issued Items</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Track issued inventory items</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              View Issued Items →
            </div>
          </Link>
          
          <Link 
            to="/locations" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Locations</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Manage storage locations</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              Manage Locations →
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StockManagerDashboard