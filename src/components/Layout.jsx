import React from 'react';
import Sidebar from './Sidebar';
import { Menu, Plus, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  // Close mobile menu when route changes automatically
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-white md:bg-things-bg flex">
      {/* Desktop Sidebar - Fixed Position */}
      <div className="hidden md:flex w-64 fixed inset-y-0 left-0 z-30 flex-col h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-start justify-start">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
             onClick={() => setMobileMenuOpen(false)} 
           />
           
           {/* Drawer */}
           <div className="relative w-72 h-full max-w-[85vw] shadow-2xl animate-fade-in-left bg-white">
             <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col w-full relative">
        {/* Mobile Header - Sticky */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-gray-800 text-lg">MockMaster</span>
          </div>
          
          <div className="flex items-center gap-1">
             <Link 
              to="/add" 
              className="p-2 text-things-blue bg-blue-50 rounded-full active:scale-95 transition"
             >
                <Plus className="w-5 h-5" />
             </Link>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 w-full mx-auto max-w-5xl px-4 py-6 md:px-12 md:py-12 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}