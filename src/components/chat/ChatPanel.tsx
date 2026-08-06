import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatMessageItem from './ChatMessage';
import type { Document } from '../../types';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatPanelProps {
  document: Document;
}

export default function ChatPanel({ document }: ChatPanelProps) {
  const {
    messages,
    streaming,
    messagesEndRef,
    fetchMessages,
    sendMessage,
    scrollToBottom,
  } = useChat(document.id);

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    scrollToBottom();
  }, [document.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const content = input;
    setInput('');
    await sendMessage(content, document.content_text || '');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">AI Chat</span>
        </div>
        <p className="text-xs text-foreground/40 mt-0.5">
          Ask questions about this document
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-accent/60" />
            </div>
            <p className="text-sm text-foreground/60 font-medium">Chat with your document</p>
            <p className="text-xs text-foreground/40 mt-1 max-w-[200px]">
              Ask questions, request summaries, or get insights about this document
            </p>
          </div>
        ) : (
          <div>
            {messages.map(msg => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
            {streaming && (
              <div className="flex gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                </div>
                <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/30 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this document..."
            disabled={streaming}
            className="flex-1 px-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
              input.trim() && !streaming
                ? "bg-accent text-white hover:bg-accent/90 active:scale-[0.97]"
                : "bg-muted/50 text-foreground/30 cursor-not-allowed",
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}