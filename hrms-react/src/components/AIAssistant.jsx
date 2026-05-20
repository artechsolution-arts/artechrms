import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { X, Send, Sparkles, RotateCcw } from 'lucide-react';

const QUICK = [
  'What is the leave policy?',
  'How do I process payroll?',
  'Show pending leave summary',
  'How to add a new employee?',
];

function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px">$1</code>')
    .replace(/\n/g, '<br>');
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your HRMS AI assistant. Ask me anything about HR policies, payroll, or help with the system." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    const history = [...messages, { role: 'user', content: msg }];
    setMessages(history);
    setLoading(true);
    try {
      const res = await api('POST', '/api/ai/chat', {
        messages: history.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages([...history, { role: 'assistant', content: res.response }]);
    } catch (e) {
      setMessages([...history, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);

  return (
    <>
      {/* Chat panel — slides up from the FAB */}
      {open && (
        <div
          className="fixed bottom-[144px] right-4 lg:bottom-20 lg:right-5 z-50 w-80 sm:w-96 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-120px)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 text-white"
            style={{ background: `linear-gradient(to right, var(--accent-dark), var(--accent))` }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles size={14} />
              </div>
              <div>
                <div className="text-sm font-semibold">Artech AI</div>
                <div className="text-[10px] opacity-70">HR Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="Clear chat">
                <RotateCcw size={13} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                    style={{ background: `linear-gradient(135deg, var(--accent-dark), var(--accent))` }}>
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: 'var(--accent)' } : {}}
                  dangerouslySetInnerHTML={{ __html: md(m.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                  style={{ background: `linear-gradient(135deg, var(--accent-dark), var(--accent))` }}>AI</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <div className="flex gap-1 py-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50 flex-shrink-0">
              {QUICK.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--accent)' }}
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 lg:bottom-5 lg:right-5 z-50 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          width: 52, height: 52,
          background: open
            ? 'var(--accent-dark)'
            : `linear-gradient(135deg, var(--accent-dark), var(--accent))`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
        title="AI Assistant"
      >
        {open
          ? <X size={20} className="text-white" />
          : <Sparkles size={20} className="text-white" />
        }
      </button>
    </>
  );
}
