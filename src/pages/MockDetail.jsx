import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/db';
import { askGeminiFollowUp } from '../lib/gemini';
import Layout from '../components/Layout';
import { CheckCircle2, XCircle, HelpCircle, Send } from 'lucide-react';
import clsx from 'clsx';

export default function MockDetail() {
  const { id } = useParams();
  const [mock, setMock] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    db.mocks.get(Number(id)).then(setMock);
  }, [id]);

  if (!mock) return <Layout>Loading...</Layout>;

  const handleOptionClick = (idx) => {
    if (selectedIdx !== null || showAnswer) return; // Prevent changing after selection
    setSelectedIdx(idx);
    if (idx !== mock.correctIndex) {
        // Optional: Auto show explanation on wrong answer? 
        // For now, let's keep it manual or implicit
    }
  };

  const handleAskGemini = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", parts: [{ text: chatInput }] };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setIsChatting(true);

    // Context for Gemini
    const context = `
      Context: The user is asking about a mock question.
      Question: ${mock.question}
      Options: ${mock.options.join(', ')}
      Correct Answer: ${mock.options[mock.correctIndex]}
      Explanation: ${mock.explanation}
    `;
    
    // Construct history for API (API expects 'model' role, we store 'model' locally)
    const apiHistory = [{
        role: "user",
        parts: [{ text: context }]
    }, {
        role: "model",
        parts: [{ text: "Understood. I am ready to help with this question." }]
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

  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Image */}
        <div className="bg-white p-2 rounded-xl shadow-things border border-things-border">
          <img src={mock.image} alt="Question" className="w-full rounded-lg" />
        </div>

        {/* Right Column: Interactive Quiz */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-things p-6 border border-things-border">
            <h1 className="text-xl font-bold text-gray-800 mb-4">{mock.question}</h1>
            
            <div className="space-y-3">
              {mock.options.map((opt, idx) => {
                let statusClass = "bg-gray-50 border-transparent hover:bg-gray-100";
                
                // Logic for coloring
                if (showAnswer || selectedIdx !== null) {
                    if (idx === mock.correctIndex) {
                        statusClass = "bg-green-50 border-green-500 text-green-900";
                    } else if (idx === selectedIdx && idx !== mock.correctIndex) {
                        statusClass = "bg-red-50 border-red-500 text-red-900";
                    } else {
                        statusClass = "opacity-50";
                    }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    className={clsx(
                      "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center",
                      statusClass
                    )}
                  >
                    <span>{opt}</span>
                    {idx === mock.correctIndex && (showAnswer || selectedIdx !== null) && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {idx === selectedIdx && idx !== mock.correctIndex && <XCircle className="w-5 h-5 text-red-600" />}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
               <button 
                 onClick={() => setShowAnswer(!showAnswer)}
                 className="text-things-blue font-medium text-sm flex items-center gap-1 hover:underline"
               >
                 <HelpCircle className="w-4 h-4" />
                 {showAnswer ? "Hide Answer" : "Show Answer"}
               </button>
            </div>

            {/* Explanation Section */}
            {(showAnswer || selectedIdx !== null) && (
                <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-yellow-900 text-sm leading-relaxed border border-yellow-100 animate-fade-in">
                    <span className="font-bold block mb-1">Explanation:</span>
                    {mock.explanation}
                </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="bg-white rounded-xl shadow-things p-4 border border-things-border flex flex-col h-80">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
                {chatMessages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm mt-10">Ask Gemini regarding this question...</p>
                )}
                {chatMessages.map((msg, i) => (
                    <div key={i} className={clsx(
                        "p-3 rounded-lg text-sm max-w-[85%]",
                        msg.role === 'user' ? "bg-things-blue text-white ml-auto" : "bg-gray-100 text-gray-800"
                    )}>
                        {msg.parts[0].text}
                    </div>
                ))}
                {isChatting && <div className="text-xs text-gray-400 ml-2">Gemini is typing...</div>}
            </div>
            <form onSubmit={handleAskGemini} className="flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Why is option C wrong?"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-things-blue transition"
                />
                <button type="submit" className="bg-things-blue text-white p-2 rounded-lg hover:bg-blue-600 transition">
                    <Send className="w-4 h-4" />
                </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}