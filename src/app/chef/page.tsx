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
        router.push('/login'); // Redirect to the main login page
      }
    };

    checkAuth();
  }, [router]);


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
          <h1 className="text-2xl font-bold text-white text-center">Chef Dashboard</h1>
        </div>
      </div>
      <ChefOrderSystem />
    </div>
  );
}
