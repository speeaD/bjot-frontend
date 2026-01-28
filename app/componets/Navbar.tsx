import { Bell, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-bg rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">BJOT</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-bg rounded-full font-medium">
              Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-gray-900 hover:text-blue-bg font-medium transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/account" 
            className="text-gray-600 hover:text-blue-bg transition-colors"
          >
            My Account
          </Link>
          <Link 
            href="/explore" 
            className="text-gray-600 hover:text-blue-bg transition-colors"
          >
            Explore
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a quiz or user"
              className="pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-bg focus:border-transparent w-64 text-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-3 hover:bg-gray-100 rounded-xl p-2 transition-colors">
            <div className="w-9 h-9 rounded-full bg-blue-bg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                SE
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </header>
  );
}