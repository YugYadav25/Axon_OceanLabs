/**
 * MentorChatWidget — Ask Axon AI Chatbot
 *
 * Input UI adapted from Watermelon UI — AiInput004 component
 * Source: https://ui.watermelon.sh/
 * Dependencies: motion/react (animations), lucide-react (icons)
 *
 * Original AiInput004 pattern used:
 *  - AnimatePresence panel slide-in/out with spring physics
 *  - Auto-resizing textarea with Plus / Mic / ArrowUp icon layout
 *  - Shimmer gradient "generating" text effect
 *  - Motion FAB button with rotate transition
 */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Mic, ArrowUp, X, MessageSquare } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MentorChatWidget({ repoId }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [appState, setAppState] = useState('IDLE'); // 'IDLE' | 'GENERATING' | 'RESULT'
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);
  const hasContent = value.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // Derive userId safely
  const getUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.githubId || u.id || 'guest';
    } catch { return 'guest'; }
  };

  // Normalize LLM answer format
  const parseAnswer = (raw) => {
    if (!raw) return '(no response)';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw.map(r => typeof r === 'string' ? r : (r?.generated_text ?? JSON.stringify(r))).join('\n');
    if (typeof raw === 'object' && raw.generated_text) return raw.generated_text;
    return JSON.stringify(raw);
  };

  // Load history when panel opens
  useEffect(() => {
    if (!open || !repoId) return;
    setLoadingHistory(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/logs/${encodeURIComponent(repoId)}`)
      .then(res => {
        const msgs = [];
        [...(res.data.logs || [])].reverse().forEach(log => {
          msgs.push({ role: 'user', text: log.question });
          msgs.push({ role: 'assistant', text: parseAnswer(log.answer) });
        });
        setMessages(msgs);
      })
      .catch(err => console.error('Chat history error:', err))
      .finally(() => setLoadingHistory(false));
  }, [open, repoId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const q = value.trim();
    if (!q || !repoId || appState === 'GENERATING') return;

    setMessages(prev => [
      ...prev,
      { role: 'user', text: q },
      { role: 'assistant', text: '', loading: true },
    ]);
    setValue('');
    setAppState('GENERATING');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat/ask`,
        { repoId, userId: getUserId(), question: q }
      );
      const answer = parseAnswer(res.data.answer);
      setMessages(prev =>
        prev.map((m, i) => i === prev.length - 1 ? { role: 'assistant', text: answer } : m)
      );
      setAppState('RESULT');
    } catch {
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { role: 'assistant', text: '⚠️ Something went wrong. Please try again.' } : m
        )
      );
      setAppState('RESULT');
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* ── Chat Panel ────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden"
            style={{
              width: 360,
              height: 520,
              background: '#161B22',
              border: '1px solid #21262D',
              borderRadius: 20,
              boxShadow: '0 28px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262D] shrink-0" style={{ background: '#0D1117' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#2F89FF]/20 flex items-center justify-center">
                  <MessageSquare size={16} className="text-[#2F89FF]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Ask Axon</p>
                  <p className="text-[#6B7280] text-[10px] leading-tight truncate max-w-[200px]">
                    AI code mentor · {repoId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#6B7280] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Generating shimmer overlay ── */}
            <AnimatePresence mode="wait">
              {appState === 'GENERATING' && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                  style={{ top: 56, bottom: 80 }}
                >
                  <motion.span
                    className="text-sm font-medium tracking-tight px-4 text-center"
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #4B5563 0%, #4B5563 40%, #E2E8F0 50%, #4B5563 60%, #4B5563 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                    animate={{ backgroundPositionX: ['100%', '-100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  >
                    Axon is thinking…
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scroll">
              {loadingHistory && (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-[#21262D] border-t-[#2F89FF] rounded-full animate-spin" />
                </div>
              )}

              {!loadingHistory && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#2F89FF]/10 border border-[#2F89FF]/20 flex items-center justify-center">
                    <MessageSquare size={22} className="text-[#2F89FF]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-1">Ask about this codebase</p>
                    <p className="text-[#6B7280] text-xs leading-relaxed">
                      e.g. "What does the auth service do?" or "Where is the database connected?"
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                    msg.role === 'user' ? 'bg-[#2F89FF] text-white' : 'bg-[#21262D] border border-[#30363D] text-[#CAF5BB]'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    msg.role === 'user'
                      ? 'bg-[#2F89FF] text-white rounded-tr-sm'
                      : 'bg-[#21262D] text-[#E2E8F0] border border-[#30363D] rounded-tl-sm'
                  }`}>
                    {msg.loading ? (
                      <span className="flex gap-1 items-center py-0.5 px-1">
                        <span className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : (
                      <div className="w-full break-words">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1 last:mb-0" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? <code className="bg-black/30 px-1 py-0.5 rounded text-[13px] font-mono text-[#CAF5BB]" {...props} />
                                     : <code className="block bg-black/30 p-2 rounded text-[13px] font-mono mb-2 overflow-x-auto text-[#E2E8F0]" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-black/30 p-2 rounded my-2 overflow-x-auto" {...props} />,
                            a: ({node, ...props}) => <a className="text-[#2F89FF] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* ── AiInput004-style Animated Input ── */}
            <AnimatePresence>
              {(appState === 'IDLE' || appState === 'RESULT') && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    borderRadius: 14,
                    padding: '6px 10px',
                  }}
                  exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                  className="mx-3 mb-3 shrink-0 flex items-end gap-2 border border-[#30363D] bg-[#21262D] focus-within:border-[#2F89FF] transition-colors"
                  style={{ borderRadius: 14 }}
                >
                  {/* Plus icon */}
                  <Plus
                    size={17}
                    className="mb-2 ml-1 shrink-0 text-[#6B7280] hover:text-[#E2E8F0] cursor-pointer transition-colors"
                  />

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask about this repo…"
                    rows={1}
                    className="flex-1 bg-transparent py-2 text-sm text-[#E2E8F0] placeholder-[#4B5563] outline-none resize-none leading-relaxed"
                    style={{ minHeight: 36, maxHeight: 120, overflowY: 'auto' }}
                  />

                  {/* Right controls */}
                  <div className="flex items-center gap-2 mb-1.5 shrink-0">
                    <Mic size={16} className="text-[#6B7280] hover:text-[#E2E8F0] cursor-pointer transition-colors" />
                    <motion.button
                      onClick={send}
                      disabled={!hasContent || appState === 'GENERATING'}
                      whileTap={{ scale: 0.88 }}
                      whileHover={hasContent ? { scale: 1.08 } : {}}
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
                      style={{
                        background: hasContent ? '#2F89FF' : 'rgba(47,137,255,0.15)',
                      }}
                    >
                      <ArrowUp size={15} className="text-white" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint */}
            <p className="text-[10px] text-[#4B5563] text-center pb-2 shrink-0">
              Enter ↵ to send · Shift+Enter for new line
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Toggle ───────────────────────── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        title={open ? 'Close chat' : 'Ask Axon AI'}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: open ? '#21262D' : '#2F89FF',
          border: `1px solid ${open ? '#30363D' : 'transparent'}`,
          boxShadow: open ? 'none' : '0 6px 28px rgba(47,137,255,0.4)',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {open
              ? <X size={22} className="text-white" />
              : <MessageSquare size={22} className="text-white" />
            }
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}
