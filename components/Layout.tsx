import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, SiteSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  settings: SiteSettings;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, settings, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-indigo-600 font-bold' : 'text-gray-600 hover:text-indigo-600';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <span className="text-2xl font-bold text-indigo-600">
                  {settings.siteName}
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
                <Link to="/" className={isActive('/')}>Home</Link>
                <Link to="/pricing" className={isActive('/pricing')}>Pricing</Link>
                {user && (
                  <>
                    <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
                    <Link to="/ai" className={isActive('/ai')}>AI Chat</Link>
                    <Link to="/billing" className={isActive('/billing')}>Billing</Link>
                    {user.role === 'admin' && (
                       <Link to="/admin" className={isActive('/admin')}>Admin Panel</Link>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Hi, {user.username}</span>
                  <button
                    onClick={onLogout}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-gray-50">
        {settings.maintenanceMode && user?.role !== 'admin' ? (
          <div className="flex flex-col items-center justify-center h-full mt-20">
             <h1 className="text-4xl font-bold text-gray-800">Maintenance Mode</h1>
             <p className="text-gray-600 mt-2">We are currently updating our systems. Please check back later.</p>
          </div>
        ) : (
          children
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;