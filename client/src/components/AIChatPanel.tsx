import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Brain, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId?: string | null;
  opportunityLabel?: string;
}

export function AIChatPanel({ isOpen, onClose, opportunityId, opportunityLabel }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setChatId(null);
      setMessages([]);
      setError(null);
      initChat();
    }
  }, [isOpen, opportunityId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const initChat = async () => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      });
      const data = await res.json();
      if (data.chatId) {
        setChatId(data.chatId);
      }
    } catch {
      setError('Failed to initialize chat session');
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !chatId || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: Date.now() }]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'delta' && data.text) {
              assistantContent += data.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: Date.now(),
                };
                return updated;
              });
            }
            if (data.type === 'error') {
              setError(data.error);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsStreaming(false);
    }
  }, [input, chatId, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 420,
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-primary)',
            }}
          >
            <div
              data-testid="ai-chat-header"
              className="flex items-center justify-between px-4 flex-shrink-0"
              style={{
                height: 56,
                borderBottom: '1px solid var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Brain size={18} style={{ color: 'var(--accent-primary)' }} />
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    AI Analyst
                  </span>
                  {opportunityLabel && (
                    <span
                      className="text-[10px] truncate max-w-[200px]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {opportunityLabel}
                    </span>
                  )}
                </div>
              </div>
              <button
                data-testid="button-close-chat"
                onClick={onClose}
                className="p-1.5 transition-colors duration-150"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
                  <MessageSquare size={32} style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
                    Ask about arbitrage opportunities, risk analysis, or trading strategy.
                  </p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {[
                      'What risks does this opportunity have?',
                      'Is the spread sustainable?',
                      'Best execution strategy?',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        data-testid={`button-suggestion-${i}`}
                        onClick={() => { setInput(suggestion); }}
                        className="text-[11px] px-3 py-1.5 rounded-lg transition-colors duration-150 text-left"
                        style={{
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  data-testid={`chat-message-${msg.role}-${i}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-lg text-[12px] leading-relaxed"
                    style={{
                      backgroundColor: msg.role === 'user'
                        ? 'var(--accent-primary)'
                        : 'var(--bg-tertiary)',
                      color: msg.role === 'user'
                        ? '#ffffff'
                        : 'var(--text-primary)',
                    }}
                  >
                    <pre className="whitespace-pre-wrap font-[inherit] m-0">{msg.content}</pre>
                    {msg.role === 'assistant' && isStreaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div
                  className="text-[11px] px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}
                >
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div
              className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border-primary)' }}
            >
              <input
                ref={inputRef}
                data-testid="input-chat-message"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? 'Waiting for response...' : 'Ask about this opportunity...'}
                disabled={isStreaming || !chatId}
                className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none transition-colors duration-150"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
              />
              <button
                data-testid="button-send-message"
                onClick={sendMessage}
                disabled={isStreaming || !input.trim() || !chatId}
                className="p-2 rounded-lg transition-all duration-150"
                style={{
                  backgroundColor: input.trim() && !isStreaming ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: input.trim() && !isStreaming ? '#ffffff' : 'var(--text-tertiary)',
                  opacity: isStreaming ? 0.5 : 1,
                }}
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
