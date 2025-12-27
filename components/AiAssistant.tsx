import React, { useState, useRef, useEffect } from 'react';
import { SchemaData, ChatMessage } from '../types';
import { analyzeSchema } from '../services/geminiService';
import { Sparkles, Send, Loader2, MessageSquare } from 'lucide-react';

interface AiAssistantProps {
  schema: SchemaData;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ schema }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !schema.tables.length) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await analyzeSchema(schema, input);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Something went wrong.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  }

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-30 flex items-center gap-2 group"
          >
            <Sparkles className="animate-pulse" size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Ask Gemini</span>
          </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-purple-900 to-indigo-900 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
                <Sparkles size={16} className="text-yellow-300" />
                <h3 className="font-semibold text-sm">Schema AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white text-xs bg-black/20 px-2 py-1 rounded">
                Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
             {messages.length === 0 && (
                 <div className="text-center mt-10 text-slate-500">
                     <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                     <p className="text-sm">Ask me about your schema relationships, optimizations, or business logic.</p>
                 </div>
             )}
             {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                         m.role === 'user' 
                         ? 'bg-indigo-600 text-white rounded-br-none' 
                         : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700 prose prose-invert prose-sm'
                     }`}>
                         {m.role === 'model' ? (
                             <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                         ) : m.text}
                     </div>
                 </div>
             ))}
             {loading && (
                 <div className="flex justify-start">
                     <div className="bg-slate-800 rounded-lg p-3 rounded-bl-none flex items-center gap-2">
                         <Loader2 size={16} className="animate-spin text-indigo-400" />
                         <span className="text-xs text-slate-400">Thinking...</span>
                     </div>
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: How are users and orders related?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white p-2 rounded-md transition-colors"
              >
                  <Send size={16} />
              </button>
          </div>
        </div>
      )}
    </>
  );
};