import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--brand-green)' }}>UHAS-Basic</span>
              <span className="text-2xl font-bold text-gray-800"> School</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-[var(--brand-green)] px-3 py-2 rounded-md font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/students" 
              className="text-gray-700 hover:text-[var(--brand-green)] px-3 py-2 rounded-md font-medium transition-colors"
            >
              Students
            </Link>
            <Link 
              to="/teachers" 
              className="text-gray-700 hover:text-[var(--brand-green)] px-3 py-2 rounded-md font-medium transition-colors"
            >
              Teachers
            </Link>
            <Link 
              to="/courses" 
              className="text-gray-700 hover:text-[var(--brand-green)] px-3 py-2 rounded-md font-medium transition-colors"
            >
              Courses
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-[var(--brand-green)] focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-green)' }}>
                  <span className="text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block font-medium">{user?.name || 'User'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout?.();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

