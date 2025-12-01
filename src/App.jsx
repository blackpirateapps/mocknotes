import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Importer from './pages/Importer';
import MockDetail from './pages/MockDetail';
import Settings from './pages/Settings';
import TakeQuiz from './pages/TakeQuiz'; // <--- Import the new page

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/add" element={<Importer />} />
      <Route path="/mock/:id" element={<MockDetail />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/take-quiz" element={<TakeQuiz />} /> {/* <--- Add this line */}
    </Routes>
  );
}