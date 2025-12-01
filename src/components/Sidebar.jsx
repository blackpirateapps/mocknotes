import React from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { 
  Inbox, Book, Calculator, BrainCircuit, Globe, 
  Settings, PlusCircle 
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const [searchParams] = useSearchParams();
  const currentSubject = searchParams.get('subject');

  // Fetch unique topics per subject for the submenu
  const questions = useLiveQuery(() => db.mocks.toArray()) || [];
  
  const getTopics = (subj) => {
    const relevant = questions.filter(q => q.subject === subj);
    return [...new Set(relevant.map(q => q.topic))];
  };

  const NavItem = ({ to, icon: Icon, label, count, isActive }) => (
    <NavLink 
      to={to} 
      className={clsx(
        "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
        isActive 
          ? "bg-things-blue/10 text-things-blue" 
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={clsx("w-4 h-4", isActive ? "text-things-blue" : "text-gray-400")} />
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className="text-xs text-gray-400 font-normal">{count}</span>
      )}
    </NavLink>
  );

  const SubjectSection = ({ subject, icon, label }) => {
    const isActive = currentSubject === subject;
    const count = questions.filter(q => q.subject === subject).length;
    const topics = getTopics(subject);

    return (
      <div className="mb-2">
        <NavItem 
          to={`/?subject=${subject}`} 
          icon={icon} 
          label={label} 
          count={count}
          isActive={isActive} 
        />
        {/* Nested Topics (only show if active or populated) */}
        {isActive && topics.length > 0 && (
          <div className="ml-9 border-l border-gray-200 pl-2 space-y-1 mt-1">
            {topics.map(topic => (
              <NavLink
                key={topic}
                to={`/?subject=${subject}&topic=${topic}`}
                className={({ isActive }) => clsx(
                  "block text-xs py-1 px-2 rounded hover:bg-gray-50",
                  isActive ? "text-things-blue font-medium" : "text-gray-500"
                )}
              >
                {topic}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-gray-50/50 border-r border-things-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 pt-6">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Book className="w-5 h-5 text-things-blue" />
          MockMaster
        </h1>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 space-y-6">
        {/* Core */}
        <div>
          <NavItem 
            to="/" 
            icon={Inbox} 
            label="All Questions" 
            count={questions.length}
            isActive={!currentSubject && window.location.pathname === '/'} 
          />
          <NavItem 
            to="/add" 
            icon={PlusCircle} 
            label="Add New" 
            isActive={window.location.pathname === '/add'} 
          />
        </div>

        {/* Subjects (Areas) */}
        <div>
          <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Subjects
          </div>
          <SubjectSection subject="English" label="English" icon={Book} />
          <SubjectSection subject="Maths" label="Maths" icon={Calculator} />
          <SubjectSection subject="Reasoning" label="Reasoning" icon={BrainCircuit} />
          <SubjectSection subject="GS" label="General Studies" icon={Globe} />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <NavItem 
          to="/settings" 
          icon={Settings} 
          label="Settings" 
          isActive={window.location.pathname === '/settings'} 
        />
      </div>
    </aside>
  );
}