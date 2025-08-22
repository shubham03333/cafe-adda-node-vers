'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, Edit2, Trash2, X, Save } from 'lucide-react';
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
          <h1 className="text-xl font-bold text-gray-800">Add@ Dash.</h1>
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
          <div className="space-y-3">
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
        )}
      </div>
    </div>
  );
};

export default CafeOrderSystem;