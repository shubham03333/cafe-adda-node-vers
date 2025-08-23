'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChefHat, Edit2, Trash2, X, Save, ChevronUp, ChevronDown, BarChart3 } from 'lucide-react';
import { Order, MenuItem, OrderItem, CreateOrderRequest, UpdateOrderRequest } from '@/types';

const CafeOrderSystem = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [buildingOrder, setBuildingOrder] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCounter, setOrderCounter] = useState(1);
  const [dailySales, setDailySales] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // Sales report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesReport, setSalesReport] = useState<any>(null);

  // Fetch menu items
  useEffect(() => {
    fetchMenu();
    fetchOrders();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError('Failed to load menu');
      console.error(err);
    }
  };

  const fetchDailySales = async () => {
    try {
      const response = await fetch('/api/daily-sales');
      if (!response.ok) throw new Error('Failed to fetch daily sales');
      const data = await response.json();
      
      // Get today's sales data (most recent entry)
      if (data.length > 0) {
        const todaySales = data[0]; // Assuming the API returns sorted by date DESC
        setDailySales(todaySales.total_revenue || 0);
      } else {
        setDailySales(0);
      }
    } catch (err) {
      console.error('Failed to fetch daily sales:', err);
      // Fallback to local calculation if API fails
      const served = orders.filter((order: Order) => order.status === 'served');
      const sales = served.reduce((sum: number, order: Order) => sum + order.total, 0);
      setDailySales(sales);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
      
      // Calculate pending orders count (orders that are not served)
      const pendingOrders = data.filter((order: Order) => order.status !== 'served');
      setPendingOrdersCount(pendingOrders.length);
      
      // Fetch daily sales from API instead of calculating locally
      await fetchDailySales();
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load orders');
      setLoading(false);
      console.error(err);
    }
  };

  const addToOrder = (item: MenuItem, quantity: number) => {
    setBuildingOrder(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? {...p, quantity: p.quantity + quantity} : p);
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const placeOrder = async () => {
    if (buildingOrder.length === 0) return;
    
    try {
      const total = buildingOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderData: CreateOrderRequest = {
        order_number: orderCounter.toString().padStart(3, '0'),
        items: buildingOrder,
        total
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Failed to place order');

      setBuildingOrder([]);
      setOrderCounter(prev => prev + 1);
      await fetchOrders(); // Refresh orders
      
    } catch (err) {
      setError('Failed to place order');
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updateData: UpdateOrderRequest = { status };

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update order');

      await fetchOrders(); // Refresh orders
      
    } catch (err) {
      setError('Failed to update order');
      console.error(err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete order');

      await fetchOrders(); // Refresh orders
      
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  const saveEditedOrder = async () => {
    if (!editingOrder || editingOrder.items.length === 0) {
      if (editingOrder) await deleteOrder(editingOrder.id);
      setEditingOrder(null);
      return;
    }

    try {
      const updateData: UpdateOrderRequest = {
        items: editingOrder.items,
        total: editingOrder.total
      };

      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to save order');

      setEditingOrder(null);
      await fetchOrders(); // Refresh orders
      
    } catch (err) {
      setError('Failed to save order');
      console.error(err);
    }
  };

  const removeItemFromBuildingOrder = (itemId: number) => {
    setBuildingOrder(prev => prev.filter(item => item.id !== itemId));
  };

  const updateBuildingOrderItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setBuildingOrder(prev => prev.filter(item => item.id !== itemId));
    } else {
      // Update quantity
      setBuildingOrder(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItemFromOrder = async (orderId: string, itemId: number) => {
    try {
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (!orderToUpdate) return;

      const updatedItems = orderToUpdate.items.filter(item => item.id !== itemId);
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const updateData: UpdateOrderRequest = {
        items: updatedItems,
        total
      };

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to remove item from order');

      await fetchOrders(); // Refresh orders
      
    } catch (err) {
      setError('Failed to remove item from order');
      console.error(err);
    }
  };

  const editOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const cancelEdit = () => {
    setEditingOrder(null);
  };

  const updateEditingOrderItem = (itemId: number, newQuantity: number) => {
    if (!editingOrder) return;
    
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      const updatedItems = editingOrder.items.filter(item => item.id !== itemId);
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setEditingOrder({ ...editingOrder, items: updatedItems, total });
    } else {
      // Update quantity
      const updatedItems = editingOrder.items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setEditingOrder({ ...editingOrder, items: updatedItems, total });
    }
  };

  const addItemToEditingOrder = (item: MenuItem) => {
    if (!editingOrder) return;
    
    const existingItem = editingOrder.items.find(i => i.id === item.id);
    let updatedItems;
    
    if (existingItem) {
      updatedItems = editingOrder.items.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updatedItems = [...editingOrder.items, { ...item, quantity: 1 }];
    }
    
    const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setEditingOrder({ ...editingOrder, items: updatedItems, total });
  };

  // Sales report functions
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

  const openReportModal = () => {
    setIsReportModalOpen(true);
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setSalesReport(null);
  };

  // Scrollable Section Component
  const ScrollableSection = ({ 
    children, 
    maxHeight = '300px',
    className = '' 
  }: {
    children: React.ReactNode;
    maxHeight?: string;
    className?: string;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const checkScrollPosition = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        setShowScrollTop(scrollTop > 0);
        setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 10);
      }
    };

    const scrollToTop = () => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
      }
    };

    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScrollPosition);
        // Check initial scroll position
        setTimeout(checkScrollPosition, 100);
        return () => container.removeEventListener('scroll', checkScrollPosition);
      }
    }, [children]);

    return (
      <div className={`relative ${className}`}>
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
            title="Scroll to top"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        
        {/* Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
            title="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
        
        {/* Content Container */}
        <div
          ref={containerRef}
          className="overflow-y-auto scrollbar-hide"
          style={{ maxHeight }}
          onScroll={checkScrollPosition}
        >
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-xl font-bold mb-2">Error</div>
          <div>{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Adda®️ Dash.</h1>
          <div className="text-right">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-600">Pending Orders</div>
                <div className="text-lg font-bold text-orange-600">{pendingOrdersCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Today's Sales</div>
                <div className="text-lg font-bold text-green-600">₹{dailySales}</div>
              </div>
              <button
                onClick={openReportModal}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Sales Report"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Building Order Section */}
      {buildingOrder.length > 0 && (
        <div className="bg-blue-100 rounded-lg p-4 mb-4 border-2 border-blue-300">
          <h3 className="font-semibold text-blue-900 mb-2">Building Order:</h3>
          {buildingOrder.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-blue-300">
              <span className="text-blue-900 font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateBuildingOrderItemQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700 transition-colors text-sm"
                >
                  -
                </button>
                <span className="w-6 text-center font-semibold text-blue-900 text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateBuildingOrderItemQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700 transition-colors text-sm"
                >
                  +
                </button>
                <span className="font-medium text-blue-900 w-16 text-right">₹{item.price * item.quantity}</span>
                <button
                  onClick={() => removeItemFromBuildingOrder(item.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between items-center">
            <span className="font-bold text-blue-900">
              Total: ₹{buildingOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
            </span>
            <button 
              onClick={placeOrder}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Order #{editingOrder.order_number}</h2>
              <button
                onClick={cancelEdit}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Current Items:</h3>
              {editingOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-900 font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateEditingOrderItem(item.id, item.quantity - 1)}
                      className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700 transition-colors text-sm"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-semibold text-gray-900 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateEditingOrderItem(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700 transition-colors text-sm"
                    >
                      +
                    </button>
                    <button
                      onClick={() => updateEditingOrderItem(item.id, 0)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Add Items:</h3>
              <div className="grid grid-cols-2 gap-2">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItemToEditingOrder(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium text-sm transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="font-bold text-xl text-gray-900">
                Total: ₹{editingOrder.total}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedOrder}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Menu Items</h2>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => addToOrder(item, 1)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center font-medium min-h-[80px] flex flex-col justify-center transition-all duration-200 hover:scale-105"
            >
              <div className="font-semibold text-sm leading-tight px-1 overflow-hidden" style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>{item.name}</div>
              <div className="text-xs opacity-90 mt-1">₹{item.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Order Queue */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Order Queue ({orders.length})
        </h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div>No orders in queue</div>
          </div>
        ) : (
          <ScrollableSection maxHeight="400px" className="mt-2">
            <div className="space-y-3 pr-1">
              {orders.map(order => (
                <div key={order.id} className="p-4 rounded-lg border-l-4 border-orange-600 bg-orange-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-800" />
                      <span className="font-bold text-lg text-orange-900">#{order.order_number}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-900">₹{order.total}</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm text-orange-800 py-1">
                        <span>{item.quantity}x {item.name}</span>
                        <button
                          onClick={() => removeItemFromOrder(order.id, item.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => editOrder(order)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      title="Edit order"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'served')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                    >
                      Served
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollableSection>
        )}
      </div>

      {/* Sales Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Sales Report</h2>
              <button
                onClick={closeReportModal}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                Generate Report
              </button>
            </div>

            {salesReport && (
              <div className="border-t border-gray-200 pt-4">
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
                      <ScrollableSection maxHeight="200px">
                        <div className="space-y-2">
                          {salesReport.daily_sales.map((day: any) => (
                            <div key={day.date} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">{new Date(day.date).toLocaleDateString()}</span>
                              <span className="font-medium text-gray-900">₹{day.revenue}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollableSection>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeOrderSystem;
