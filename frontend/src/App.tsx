import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'agumon';
  text: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agumon', text: '안녕! 나는 아구몬이야! 태일아, 우리 같이 모험을 떠나자구!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:4000/api/chat', {
        message: userMessage
      });

      setMessages(prev => [...prev, { role: 'agumon', text: response.data.reply }]);
    } catch (error) {
      console.error('Failed to fetch Agumon reply:', error);
      setMessages(prev => [...prev, { 
        role: 'agumon', 
        text: '에구구... 디지털 월드와 연결이 끊긴 것 같아다구. 다시 한번 말해줘!' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans text-white w-full">
      <div className="max-w-2xl w-full bg-zinc-900 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,149,0,0.2)] border-4 border-digimon-orange flex flex-col h-[85vh]">
        
        {/* Agumon Display Area */}
        <div className="h-1/3 bg-zinc-800 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-digimon-orange/20 to-transparent flex-shrink-0">
          <motion.div 
            animate={isLoading ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : { 
              y: [0, -10, 0] 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isLoading ? 0.5 : 2, 
              ease: "easeInOut" 
            }}
            className="z-10"
          >
            {/* Agumon Character Placeholder (Replace with actual GIF later) */}
            <div className="w-32 h-32 bg-digimon-yellow rounded-full flex items-center justify-center shadow-lg border-4 border-white relative">
              <span className="text-5xl">🦖</span>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-2 -right-2 bg-digimon-blue p-1 rounded-full"
                >
                  <Loader2 className="animate-spin" size={20} />
                </motion.div>
              )}
            </div>
          </motion.div>
          
          <div className="absolute bottom-4 left-0 right-0 px-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800/80 backdrop-blur-md p-3 rounded-xl border border-white/10"
            >
              <p className="text-[10px] font-bold text-digimon-orange uppercase tracking-[0.2em] mb-1">Agumon Status: {isLoading ? 'Thinking...' : 'Ready'}</p>
              <p className="text-base italic leading-tight text-zinc-200 line-clamp-2">
                {isLoading ? "으음... 뭐라고 대답할지 고민 중이다구!" : messages[messages.length - 1].text}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Chat Log */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-900/50 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-digimon-blue text-white rounded-tr-none' 
                    : 'bg-zinc-800 text-digimon-yellow rounded-tl-none border border-digimon-orange/20'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-digimon-orange/20">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-digimon-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-digimon-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-digimon-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-zinc-900 border-t border-white/5">
          <div className="flex gap-3 bg-zinc-800 p-2 rounded-2xl border-2 border-transparent focus-within:border-digimon-orange transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="아구몬에게 메시지를 보내다구!"
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-digimon-orange hover:bg-orange-500 disabled:bg-zinc-700 p-3 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-4 text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold">
        <span>Network: Stable</span>
        <div className="w-1 h-1 bg-zinc-700 rounded-full" />
        <span>Location: Digital World</span>
        <div className="w-1 h-1 bg-zinc-700 rounded-full" />
        <span className="text-digimon-orange animate-pulse">Connection: Active</span>
      </div>
    </div>
  );
};

export default App;
