import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types';

const EDGE_FUNCTION_URL = 'https://cgksadcrorettklvytbp.supabase.co/functions/v1/document-ai';

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [recentDocs, setRecentDocs] = useState<{ id: string; title: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRecentDocs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadRecentDocs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('documents')
      .select('id, title, content_text')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .not('content_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRecentDocs(data.map((d: { id: string; title: string; content_text: string }) => ({ id: d.id, title: d.title, content: d.content_text })));
  }

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setStreaming(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('No auth token');

      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Build document context
      const docContext = recentDocs.length > 0
        ? `\n\nAvailable documents:\n${recentDocs.map(d => `- ${d.title}`).join('\n')}`
        : '';

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'assistant-chat',
          messages: history,
          documentContent: docContext,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to get response');
      }

      const data = await res.json();
      const reply = data.reply || "I'm not sure how to help with that. Try asking me to create tasks, summarize projects, or organize your work.";

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Check if the AI created tasks (parse JSON task blocks)
      const taskMatch = reply.match(/```tasks\n([\s\S]*?)```/);
      if (taskMatch) {
        try {
          const taskData = JSON.parse(taskMatch[1]);
          if (Array.isArray(taskData)) {
            for (const t of taskData) {
              await supabase.from('tasks').insert({
                user_id: user.id,
                title: t.title || t,
                description: t.description || null,
                priority: t.priority || 'medium',
                due_date: t.due_date || null,
                status: 'todo',
                tags: t.tags || [],
              });
            }
          }
        } catch {}
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: 'assistant',
        content: "I'm sorry, I couldn't process that request. Please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  }

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
            <p className="text-xs text-foreground/40">
              Ask me anything — create tasks, plan your day, organize work
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-accent/60" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">How can I help you?</h2>
            <p className="text-sm text-foreground/50 text-center max-w-md mb-8">
              I can help you manage your workload — create tasks, suggest priorities,
              plan your day, summarize projects, and answer questions about your documents.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {[
                'Create a task for tomorrow',
                'What should I prioritize?',
                'Plan my work day',
                'Summarize my projects',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => { sendMessage(suggestion); }}
                  className="text-left px-4 py-3 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground/70 hover:bg-muted/50 hover:border-accent/30 transition-all duration-200 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3 px-6 py-4", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3",
                  msg.role === 'user'
                    ? "bg-accent text-white rounded-tr-md"
                    : "bg-muted/50 text-foreground border border-border/30 rounded-tl-md",
                )}>
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    msg.role === 'user' ? "prose-invert" : "",
                    "prose-p:leading-relaxed prose-p:my-1",
                    "prose-ul:my-1 prose-li:my-0.5",
                    "prose-strong:text-inherit",
                  )}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-foreground/60" />
                  </div>
                )}
              </div>
            ))}
            {streaming && (
              <div className="flex gap-3 px-6 py-4">
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
      <div className="shrink-0 border-t border-border/30 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant..."
            disabled={streaming}
            className="flex-1 px-4 py-3 bg-surface border border-border/50 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className={cn(
              "p-3 rounded-xl transition-all duration-200 cursor-pointer",
              input.trim() && !streaming
                ? "bg-accent text-white hover:bg-accent/90 active:scale-[0.97]"
                : "bg-muted/50 text-foreground/30 cursor-not-allowed",
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-foreground/30 mt-2 text-center">
          I can create tasks, suggest priorities, and help organize your work.
          Type <code className="text-accent/60">```tasks [...]```</code> to create tasks in bulk.
        </p>
      </div>
    </div>
  );
}