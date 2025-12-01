import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Settings as SettingsIcon } from 'lucide-react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 pb-20">
      <header className="flex justify-between items-center mb-8 sticky top-0 bg-things-bg/90 backdrop-blur-sm z-10 py-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:opacity-80 transition">
          <BookOpen className="w-6 h-6 text-things-blue" />
          <span>Mock<span className="text-gray-400">Master</span></span>
        </Link>
        
        <div className="flex items-center gap-3">
            <Link 
              to="/settings"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 p-2 rounded-full transition"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <Link 
              to="/add" 
              className="bg-white text-things-blue px-4 py-2 rounded-full font-medium shadow-things hover:shadow-things-hover transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Mock</span>
            </Link>
        </div>
      </header>
      <main className="animate-fade-in">
        {children}
      </main>
    </div>
  );
}