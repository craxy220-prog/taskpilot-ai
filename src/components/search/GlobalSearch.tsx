import { useEffect, useRef, useState } from 'react';
import { Search, FileText, ListChecks, MessageSquare, X, ArrowUpDown, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import type { Document } from '../../types';
import { formatDate } from '../../lib/utils';

interface SearchResult {
  type: 'document' | 'task' | 'conversation';
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onSelectDocument: (doc: Document) => void;
  onNavigate: (view: 'dashboard' | 'documents' | 'tasks') => void;
}

export default function GlobalSearch({ open, onClose, onSelectDocument, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const q = query.toLowerCase();
      const newResults: SearchResult[] = [];

      // Search documents
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .ilike('title', `%${q}%`)
        .limit(5);

      if (docs) {
        docs.forEach(d => newResults.push({
          type: 'document',
          id: d.id,
          title: d.title,
          subtitle: `Document · ${formatDate(d.created_at)}`,
          icon: FileText,
        }));
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('user_id', user.id)
        .ilike('title', `%${q}%`)
        .limit(5);

      if (tasks) {
        tasks.forEach(t => newResults.push({
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: `Task · ${t.status}`,
          icon: ListChecks,
        }));
      }

      // Search conversations
      const { data: chats } = await supabase
        .from('chat_messages')
        .select('id, content, created_at')
        .eq('user_id', user.id)
        .ilike('content', `%${q}%`)
        .limit(5);

      if (chats) {
        chats.forEach(c => newResults.push({
          type: 'conversation',
          id: c.id,
          title: c.content.substring(0, 80) + (c.content.length > 80 ? '...' : ''),
          subtitle: `Chat · ${formatDate(c.created_at)}`,
          icon: MessageSquare,
        }));
      }

      setResults(newResults);
      setSelectedIndex(0);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  function handleSelect(result: SearchResult) {
    onClose();
    if (result.type === 'document') {
      // Load document and navigate
      supabase.from('documents').select('*').eq('id', result.id).single().then(({ data }) => {
        if (data) onSelectDocument(data as Document);
      });
    } else if (result.type === 'task') {
      onNavigate('tasks');
    } else {
      onNavigate('documents');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Search className="w-4 h-4 text-foreground/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documents, tasks, conversations..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-foreground/40 hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
            {results.map((result, i) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left cursor-pointer",
                  i === selectedIndex ? "bg-accent/10 border border-accent/20" : "hover:bg-muted/50 border border-transparent",
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  result.type === 'document' ? "bg-blue-500/10" : result.type === 'task' ? "bg-amber-500/10" : "bg-emerald-500/10",
                )}>
                  <result.icon className={cn(
                    "w-4 h-4",
                    result.type === 'document' ? "text-blue-400" : result.type === 'task' ? "text-amber-400" : "text-emerald-400",
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                  <p className="text-xs text-foreground/40">{result.subtitle}</p>
                </div>
                <ArrowUpDown className="w-3 h-3 text-foreground/20 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query && !loading && results.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-foreground/40">No results found</p>
            <p className="text-xs text-foreground/30 mt-1">Try a different search term</p>
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-foreground/30">
              Search across documents, tasks, and conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}