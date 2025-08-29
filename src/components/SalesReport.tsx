import React, { useState, useEffect } from 'react';
import { BarChart3, X } from 'lucide-react';

const SalesReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [todaysSales, setTodaysSales] = useState({ total_orders: 0, total_revenue: 0 });
  const [totalRevenue, setTotalRevenue] = useState({ total_orders: 0, total_revenue: 0 });
  const [salesLoading, setSalesLoading] = useState(false);
  const generateSalesReport = async () => {
    try {
      const response = await fetch(`/api/sales-report?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to generate sales report');
      const data = await response.json();
      setSalesReport(data);
    } catch (err) {
      setError('Failed to generate sales report');
      console.error(err);
    }
  };

  useEffect(() => {
    // Fetch initial data on mount
    fetchTodaysSales();
    fetchTotalRevenue();

    // Set interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchTodaysSales();
      fetchTotalRevenue();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const closeReportModal = () => {
    setSalesReport(null);
    setError(null);
  };

    // Fetch today's sales
  const fetchTodaysSales = async () => {
    setSalesLoading(true);
    try {
      const response = await fetch('/api/daily-sales/today');
      if (!response.ok) throw new Error('Failed to fetch today\'s sales');
      const data = await response.json();
      setTodaysSales(data);
    } catch (err) {
      setError('Failed to load today\'s sales');
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };
    // Reset today's sales
  const resetTodaysSales = async () => {
    if (!confirm('Are you sure you want to reset today\'s sales? This action cannot be undone.')) return;
    
    setSalesLoading(true);
    try {
      const response = await fetch('/api/daily-sales/reset?resetToday=true', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to reset today\'s sales');

      await fetchTodaysSales();
      
    } catch (err) {
      setError('Failed to reset today\'s sales');
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

    // Fetch total revenue
  const fetchTotalRevenue = async () => {
    setSalesLoading(true);
    try {
      const response = await fetch('/api/total-revenue');
      if (!response.ok) throw new Error('Failed to fetch total revenue');
      const data = await response.json();
      setTotalRevenue(data);
    } catch (err) {
      setError('Failed to load total revenue');
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch all sales data
  const fetchSalesData = async () => {
    await Promise.all([fetchTodaysSales(), fetchTotalRevenue()]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Sales Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Today's Sales Card */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Sales</h3>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={fetchTodaysSales}
                  disabled={salesLoading}
                  className="p-1 sm:p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                  title="Refresh Today's Sales"
                >
                  🔄
                </button>
                <button
                  onClick={resetTodaysSales}
                  disabled={salesLoading}
                  className="p-1 sm:p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                  title="Reset Today's Sales"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
            {salesLoading ? (
              <div className="text-center py-3 sm:py-4">
                <div className="animate-pulse text-sm sm:text-base">Loading...</div>
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-600">Total Orders:</span>
                  <span className="text-lg sm:text-xl font-bold text-red-600">{todaysSales.total_orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-600">Revenue:</span>
                  <span className="text-lg sm:text-xl font-bold text-green-600">₹{Number(todaysSales.total_revenue).toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 sm:mt-2">
                  Updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Total Revenue</h3>
              <button
                onClick={fetchTotalRevenue}
                disabled={salesLoading}
                className="p-1 sm:p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                title="Refresh Total Revenue"
              >
                🔄
              </button>
            </div>
            {salesLoading ? (
              <div className="text-center py-3 sm:py-4">
                <div className="animate-pulse text-sm sm:text-base">Loading...</div>
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-600">Total Orders:</span>
                  <span className="text-lg sm:text-xl font-bold text-blue-600">{totalRevenue.total_orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-600">Revenue:</span>
                  <span className="text-lg sm:text-xl font-bold text-green-600">₹{Number(totalRevenue.total_revenue).toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 sm:mt-2">
                  Cumulative from all served orders
                </div>
              </div>
            )}
          </div>
        </div>

      
      <h2 className="text-xl font-bold mb-4 text-gray-900">Sales Report</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
          />
        </div>
      </div>
      <button
        onClick={generateSalesReport}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Generate Report
      </button>

      {error && <div className="text-red-600 mt-4">{error}</div>}

      {salesReport && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Report Results:</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm text-red-800">Total Orders</div>
                <div className="text-lg font-bold text-red-900">{salesReport.total_orders || 0}</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-800">Total Revenue</div>
                <div className="text-lg font-bold text-green-900">₹{salesReport.total_revenue || 0}</div>
              </div>
            </div>
            
            {salesReport.daily_sales && salesReport.daily_sales.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Daily Breakdown:</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="space-y-2">
                    {salesReport.daily_sales.map((day: any) => (
                      <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-4 flex-1">
                          <span className="text-sm text-gray-700 min-w-[100px]">
                            {new Date(day.date).toLocaleDateString()}
                          </span>
                          <span className="text-sm font-medium text-gray-800 min-w-[100px]">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">₹{day.revenue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {salesReport.top_items && salesReport.top_items.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Top Selling Items:</h4>
                <div className="space-y-2">
                  {salesReport.top_items.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-sm text-orange-800">{item.name}</span>
                      <span className="font-medium text-orange-900">{item.quantity} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={closeReportModal}
        className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Close
      </button>
    </div>
  );
};

export default SalesReport;
