import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import Layout from '../components/Layout';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Timer, ChevronRight, ChevronLeft, AlertCircle, 
  CheckCircle2, Bookmark, Save, Send, LayoutGrid, X 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import clsx from 'clsx';
import Button from './Button';

// --- Helper Components ---

const MathText = ({ content, className }) => (
  <ReactMarkdown
    className={clsx("markdown-content", className)}
    remarkPlugins={[remarkMath]}
    rehypePlugins={[rehypeKatex]}
    components={{
      p: ({ children }) => <span className="inline">{children}</span>,
      div: ({ children }) => <div className="mb-2">{children}</div>,
    }}
  >
    {content || ""}
  </ReactMarkdown>
);

const QuestionPalette = ({ count, statuses, current, onJump }) => (
  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-1">
    {Array.from({ length: count }).map((_, i) => {
      let colorClass = "bg-gray-200 text-gray-600 border-gray-300"; // Default: Not Visited
      
      const s = statuses[i] || 'not_visited';
      if (s === 'not_answered') colorClass = "bg-red-500 text-white border-red-600";
      else if (s === 'answered') colorClass = "bg-green-500 text-white border-green-600";
      else if (s === 'marked') colorClass = "bg-blue-500 text-white border-blue-600";
      else if (s === 'marked_answered') colorClass = "bg-purple-500 text-white border-purple-600";
      
      return (
        <button
          key={i}
          onClick={() => onJump(i)}
          className={clsx(
            "h-9 w-9 text-xs font-bold rounded-md border flex items-center justify-center transition-all",
            colorClass,
            current === i && "ring-2 ring-offset-2 ring-black"
          )}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);

// --- Main Component ---

export default function TakeQuiz() {
  // State: 'setup' | 'quiz' | 'result'
  const [phase, setPhase] = useState('setup');
  
  // Setup State
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  
  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({}); // { [idx]: { selectedOption: number | null, status: string } }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Fetch available subjects on load
  useEffect(() => {
    db.mocks.toArray().then(all => {
      const subs = [...new Set(all.map(q => q.subject))];
      setAvailableSubjects(subs);
      if (subs.length > 0) setSubject(subs[0]);
    });
  }, []);

  // Timer Logic
  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, phase]);

  // Mark current question as visited/red if untouched
  useEffect(() => {
    if (phase === 'quiz' && questions.length > 0) {
      setResponses(prev => {
        const currentStatus = prev[currentIdx]?.status;
        if (!currentStatus || currentStatus === 'not_visited') {
           return {
             ...prev,
             [currentIdx]: { 
                selectedOption: prev[currentIdx]?.selectedOption ?? null, 
                status: 'not_answered' 
             }
           };
        }
        return prev;
      });
    }
  }, [currentIdx, phase]);

  const startQuiz = async () => {
    let qQuery = db.mocks.orderBy('createdAt');
    let allQs = await qQuery.toArray();
    
    // Filter by subject
    if (subject !== 'All') {
        allQs = allQs.filter(q => q.subject === subject);
    }
    
    // Shuffle
    const shuffled = allQs.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, questionCount);
    
    if (selected.length === 0) {
        alert("No questions available for this selection.");
        return;
    }

    setQuestions(selected);
    setTimeLeft(selected.length * 60); // 1 minute per question
    setCurrentIdx(0);
    setResponses({});
    setPhase('quiz');
  };

  const updateStatus = (idx, type) => {
    setResponses(prev => {
      const current = prev[idx] || { selectedOption: null };
      const hasAnswer = current.selectedOption !== null && current.selectedOption !== undefined;
      
      let newStatus = current.status;
      
      if (type === 'save') {
        newStatus = hasAnswer ? 'answered' : 'not_answered';
      } else if (type === 'mark') {
        newStatus = hasAnswer ? 'marked_answered' : 'marked';
      } else if (type === 'clear') {
         // Resetting answer also resets status to not_answered
         return {
             ...prev,
             [idx]: { selectedOption: null, status: 'not_answered' }
         };
      }

      return {
        ...prev,
        [idx]: { ...current, status: newStatus }
      };
    });
  };

  const handleOptionSelect = (optIdx) => {
    setResponses(prev => ({
      ...prev,
      [currentIdx]: { ...prev[currentIdx], selectedOption: optIdx }
    }));
  };

  const handleSaveNext = () => {
    updateStatus(currentIdx, 'save');
    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
  };

  const handleMarkReview = () => {
    updateStatus(currentIdx, 'mark');
    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
  };

  const handleClear = () => {
    updateStatus(currentIdx, 'clear');
  };

  const handleSubmit = () => {
    setPhase('result');
  };

  // Helper to format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Renderers ---

  if (phase === 'setup') {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-8 md:mt-16 bg-white p-8 rounded-2xl shadow-things border border-things-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-things-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Timer className="w-8 h-8 text-things-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Start Mock Test</h1>
            <p className="text-gray-500 mt-2">Test your knowledge with time pressure.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-things-blue outline-none"
              >
                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-things-blue outline-none"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
               <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
               <div className="text-sm text-blue-800 space-y-1">
                 <p><span className="font-semibold">Duration:</span> {questionCount} Minutes</p>
                 <p><span className="font-semibold">Scoring:</span> +2 for Correct, -0.25 for Wrong</p>
               </div>
            </div>

            <Button onClick={startQuiz} className="w-full py-3 text-lg" disabled={availableSubjects.length === 0}>
               Start Quiz
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'quiz') {
    const currentQ = questions[currentIdx];
    const userRes = responses[currentIdx] || {};
    
    // Derived status map for palette
    const statusMap = Object.keys(responses).reduce((acc, key) => {
        acc[key] = responses[key].status;
        return acc;
    }, {});

    return (
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 z-10">
           <h2 className="font-bold text-gray-800 truncate pr-4">
             {subject} Test <span className="text-gray-400 font-normal ml-2 text-sm hidden sm:inline">({currentIdx + 1}/{questions.length})</span>
           </h2>
           <div className="flex items-center gap-4">
             <div className={clsx(
               "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-medium",
               timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"
             )}>
               <Timer className="w-4 h-4" />
               {formatTime(timeLeft)}
             </div>
             <button 
                onClick={handleSubmit}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition hidden sm:block"
             >
               Submit Test
             </button>
             <button onClick={() => setIsDrawerOpen(true)} className="sm:hidden p-2 bg-gray-100 rounded-lg">
               <LayoutGrid className="w-5 h-5 text-gray-600" />
             </button>
           </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
           {/* Question Area */}
           <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
              <div className="max-w-3xl mx-auto">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-start gap-4">
                       <span className="bg-things-blue/10 text-things-blue font-bold px-3 py-1 rounded-lg text-sm h-fit">
                         Q.{currentIdx + 1}
                       </span>
                       <div className="text-lg font-medium text-gray-800 leading-relaxed pt-1 w-full">
                          <MathText content={currentQ.question} />
                       </div>
                    </div>
                    
                    {currentQ.images && currentQ.images.length > 0 && (
                        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                            {currentQ.images.map((img, i) => (
                                <img key={i} src={img} alt="" className="h-48 rounded-lg border object-contain" />
                            ))}
                        </div>
                    )}
                 </div>

                 <div className="space-y-3">
                    {currentQ.options.map((opt, i) => (
                       <button
                         key={i}
                         onClick={() => handleOptionSelect(i)}
                         className={clsx(
                           "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 group",
                           userRes.selectedOption === i 
                             ? "border-things-blue bg-blue-50/50 shadow-sm" 
                             : "border-gray-200 hover:border-gray-300 hover:bg-white bg-white"
                         )}
                       >
                          <div className={clsx(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                              userRes.selectedOption === i 
                                ? "border-things-blue bg-things-blue text-white" 
                                : "border-gray-300 text-gray-400 group-hover:border-gray-400"
                          )}>
                             {String.fromCharCode(65 + i)}
                          </div>
                          <div className="text-gray-700 font-medium">
                             <MathText content={opt} />
                          </div>
                       </button>
                    ))}
                 </div>
              </div>
           </main>

           {/* Desktop Sidebar (Right) */}
           <aside className="hidden lg:flex w-80 flex-col border-l bg-white">
              <div className="p-4 border-b">
                 <h3 className="font-bold text-gray-800">Question Palette</h3>
                 <div className="flex flex-wrap gap-2 mt-4 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Answered</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Not Answered</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded-sm"></span> Not Visited</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm"></span> Marked & Ans</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Marked</div>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                 <QuestionPalette count={questions.length} statuses={statusMap} current={currentIdx} onJump={setCurrentIdx} />
              </div>
           </aside>
        </div>

        {/* Mobile Drawer */}
        {isDrawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col animate-fade-in-right">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold">Question Palette</h3>
                        <button onClick={() => setIsDrawerOpen(false)}><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        <QuestionPalette count={questions.length} statuses={statusMap} current={currentIdx} onJump={(i) => { setCurrentIdx(i); setIsDrawerOpen(false); }} />
                    </div>
                </div>
            </div>
        )}

        {/* Bottom Bar */}
        <div className="bg-white border-t p-3 md:p-4 flex items-center justify-between shrink-0 gap-2 overflow-x-auto safe-area-bottom">
           <div className="flex gap-2">
              <button 
                onClick={handleMarkReview}
                className="px-4 py-2 rounded-lg border border-purple-200 text-purple-700 font-medium hover:bg-purple-50 text-sm whitespace-nowrap"
              >
                Mark for Review
              </button>
              <button 
                onClick={handleClear}
                className="px-4 py-2 rounded-lg text-gray-500 font-medium hover:bg-gray-100 text-sm whitespace-nowrap"
              >
                Clear Response
              </button>
           </div>
           
           <button 
             onClick={handleSaveNext}
             className="bg-things-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 shadow-md text-sm whitespace-nowrap"
           >
             Save & Next
           </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
     let correct = 0;
     let wrong = 0;
     let skipped = 0;
     let score = 0;

     questions.forEach((q, i) => {
        const res = responses[i];
        if (res && res.selectedOption !== null && res.selectedOption !== undefined) {
            if (res.selectedOption === q.correctIndex) correct++;
            else wrong++;
        } else {
            skipped++;
        }
     });

     score = (correct * 2) - (wrong * 0.25);

     return (
       <Layout>
         <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Test Results</h1>
            
            {/* Scorecard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
                  <div className="text-4xl font-bold text-gray-800 mb-1">{score}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Score</div>
               </div>
               <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">{correct}</div>
                  <div className="text-xs font-bold text-green-700/60 uppercase tracking-wider">Correct</div>
               </div>
               <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
                  <div className="text-4xl font-bold text-red-600 mb-1">{wrong}</div>
                  <div className="text-xs font-bold text-red-700/60 uppercase tracking-wider">Wrong</div>
               </div>
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col items-center">
                  <div className="text-4xl font-bold text-gray-600 mb-1">{skipped}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skipped</div>
               </div>
            </div>

            {/* Analysis List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-6 border-b bg-gray-50">
                   <h2 className="font-bold text-gray-800">Detailed Analysis</h2>
               </div>
               <div className="divide-y divide-gray-100">
                  {questions.map((q, i) => {
                     const userOpt = responses[i]?.selectedOption;
                     const isCorrect = userOpt === q.correctIndex;
                     const isSkipped = userOpt === null || userOpt === undefined;

                     return (
                        <div key={i} className="p-6">
                           <div className="flex gap-3 mb-4">
                              <span className={clsx(
                                  "w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                                  isSkipped ? "bg-gray-200 text-gray-600" : (isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
                              )}>
                                 {i + 1}
                              </span>
                              <div className="flex-1 font-medium text-gray-800">
                                 <MathText content={q.question} />
                              </div>
                           </div>

                           <div className="pl-9 space-y-2">
                              {q.options.map((opt, optIdx) => {
                                 const isSelected = userOpt === optIdx;
                                 const isRealCorrect = q.correctIndex === optIdx;

                                 let style = "bg-white border-gray-200 text-gray-500 opacity-60";
                                 if (isRealCorrect) style = "bg-green-50 border-green-500 text-green-800 font-medium";
                                 else if (isSelected && !isRealCorrect) style = "bg-red-50 border-red-500 text-red-800";

                                 return (
                                     <div key={optIdx} className={clsx("p-3 rounded-lg border text-sm flex justify-between", style)}>
                                        <MathText content={opt} />
                                        {isRealCorrect && <CheckCircle2 className="w-4 h-4" />}
                                        {isSelected && !isRealCorrect && <X className="w-4 h-4" />}
                                     </div>
                                 )
                              })}
                           </div>
                           
                           <div className="mt-4 pl-9">
                              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-900">
                                 <span className="font-bold text-xs uppercase tracking-wide block mb-1 text-yellow-700">Explanation</span>
                                 <MathText content={q.explanation} />
                              </div>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>
            
            <div className="flex justify-center pb-12">
                <Button onClick={() => setPhase('setup')} variant="secondary">
                   Take Another Test
                </Button>
            </div>
         </div>
       </Layout>
     );
  }

  return <div>Loading...</div>;
}