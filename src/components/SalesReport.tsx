import React, { useState } from 'react';
import { BarChart3, X } from 'lucide-react';

const SalesReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const closeReportModal = () => {
    setSalesReport(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
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
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Generate Report
      </button>

      {error && <div className="text-red-600 mt-4">{error}</div>}

      {salesReport && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Report Results:</h3>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-green-800">Total Revenue</div>
              <div className="text-lg font-bold text-green-900">₹{salesReport.total_revenue || 0}</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-blue-800">Total Orders</div>
              <div className="text-lg font-bold text-blue-900">{salesReport.total_orders || 0}</div>
            </div>
            
            {salesReport.daily_sales && salesReport.daily_sales.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Daily Breakdown:</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="space-y-2">
                    {salesReport.daily_sales.map((day: any) => (
                      <div key={day.date} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{new Date(day.date).toLocaleDateString()}</span>
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
