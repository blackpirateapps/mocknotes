import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import Layout from '../components/Layout';
import { Calendar, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const topicFilter = searchParams.get('topic');

  // Query logic handles filtering
  const mocks = useLiveQuery(async () => {
    let collection = db.mocks.orderBy('createdAt').reverse();
    
    let items = await collection.toArray();
    
    if (subjectFilter) {
      items = items.filter(i => i.subject === subjectFilter);
    }
    if (topicFilter) {
      items = items.filter(i => i.topic === topicFilter);
    }
    return items;
  }, [subjectFilter, topicFilter]);

  if (!mocks) return <Layout>Loading...</Layout>;

  // Subject Badge Colors
  const getBadgeColor = (subj) => {
    switch(subj) {
      case 'English': return 'bg-orange-100 text-orange-700';
      case 'Maths': return 'bg-blue-100 text-blue-700';
      case 'Reasoning': return 'bg-purple-100 text-purple-700';
      case 'GS': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {subjectFilter || 'Inbox'}
        </h1>
        {topicFilter && (
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <span>Topic:</span>
                <span className="font-medium text-gray-700">{topicFilter}</span>
            </div>
        )}
      </header>

      {mocks.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p>No questions found{subjectFilter ? ` for ${subjectFilter}` : ''}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-things border border-things-border overflow-hidden">
          {mocks.map((mock, i) => {
             // Handle legacy data where image might be string or new array
             const displayImage = Array.isArray(mock.images) ? mock.images[0] : mock.image;
             const dateStr = new Date(mock.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

             return (
              <Link 
                key={mock.id} 
                to={`/mock/${mock.id}`}
                className={clsx(
                  "flex items-center gap-4 p-4 hover:bg-gray-50 transition group",
                  i !== mocks.length - 1 && "border-b border-gray-100"
                )}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                  <img src={displayImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium truncate pr-4 text-[15px] leading-snug">
                    {mock.question}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className={clsx("px-2 py-0.5 rounded-full font-medium", getBadgeColor(mock.subject))}>
                      {mock.subject}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                       {mock.topic}
                    </span>
                  </div>
                </div>

                {/* Right Meta */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-gray-400 font-medium">{dateStr}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                </div>
              </Link>
             );
          })}
        </div>
      )}
    </Layout>
  );
}