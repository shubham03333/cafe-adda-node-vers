'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Edit2, Trash2, Plus, BarChart3, Settings, Menu, Users, Package } from 'lucide-react';
import { MenuItem } from '@/types';
import SalesReport from '@/components/SalesReport';

const AdminControlPanel = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [isSavingPositions, setIsSavingPositions] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: '',
    is_available: true
  });

  // Fetch menu items
  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError('Failed to load menu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: MenuItem) => {
    e.dataTransfer.setData('text/plain', item.id.toString());
    setDraggedItem(item);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-100');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-blue-100');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: MenuItem) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-100');
    
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    if (draggedId === targetItem.id) return;

    const draggedIndex = menuItems.findIndex(item => item.id === draggedId);
    const targetIndex = menuItems.findIndex(item => item.id === targetItem.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newMenuItems = [...menuItems];
    const [removed] = newMenuItems.splice(draggedIndex, 1);
    newMenuItems.splice(targetIndex, 0, removed);
    
    // Update positions based on new order
    const updatedItems = newMenuItems.map((item, index) => ({
      ...item,
      position: index + 1
    }));
    
    setMenuItems(updatedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const saveMenuPositions = async () => {
    setIsSavingPositions(true);
    try {
      const response = await fetch('/api/menu/position', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItems })
      });

      if (!response.ok) throw new Error('Failed to save menu positions');

      await fetchMenu(); // Refresh menu to get updated positions
      
    } catch (err) {
      setError('Failed to save menu positions');
      console.error(err);
    } finally {
      setIsSavingPositions(false);
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !item.is_available })
      });

      if (!response.ok) throw new Error('Failed to update item availability');

      await fetchMenu(); // Refresh menu
      
    } catch (err) {
      setError('Failed to update item availability');
      console.error(err);
    }
  };

  const deleteMenuItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete menu item');

      await fetchMenu(); // Refresh menu
      
    } catch (err) {
      setError('Failed to delete menu item');
      console.error(err);
    }
  };

  const saveMenuItem = async () => {
    try {
      const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem || newItem)
      });

      if (!response.ok) throw new Error('Failed to save menu item');

      setEditingItem(null);
      setNewItem({ name: '', price: 0, category: '', is_available: true });
      await fetchMenu(); // Refresh menu
      
    } catch (err) {
      setError('Failed to save menu item');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <div>Loading Admin Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
            <a 
              href="/" 
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Orders
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'menu', label: 'Menu Management', icon: Menu },
              { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
              { id: 'settings', label: 'System Settings', icon: Settings },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'inventory', label: 'Inventory', icon: Package }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Add/Edit Menu Item Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingItem?.name || newItem.name || ''}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                    placeholder="Item name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem?.price || newItem.price || 0}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })
                      : setNewItem({ ...newItem, price: parseFloat(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem?.category || newItem.category || ''}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, category: e.target.value })
                      : setNewItem({ ...newItem, category: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                    placeholder="Category"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingItem?.is_available ?? newItem.is_available ?? true}
                      onChange={(e) => editingItem 
                        ? setEditingItem({ ...editingItem, is_available: e.target.checked })
                        : setNewItem({ ...newItem, is_available: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-800">Available</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={saveMenuItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                
                {editingItem && (
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* Menu Items List with Drag & Drop */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Menu Items ({menuItems.length})</h2>
                <div className="flex gap-3">
                  <button
                    onClick={saveMenuPositions}
                    disabled={isSavingPositions}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingPositions ? 'Saving...' : 'Save Positions'}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
                <p className="text-sm text-yellow-800">
                  💡 Drag and drop items to reorder them. Changes are saved automatically when you click "Save Positions".
                </p>
              </div>

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={(e) => handleDragOver(e)}
                    onDragLeave={(e) => handleDragLeave(e)}
                    onDrop={(e) => handleDrop(e, item)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-semibold">
                        {item.position || '?'}
                      </div>
                      
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-700">
                      ₹{item.price} • {item.category}
                    </div>
                  </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>

                      <button
                        onClick={() => toggleItemAvailability(item)}
                        className={`p-2 rounded ${
                          item.is_available 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                      >
                        {item.is_available ? '❌' : '✅'}
                      </button>

                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sales Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Sales Reports</h2>
            <SalesReport />
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div className="text-lg">System Settings Coming Soon</div>
              <div className="text-sm mt-2">This feature will be implemented in the next update</div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div className="text-lg">User Management Coming Soon</div>
              <div className="text-sm mt-2">This feature will be implemented in the next update</div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div className="text-lg">Inventory Management Coming Soon</div>
              <div className="text-sm mt-2">This feature will be implemented in the next update</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminControlPanel;
