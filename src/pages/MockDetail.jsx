import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/db';
import { askGeminiFollowUp } from '../lib/gemini';
import Layout from '../components/Layout';
import { CheckCircle2, XCircle, HelpCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function MockDetail() {
  const { id } = useParams();
  const [mock, setMock] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Image Carousel State
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    db.mocks.get(Number(id)).then(data => {
        // Migration helper: ensure images is an array
        if (data && !data.images && data.image) {
            data.images = [data.image];
        }
        setMock(data);
    });
  }, [id]);

  if (!mock) return <Layout>Loading...</Layout>;

  const handleOptionClick = (idx) => {
    if (selectedIdx !== null || showAnswer) return; 
    setSelectedIdx(idx);
  };

  const handleAskGemini = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", parts: [{ text: chatInput }] };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setIsChatting(true);

    const context = `
      Context: The user is asking about a mock question in Subject: ${mock.subject}, Topic: ${mock.topic}.
      Question: ${mock.question}
      Options: ${mock.options.join(', ')}
      Correct Answer: ${mock.options[mock.correctIndex]}
      Explanation: ${mock.explanation}
    `;
    
    const apiHistory = [{
        role: "user", parts: [{ text: context }]
    }, {
        role: "model", parts: [{ text: "Understood." }]
    }, ...chatMessages];

    try {
        const response = await askGeminiFollowUp(apiHistory, chatInput);
        setChatMessages([...newHistory, { role: "model", parts: [{ text: response }] }]);
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

  return (
    <Layout>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Image Carousel */}
        <div className="bg-white p-2 rounded-xl shadow-things border border-things-border relative group">
          <div className="aspect-[3/4] md:aspect-auto md:min-h-[500px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden relative">
            <img 
                src={mock.images[currentImgIdx]} 
                alt={`Question Part ${currentImgIdx + 1}`} 
                className="max-w-full max-h-[80vh] object-contain" 
            />
            
            {/* Carousel Controls */}
            {mock.images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100">
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentImgIdx + 1} / {mock.images.length}
                    </div>
                </>
            )}
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-things p-6 border border-things-border">
            {/* Categorization Tags */}
            <div className="flex gap-2 mb-4">
                 <span className="px-2 py-1 rounded-md bg-things-blue/10 text-things-blue text-xs font-semibold uppercase tracking-wide">
                     {mock.subject}
                 </span>
                 <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                     {mock.topic}
                 </span>
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed whitespace-pre-wrap">
                {mock.question}
            </h1>
            
            <div className="space-y-3">
              {mock.options.map((opt, idx) => {
                let statusClass = "bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700";
                
                if (showAnswer || selectedIdx !== null) {
                    if (idx === mock.correctIndex) {
                        statusClass = "bg-green-50 border-green-500 text-green-900 shadow-sm";
                    } else if (idx === selectedIdx && idx !== mock.correctIndex) {
                        statusClass = "bg-red-50 border-red-500 text-red-900 opacity-60";
                    } else {
                        statusClass = "opacity-40 grayscale";
                    }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    className={clsx(
                      "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center group",
                      statusClass
                    )}
                  >
                    <span className="font-medium">{opt}</span>
                    {idx === mock.correctIndex && (showAnswer || selectedIdx !== null) && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {idx === selectedIdx && idx !== mock.correctIndex && <XCircle className="w-5 h-5 text-red-600" />}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
               <button 
                 onClick={() => setShowAnswer(!showAnswer)}
                 className="text-things-blue font-medium text-sm flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
               >
                 <HelpCircle className="w-4 h-4" />
                 {showAnswer ? "Hide Answer" : "Show Answer"}
               </button>
            </div>

            {/* Explanation */}
            {(showAnswer || selectedIdx !== null) && (
                <div className="mt-4 bg-yellow-50 p-5 rounded-lg text-yellow-900 text-sm leading-relaxed border border-yellow-200/60 animate-fade-in">
                    <span className="font-bold flex items-center gap-2 mb-2 text-yellow-700 uppercase tracking-wide text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        Explanation
                    </span>
                    <p className="whitespace-pre-wrap text-gray-800">{mock.explanation}</p>
                </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="bg-white rounded-xl shadow-things p-4 border border-things-border flex flex-col h-96">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                         <HelpCircle className="w-8 h-8 mb-2" />
                         <p className="text-sm">Ask Gemini for clarification...</p>
                    </div>
                )}
                {chatMessages.map((msg, i) => (
                    <div key={i} className={clsx(
                        "p-3 rounded-lg text-sm max-w-[85%]",
                        msg.role === 'user' ? "bg-things-blue text-white ml-auto rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                        {msg.parts[0].text}
                    </div>
                ))}
                {isChatting && <div className="text-xs text-gray-400 ml-2 animate-pulse">Gemini is thinking...</div>}
            </div>
            <form onSubmit={handleAskGemini} className="flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="E.g., Why is option A incorrect?"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-things-blue focus:ring-1 focus:ring-things-blue transition"
                />
                <button type="submit" className="bg-things-blue text-white p-2 rounded-lg hover:bg-blue-600 transition shadow-sm">
                    <Send className="w-4 h-4" />
                </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}