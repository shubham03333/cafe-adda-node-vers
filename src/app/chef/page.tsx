'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChefOrderSystem from '@/components/ChefOrderSystem';

export default function ChefPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userRole = localStorage.getItem('userRole');
      
      if (isLoggedIn === 'true' && userRole === 'chef') {
        setIsAuthenticated(true);
      } else {
        router.push('/chef/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Chef Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 w-full sm:w-auto"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <ChefOrderSystem />
    </div>
  );
}
