import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2 } from 'lucide-react';

export default function MockCard({ mock }) {
  // Format date nicely (e.g., "Oct 24")
  const dateStr = new Date(mock.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <Link 
      to={`/mock/${mock.id}`}
      className="group relative block bg-white rounded-xl shadow-things hover:shadow-things-hover border border-things-border transition-all duration-300 overflow-hidden aspect-[4/5] md:aspect-square"
    >
      {/* Background Image */}
      <img 
        src={mock.image} 
        alt="Question Preview" 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
        loading="lazy"
      />

      {/* Overlay Gradient (Always visible at bottom, expands on hover) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Content Container */}
      <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        
        {/* Meta info row */}
        <div className="flex items-center gap-2 text-xs text-white/70 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateStr}
          </span>
          {/* Optional: Show if it has been "solved" or "viewed" if you add that state later */}
          {mock.visited && <CheckCircle2 className="w-3 h-3 text-green-400" />}
        </div>

        {/* Question Text */}
        <h3 className="text-white font-medium text-sm line-clamp-2 leading-snug">
          {mock.question}
        </h3>
        
        {/* "View" Label on Hover */}
        <div className="h-0 group-hover:h-6 overflow-hidden transition-all duration-300">
            <span className="text-xs font-bold text-things-blue mt-2 inline-block">
                Open Question &rarr;
            </span>
        </div>
      </div>
    </Link>
  );
}