import { Bell, Search } from 'lucide-react';
import Link from 'next/link';

export default function NavBar() {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-7 h-7 bg-indigo-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-md">B</span>
            </div>
            <span className="ml-2 text-md font-bold text-gray-800">JOT</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            <Link href="/" className="flex items-center text-gray-600 hover:text-blue-bg"> Home </Link>
            <Link href="/account" className="flex items-center text-gray-600 hover:text-blue-bg">My Account</Link>
            <Link href="/explore" className="flex items-center text-gray-600 hover:text-blue-bg"> Explore</Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-800" />
              <input
                type="text"
                placeholder="Search for a quiz or user"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>
    );
}