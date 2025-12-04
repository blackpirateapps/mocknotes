import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import Layout from '../components/Layout';
import { ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

// Math & Markdown Imports
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Lightweight component for rendering math in previews
const MathPreview = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span className="inline">{children}</span>,
        div: ({ children }) => <span className="inline">{children}</span>,
        span: ({ children }) => <span className="inline">{children}</span>
      }}
    >
      {content || ""}
    </ReactMarkdown>
  );
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const topicFilter = searchParams.get('topic');

  // --- Infinite Scroll State ---
  const [displayLimit, setDisplayLimit] = useState(20);
  const observerTarget = useRef(null);

  // Reset limit when filters change
  useEffect(() => {
    setDisplayLimit(20);
  }, [subjectFilter, topicFilter]);

  // Unified Query: Gets both the slice and the total count to ensure sync
  const data = useLiveQuery(async () => {
    let collection = db.mocks.orderBy('createdAt').reverse();
    let allItems = await collection.toArray();
    
    // Filter
    if (subjectFilter) allItems = allItems.filter(i => i.subject === subjectFilter);
    if (topicFilter) allItems = allItems.filter(i => i.topic === topicFilter);
    
    return {
        items: allItems.slice(0, displayLimit),
        total: allItems.length
    };
  }, [subjectFilter, topicFilter, displayLimit]);

  const mocks = data?.items || [];
  const totalCount = data?.total || 0;
  const hasMore = mocks.length < totalCount;

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
            setDisplayLimit((prev) => prev + 20);
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the loader is visible
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasMore]); // Re-run if hasMore changes

  const getBadgeColor = (subj) => {
    switch(subj) {
      case 'English': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Maths': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Reasoning': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'GS': return 'bg-green-50 text-green-700 border-green-100';
      case 'Processing': return 'bg-gray-50 text-gray-500 animate-pulse';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (!data) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">
          {subjectFilter || 'Inbox'}
        </h1>
        {topicFilter && (
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <span>Topic:</span>
                <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{topicFilter}</span>
            </div>
        )}
      </header>

      {mocks.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-300 mx-1">
          <p>No questions found{subjectFilter ? ` for ${subjectFilter}` : ''}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm md:shadow-things border border-gray-200 md:border-things-border overflow-hidden w-full">
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
                  "flex items-start md:items-center w-full gap-3 p-3 md:p-4 transition group relative overflow-hidden active:bg-gray-50",
                  // Only add border if it's NOT the last item in the CURRENT view
                  i !== mocks.length - 1 && "border-b border-gray-100",
                  isProcessing ? "cursor-wait bg-gray-50/50" : "hover:bg-gray-50 cursor-pointer"
                )}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative mt-0.5 md:mt-0">
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

                {/* Content */}
                <div className="flex-1 min-w-0 pr-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={clsx(
                        "font-medium text-[15px] leading-snug w-full",
                        "line-clamp-2 md:truncate",
                        isProcessing ? "text-gray-500 italic" : "text-gray-900",
                        isError ? "text-red-500" : ""
                    )}>
                      {isProcessing ? mock.question : <MathPreview content={mock.question} />}
                    </h3>
                    
                    <span className="text-[10px] md:text-xs text-gray-400 font-medium whitespace-nowrap pt-0.5">
                        {dateStr}
                    </span>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-2 mt-1.5 text-xs max-w-full">
                    <span className={clsx("px-2 py-0.5 rounded border font-medium shrink-0 text-[11px]", getBadgeColor(mock.subject))}>
                      {mock.subject}
                    </span>
                    {!isProcessing && !isError && (
                        <span className="text-gray-400 flex items-center gap-1 truncate max-w-[120px] md:max-w-none">
                            <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                            <span className="truncate">{mock.topic}</span>
                        </span>
                    )}
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="shrink-0 hidden md:flex items-center">
                  {!isProcessing && (
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                  )}
                </div>
              </Link>
             );
          })}
          
          {/* Footer Area: Loader or "No more posts" */}
          <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex justify-center items-center text-xs text-gray-400 font-medium uppercase tracking-wide">
             {hasMore ? (
                <div ref={observerTarget} className="flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin text-things-blue" />
                   <span>Loading more...</span>
                </div>
             ) : (
                <div className="flex items-center gap-2 opacity-60">
                   <span>No more posts</span>
                </div>
             )}
          </div>
        </div>
      )}
    </Layout>
  );
}