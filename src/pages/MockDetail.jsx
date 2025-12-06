import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { db } from '../lib/db';
import { askGeminiFollowUp } from '../lib/gemini';
import Layout from '../components/Layout';

import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
} from 'lucide-react';

import clsx from 'clsx';

// Math & Markdown Imports
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Helper Component for rendering Math/Markdown
const MathText = ({ content, className, isInline = false }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className={className}
      components={{
        p: ({ children }) =>
          isInline ? (
            <span className="inline">{children}</span>
          ) : (
            <p>{children}</p>
          ),
        a: ({ ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
        ul: ({ children }) => <ul className="list-disc ml-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      }}
    >
      {content || ''}
    </ReactMarkdown>
  );
};

export default function MockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mock, setMock] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Topic Editing State
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopic, setEditedTopic] = useState('');

  // Image Carousel State
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    db.mocks.get(Number(id)).then((data) => {
      if (data) {
        if (!data.images && data.image) {
          data.images = [data.image];
        }
        setMock(data);
        setEditedTopic(data.topic || '');
      }
    });
  }, [id]);

  const handleOptionClick = (idx) => {
    if (selectedIdx !== null || showAnswer) return;
    setSelectedIdx(idx);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this question? This action cannot be undone.'
      )
    ) {
      try {
        await db.mocks.delete(Number(id));
        navigate('/');
      } catch (error) {
        console.error('Failed to delete mock:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  const handleTopicSave = async () => {
    if (!editedTopic.trim()) {
      setIsEditingTopic(false);
      setEditedTopic(mock.topic); // Revert if empty
      return;
    }

    try {
      await db.mocks.update(Number(id), { topic: editedTopic });
      setMock((prev) => ({ ...prev, topic: editedTopic }));
      setIsEditingTopic(false);
    } catch (err) {
      console.error('Failed to update topic', err);
      alert('Could not update topic');
    }
  };

  const handleAskGemini = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', parts: [{ text: chatInput }] };
    const newHistory = [...chatMessages, userMsg];

    setChatMessages(newHistory);
    setChatInput('');
    setIsChatting(true);

    const context = `
Context: The user is asking about a mock question in Subject: ${mock.subject}, Topic: ${mock.topic}.
Question: ${mock.question}
Options: ${mock.options.join(', ')}
Correct Answer: ${mock.options[mock.correctIndex]}
Explanation: ${mock.explanation}
`;

    const apiHistory = [
      {
        role: 'user',
        parts: [{ text: context }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood.' }],
      },
      ...chatMessages,
    ];

    try {
      const response = await askGeminiFollowUp(apiHistory, chatInput);
      setChatMessages([
        ...newHistory,
        { role: 'model', parts: [{ text: response }] },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  // Carousel Logic
  const nextImage = () => {
    setCurrentImgIdx((prev) => (prev + 1) % mock.images.length);
  };

  const prevImage = () => {
    setCurrentImgIdx((prev) => (prev - 1 + mock.images.length) % mock.images.length);
  };

  if (!mock) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-10 text-gray-400">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column: Image Carousel */}
        <div className="relative">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 aspect-[4/3]">
            <img
              src={mock.images[currentImgIdx]}
              alt={`Question ${currentImgIdx + 1}`}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Carousel Controls */}
          {mock.images.length > 1 && (
            <>
              <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {currentImgIdx + 1} / {mock.images.length}
              </div>

              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Right Column: Content */}
        <div className="space-y-5">
          {/* Header: Tags & Delete Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-md border border-blue-100">
                {mock.subject}
              </span>

              {/* Editable Topic Badge */}
              {isEditingTopic ? (
                <input
                  autoFocus
                  value={editedTopic}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  onBlur={handleTopicSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleTopicSave()}
                  className="w-32 px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-things-blue rounded-md focus:outline-none focus:ring-1 focus:ring-things-blue"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTopic(true)}
                  className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 hover:text-gray-800 transition"
                  title="Click to edit topic"
                >
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  {mock.topic}
                </button>
              )}
            </div>

            <button
              onClick={handleDelete}
              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
              title="Delete question"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Question */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <MathText content={mock.question} className="text-gray-800 leading-relaxed" />
          </div>

          {/* Options */}
          <div className="space-y-2">
            {mock.options.map((opt, idx) => {
              let statusClass =
                'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700';

              if (showAnswer || selectedIdx !== null) {
                if (idx === mock.correctIndex) {
                  statusClass = 'bg-green-50 border-green-500 text-green-900 shadow-sm';
                } else if (idx === selectedIdx && idx !== mock.correctIndex) {
                  statusClass = 'bg-red-50 border-red-500 text-red-900 opacity-60';
                } else {
                  statusClass = 'opacity-40 grayscale';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  className={clsx(
                    'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center group',
                    statusClass
                  )}
                >
                  <MathText content={opt} isInline />

                  {idx === mock.correctIndex &&
                    (showAnswer || selectedIdx !== null) && (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    )}

                  {idx === selectedIdx && idx !== mock.correctIndex && (
                    <XCircle className="w-5 h-5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-things-blue font-medium text-sm flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4" />
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>

          {/* Explanation */}
          {(showAnswer || selectedIdx !== null) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                Explanation
              </h3>
              <MathText
                content={mock.explanation}
                className="text-gray-700 text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Chat Interface */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                Ask Gemini for clarification...
              </p>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={clsx(
                    'p-3 rounded-lg text-sm',
                    msg.role === 'user'
                      ? 'bg-things-blue text-white ml-4'
                      : 'bg-gray-100 text-gray-800 mr-4'
                  )}
                >
                  <MathText content={msg.parts[0].text} isInline />
                </div>
              ))}
            </div>

            {isChatting && (
              <div className="text-gray-400 text-sm italic">
                Gemini is thinking...
              </div>
            )}

            <form onSubmit={handleAskGemini} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="E.g., Why is option A incorrect?"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-things-blue focus:ring-1 focus:ring-things-blue transition"
              />
              <button
                type="submit"
                disabled={isChatting || !chatInput.trim()}
                className="bg-things-blue text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
