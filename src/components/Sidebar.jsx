import React from 'react';
import { NavLink, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { 
  Inbox, Book, Calculator, BrainCircuit, Globe, 
  Settings, PlusCircle, Plus, Timer
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ onCloseMobile }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const currentSubject = searchParams.get('subject');

  const questions = useLiveQuery(() => db.mocks.toArray()) || [];
  
  const getTopics = (subj) => {
    const relevant = questions.filter(q => q.subject === subj);
    return [...new Set(relevant.map(q => q.topic))];
  };

  const NavItem = ({ to, icon: Icon, label, count, isActive }) => (
    <NavLink 
      to={to} 
      onClick={onCloseMobile}
      className={clsx(
        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
        isActive 
          ? "bg-things-blue/10 text-things-blue" 
          : "text-gray-600 hover:bg-gray-100 active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={clsx("w-5 h-5", isActive ? "text-things-blue" : "text-gray-400")} />
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
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
        {isActive && topics.length > 0 && (
          <div className="ml-11 border-l border-gray-200 pl-3 space-y-1 mt-1 mb-3">
            {topics.map(topic => (
              <NavLink
                key={topic}
                to={`/?subject=${subject}&topic=${topic}`}
                onClick={onCloseMobile}
                className={({ isActive }) => clsx(
                  "block text-sm py-1.5 px-2 rounded hover:bg-gray-50",
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
    <aside className="w-full h-full bg-gray-50/80 backdrop-blur-xl md:bg-gray-50/50 flex flex-col border-r border-things-border">
      {/* Header */}
      <div className="p-4 pt-6 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Book className="w-6 h-6 text-things-blue" />
          MockMaster
        </h1>
        <Link 
          to="/add" 
          onClick={onCloseMobile}
          className="p-1.5 rounded-md text-gray-400 hover:text-things-blue hover:bg-white hover:shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Main Nav - Scrollable Area */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 py-2">
        <div>
          <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Menu
          </div>
          <NavItem 
            to="/" 
            icon={Inbox} 
            label="All Questions" 
            count={questions.length}
            isActive={!currentSubject && location.pathname === '/'} 
          />
          <NavItem 
            to="/take-quiz" 
            icon={Timer} 
            label="Take Quiz" 
            isActive={location.pathname === '/take-quiz'} 
          />
          <NavItem 
            to="/add" 
            icon={PlusCircle} 
            label="Add New" 
            isActive={location.pathname === '/add'} 
          />
        </div>

        <div>
          <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Subjects
          </div>
          <SubjectSection subject="English" label="English" icon={Book} />
          <SubjectSection subject="Maths" label="Maths" icon={Calculator} />
          <SubjectSection subject="Reasoning" label="Reasoning" icon={BrainCircuit} />
          <SubjectSection subject="GS" label="General Studies" icon={Globe} />
        </div>
      </nav>

      {/* Footer - Pinned to bottom */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50 shrink-0 pb-safe">
        <NavItem 
          to="/settings" 
          icon={Settings} 
          label="Settings" 
          isActive={location.pathname === '/settings'} 
        />
      </div>
    </aside>
  );
}