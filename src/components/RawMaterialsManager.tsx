'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Edit, Trash2 } from 'lucide-react';
import { RawMaterial, RawMaterialUpdate } from '@/types';

interface RawMaterialsManagerProps {
  onRawMaterialUpdate?: () => void;
}

const RawMaterialsManager: React.FC<RawMaterialsManagerProps> = ({ onRawMaterialUpdate }) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [newMaterial, setNewMaterial] = useState<Partial<RawMaterialUpdate>>({
    name: '',
    description: '',
    unit_type: 'kg',
    current_stock: 0,
    min_stock_level: 5,
    supplier_info: ''
  });

  const fetchRawMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/raw-materials');
      if (!response.ok) throw new Error('Failed to fetch raw materials');
      const data = await response.json();
      setRawMaterials(data);
    } catch (err) {
      setError('Failed to load raw materials');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createRawMaterial = async () => {
    try {
      const response = await fetch('/api/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial)
      });

      if (!response.ok) throw new Error('Failed to create raw material');
      
      setNewMaterial({
        name: '',
        description: '',
        unit_type: 'kg',
        current_stock: 0,
        min_stock_level: 5,
        supplier_info: ''
      });
      
      await fetchRawMaterials();
      onRawMaterialUpdate?.();
    } catch (err) {
      setError('Failed to create raw material');
      console.error(err);
    }
  };

  const updateRawMaterial = async (material: RawMaterialUpdate) => {
    try {
      const response = await fetch('/api/raw-materials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([material])
      });

      if (!response.ok) throw new Error('Failed to update raw material');
      
      setEditingMaterial(null);
      await fetchRawMaterials();
      onRawMaterialUpdate?.();
    } catch (err) {
      setError('Failed to update raw material');
      console.error(err);
    }
  };

  const adjustStock = async (materialId: number, action: 'add' | 'subtract', quantity: number = 1) => {
    try {
      const material = rawMaterials.find(m => m.id === materialId);
      if (!material) return;

      const update: RawMaterialUpdate = {
        id: materialId,
        current_stock: action === 'add' 
          ? material.current_stock + quantity
          : Math.max(0, material.current_stock - quantity)
      };

      await updateRawMaterial(update);
    } catch (err) {
      setError('Failed to adjust stock');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading raw materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Raw Material */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Raw Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newMaterial.name}
              onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="e.g., Coffee Beans"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
            <select
              value={newMaterial.unit_type}
              onChange={(e) => setNewMaterial({ ...newMaterial, unit_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="liter">liter</option>
              <option value="ml">ml</option>
              <option value="pieces">pieces</option>
              <option value="packets">packets</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
            <input
              type="number"
              value={newMaterial.current_stock}
              onChange={(e) => setNewMaterial({ ...newMaterial, current_stock: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
              min="0"
              step="0.1"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
            <input
              type="number"
              value={newMaterial.min_stock_level}
              onChange={(e) => setNewMaterial({ ...newMaterial, min_stock_level: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Info</label>
            <input
              type="text"
              value={newMaterial.supplier_info}
              onChange={(e) => setNewMaterial({ ...newMaterial, supplier_info: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Supplier name/contact"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={newMaterial.description}
            onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
            rows={2}
            placeholder="Brief description of the raw material"
          />
        </div>
        <button
          onClick={createRawMaterial}
          disabled={!newMaterial.name}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Raw Material
        </button>
      </div>

      {/* Raw Materials List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Materials Inventory</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Current Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Min Level</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Unit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((material) => {
                const isLowStock = material.current_stock <= material.min_stock_level;
                const statusColor = isLowStock ? 'text-red-600' : 'text-green-600';
                const statusText = isLowStock ? 'Low Stock' : 'Good';

                return (
                  <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{material.name}</div>
                      {material.description && (
                        <div className="text-sm text-gray-600">{material.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {Number(material.current_stock).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{material.min_stock_level}</td>
                    <td className="py-3 px-4 text-gray-700">{material.unit_type}</td>
                    <td className={`py-3 px-4 font-medium ${statusColor}`}>
                      {statusText}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => adjustStock(material.id, 'add', 1)}
                          className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                          title="Add 1 unit"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => adjustStock(material.id, 'subtract', 1)}
                          disabled={material.current_stock <= 0}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Subtract 1 unit"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rawMaterials.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <div className="text-lg">No raw materials found</div>
            <div className="text-sm">Add raw materials to track inventory</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RawMaterialsManager;
