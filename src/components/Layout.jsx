import React from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

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
          <div className="w-64 h-full bg-white shadow-xl">
             <Sidebar />
          </div>
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b bg-white sticky top-0 z-20">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold ml-2">MockMaster</span>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 md:px-12 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}