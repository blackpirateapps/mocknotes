import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Importer from './pages/Importer';
import MockDetail from './pages/MockDetail';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<Importer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/mock/:id" element={<MockDetail />} />
      </Routes>
    </BrowserRouter>
  );
}