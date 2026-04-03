import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Icon } from '@iconify-icon/react';

export default function MentorChatWidget({ repoId }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef(null);

  // Derive userId — try localStorage, fall back to 'guest'
  const getUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.githubId || u.id || 'guest';
    } catch {
      return 'guest';
    }
  };

  // Normalize LLM answer (can be string, array[{generated_text}], or object)
  const parseAnswer = (raw) => {
    if (!raw) return '(no response)';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) {
      return raw.map(r =>
        typeof r === 'string' ? r : (r?.generated_text ?? JSON.stringify(r))
      ).join('\n');
    }
    if (typeof raw === 'object' && raw.generated_text) return raw.generated_text;
    return JSON.stringify(raw);
  };

  // Load chat history when panel opens
  useEffect(() => {
    if (!open || !repoId) return;
    setLoadingHistory(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/logs/${encodeURIComponent(repoId)}`)
      .then(res => {
        const logs = [...(res.data.logs || [])].reverse(); // chronological order
        const msgs = [];
        logs.forEach(log => {
          msgs.push({ role: 'user', text: log.question });
          msgs.push({ role: 'assistant', text: parseAnswer(log.answer) });
        });
        setMessages(msgs);
      })
      .catch(err => console.error('Chat history error:', err))
      .finally(() => setLoadingHistory(false));
  }, [open, repoId]);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const q = question.trim();
    if (!q || !repoId) return; // only block on missing question or repoId

    // 1. Immediately show user message + placeholder for AI
    setMessages(prev => [
      ...prev,
      { role: 'user', text: q },
      { role: 'assistant', text: '', loading: true },
    ]);
    setQuestion('');

    // 2. Call backend
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat/ask`,
        { repoId, userId: getUserId(), question: q }
      );
      const answer = parseAnswer(res.data.answer);
      setMessages(prev =>
        prev.map((m, i) => i === prev.length - 1 ? { role: 'assistant', text: answer } : m)
      );
    } catch (err) {
      console.error('Chat send error:', err);
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { role: 'assistant', text: '⚠️ Something went wrong. Please try again.' }
            : m
        )
      );
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Chat Panel ─────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col"
          style={{
            width: 360,
            height: 520,
            background: '#1C2128',
            border: '1px solid #30363D',
            borderRadius: 16,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D] shrink-0 bg-[#161B22]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2F89FF]/20 flex items-center justify-center">
                <Icon icon="solar:chat-round-call-line-duotone" width="18" className="text-[#2F89FF]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Ask Axon</p>
                <p className="text-[#6B7280] text-[10px] leading-tight">AI code mentor • {repoId}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#6B7280] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <Icon icon="lucide:x" width="16" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scroll">
            {loadingHistory && (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-[#30363D] border-t-[#2F89FF] rounded-full animate-spin" />
              </div>
            )}

            {!loadingHistory && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#2F89FF]/10 border border-[#2F89FF]/20 flex items-center justify-center">
                  <Icon icon="solar:chat-round-call-line-duotone" width="24" className="text-[#2F89FF]" />
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
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-[#2F89FF] text-white'
                    : 'bg-[#21262D] border border-[#30363D] text-[#CAF5BB]'
                }`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>

                {/* Bubble */}
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
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-[#30363D] shrink-0">
            <div className="flex items-end gap-2 bg-[#21262D] border border-[#30363D] rounded-xl px-3 py-2 focus-within:border-[#2F89FF] transition-colors">
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything about this repo…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-[#E2E8F0] placeholder-[#4B5563] outline-none resize-none leading-6"
                style={{ maxHeight: 80, overflowY: 'auto' }}
              />
              <button
                onClick={send}
                disabled={!question.trim()}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                style={{ background: question.trim() ? '#2F89FF' : '#21262D' }}
              >
                <Icon icon="lucide:send" width="14" className="text-white" />
              </button>
            </div>
            <p className="text-[10px] text-[#4B5563] text-center mt-1.5">Enter ↵ to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* ── FAB toggle ─────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close chat' : 'Ask Axon AI'}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: open ? '#21262D' : '#2F89FF',
          border: '1px solid',
          borderColor: open ? '#30363D' : 'transparent',
          boxShadow: open ? 'none' : '0 6px 28px rgba(47,137,255,0.40)',
        }}
      >
        <Icon
          icon={open ? 'lucide:x' : 'solar:chat-round-call-line-duotone'}
          width="22"
          className="text-white"
        />
      </button>
    </>
  );
}
