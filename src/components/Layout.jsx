import React from 'react';
import Sidebar from './Sidebar';
import { Menu, Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white md:bg-things-bg flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-64 h-full bg-white shadow-xl animate-fade-in-left">
             <Sidebar />
          </div>
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-white sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-1 -ml-1 text-gray-600 active:bg-gray-100 rounded">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-gray-800 text-lg">MockMaster</span>
          </div>
          
          <div className="flex items-center gap-1">
             <Link 
              to="/settings" 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
              title="Settings"
             >
                <Settings className="w-5 h-5" />
             </Link>
             <Link 
              to="/add" 
              className="p-2 text-things-blue hover:bg-blue-50 rounded-full transition"
              title="Add New"
             >
                <Plus className="w-6 h-6" />
             </Link>
          </div>
        </div>

        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:px-12 md:py-12 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}