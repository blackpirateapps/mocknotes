import React, { useState, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams, Link } from 'react-router-dom';

import { db } from '../lib/db';
import Layout from '../components/Layout';

import {
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';

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
        span: ({ children }) => <span className="inline">{children}</span>,
      }}
    >
      {content || ''}
    </ReactMarkdown>
  );
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const topicFilter = searchParams.get('topic');

  // --- Search & Sort ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); 

  // --- Virtualization State ---
  const [displayLimit, setDisplayLimit] = useState(20);

  // Reset limit when filters change
  useEffect(() => {
    setDisplayLimit(20);
  }, [subjectFilter, topicFilter, searchQuery, sortOrder]);

  const data = useLiveQuery(
    async () => {
      let collection = db.mocks.orderBy('createdAt').reverse();
      let allItems = await collection.toArray();

      if (subjectFilter) {
        allItems = allItems.filter((i) => i.subject === subjectFilter);
      }

      if (topicFilter) {
        allItems = allItems.filter((i) => i.topic === topicFilter);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        allItems = allItems.filter((i) => {
          const question = (i.question || '').toLowerCase();
          const topic = (i.topic || '').toLowerCase();
          return question.includes(q) || topic.includes(q);
        });
      }

      if (sortOrder === 'asc') {
        allItems = allItems.slice().reverse();
      }

      return {
        items: allItems.slice(0, displayLimit),
        total: allItems.length,
      };
    },
    [subjectFilter, topicFilter, displayLimit, searchQuery, sortOrder]
  );

  const mocks = data?.items || [];
  const totalCount = data?.total || 0;
  const hasMore = mocks.length < totalCount;

  const loadMore = () => {
    if (hasMore) {
      setDisplayLimit((prev) => prev + 20);
    }
  };

  const getBadgeColor = (subj) => {
    switch (subj) {
      case 'English': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Maths': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Reasoning': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'GS': return 'bg-green-50 text-green-700 border-green-100';
      case 'Processing': return 'bg-gray-50 text-gray-500 animate-pulse';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">
          {subjectFilter ? `${subjectFilter} Inbox` : 'Inbox'}
        </h1>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {topicFilter && (
            <div className="flex items-center gap-1">
              <span>Topic</span>
              <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                {topicFilter}
              </span>
            </div>
          )}
          <div className="text-xs text-gray-400">
            {totalCount} question{totalCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or topics..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-things-blue/60 focus:border-things-blue/60"
            />
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Sort by</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-things-blue/60 focus:border-things-blue/60"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>
      </header>

      {mocks.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-300 mx-1">
          <p>No questions found{subjectFilter ? ` for ${subjectFilter}` : ''}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm md:shadow-things border border-gray-200 md:border-things-border overflow-hidden w-full">
          <Virtuoso
            useWindowScroll
            data={mocks}
            endReached={loadMore}
            increaseViewportBy={300}
            itemContent={(index, mock) => {
              const displayImage = Array.isArray(mock.images) ? mock.images[0] : mock.image;
              const dateStr = new Date(mock.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const isProcessing = mock.status === 'processing';
              const isError = mock.status === 'error';

              return (
                <Link
                  key={mock.id}
                  to={`/mock/${mock.id}`}
                  className={clsx(
                    'flex items-start md:items-center w-full gap-3 p-3 md:p-4 transition group relative overflow-hidden active:bg-gray-50',
                    index !== mocks.length - 1 && 'border-b border-gray-100',
                    isProcessing && 'cursor-wait bg-gray-50/50'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative mt-0.5 md:mt-0">
                    {displayImage && (
                      <img src={displayImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
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
                        'font-medium text-[15px] leading-snug w-full line-clamp-2 md:truncate',
                        isProcessing ? 'text-gray-500 italic' : 'text-gray-900',
                        isError && 'text-red-500'
                      )}>
                        {isProcessing ? mock.question : <MathPreview content={mock.question} />}
                      </h3>
                      <span className="text-[10px] md:text-xs text-gray-400 font-medium whitespace-nowrap pt-0.5">
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-1.5 text-xs max-w-full">
                      <span className={clsx('px-2 py-0.5 rounded border font-medium shrink-0 text-[11px]', getBadgeColor(mock.subject))}>
                        {mock.subject}
                      </span>

                      {!isProcessing && !isError && (
                        <span className="text-gray-400 flex items-center gap-1 truncate max-w-[120px] md:max-w-none">
                          <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                          <span className="truncate">{mock.topic}</span>
                        </span>
                      )}

                      {isError && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Failed to process
                        </span>
                      )}

                      {!isProcessing && !isError && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {!isProcessing && (
                    <div className="shrink-0 hidden md:flex items-center">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                    </div>
                  )}
                </Link>
              );
            }}
            components={{
              Footer: () => (
                <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex justify-center items-center text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {hasMore ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-things-blue" />
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 opacity-60">
                      <span>No more questions</span>
                    </div>
                  )}
                </div>
              )
            }}
          />
        </div>
      )}
    </Layout>
  );
}