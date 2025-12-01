import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import Layout from '../components/Layout';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const topicFilter = searchParams.get('topic');

  const mocks = useLiveQuery(async () => {
    let collection = db.mocks.orderBy('createdAt').reverse();
    let items = await collection.toArray();
    
    if (subjectFilter) items = items.filter(i => i.subject === subjectFilter);
    if (topicFilter) items = items.filter(i => i.topic === topicFilter);
    return items;
  }, [subjectFilter, topicFilter]);

  if (!mocks) return <Layout>Loading...</Layout>;

  const getBadgeColor = (subj) => {
    switch(subj) {
      case 'English': return 'bg-orange-100 text-orange-700';
      case 'Maths': return 'bg-blue-100 text-blue-700';
      case 'Reasoning': return 'bg-purple-100 text-purple-700';
      case 'GS': return 'bg-green-100 text-green-700';
      case 'Processing': return 'bg-gray-100 text-gray-500 animate-pulse';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Layout>
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">
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
             const displayImage = Array.isArray(mock.images) ? mock.images[0] : mock.image;
             const dateStr = new Date(mock.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
             const isProcessing = mock.status === 'processing';
             const isError = mock.status === 'error';

             return (
              <Link 
                key={mock.id} 
                to={isProcessing ? '#' : `/mock/${mock.id}`}
                className={clsx(
                  "flex items-center gap-3 md:gap-4 p-4 transition group",
                  i !== mocks.length - 1 && "border-b border-gray-100",
                  isProcessing ? "cursor-wait bg-gray-50/50" : "hover:bg-gray-50 cursor-pointer"
                )}
                // Prevent horizontal scroll by ensuring max-width is strictly respected
                style={{ maxWidth: '100%' }}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                  <img src={displayImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {isError && (
                    <div className="absolute inset-0 bg-red-100/80 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>

                {/* Content - "min-w-0" is crucial for text truncation in flex items */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className={clsx(
                      "font-medium truncate pr-2 text-[15px] leading-snug",
                      isProcessing ? "text-gray-500 italic" : "text-gray-900",
                      isError ? "text-red-500" : ""
                  )}>
                    {mock.question}
                  </h3>
                  
                  <div className="flex items-center gap-2 md:gap-3 mt-1.5 text-xs overflow-hidden">
                    <span className={clsx("px-2 py-0.5 rounded-full font-medium shrink-0", getBadgeColor(mock.subject))}>
                      {mock.subject}
                    </span>
                    {!isProcessing && !isError && (
                        <span className="text-gray-400 flex items-center gap-1 truncate">
                        <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                        <span className="truncate">{mock.topic}</span>
                        </span>
                    )}
                  </div>
                </div>

                {/* Right Meta */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0 pl-1">
                  <span className="text-xs text-gray-400 font-medium hidden xs:block">{dateStr}</span>
                  {!isProcessing && (
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                  )}
                </div>
              </Link>
             );
          })}
        </div>
      )}
    </Layout>
  );
}