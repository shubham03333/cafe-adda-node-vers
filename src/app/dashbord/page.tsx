'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CafeOrderSystem from '@/components/CafeOrderSystem';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userRole = localStorage.getItem('userRole');
      
      if (isLoggedIn === 'true' && userRole === 'user') {
        setIsAuthenticated(true);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Access Denied</div>
          <p className="text-gray-600 mb-4">You need to log in to access this page</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      {/* <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-4" /> */}
      <CafeOrderSystem />
    </div>
  );
}
