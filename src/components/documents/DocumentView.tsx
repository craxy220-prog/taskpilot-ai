import { useState } from 'react';
import type { Document, Summary, DocumentTask } from '../../types';
import { FileText, ListChecks, Sparkles, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { formatDate, formatFileSize } from '../../lib/utils';
import ChatPanel from '../chat/ChatPanel';
import { cn } from '../../lib/utils';

interface DocumentViewProps {
  document: Document;
  summary: Summary | null;
  tasks: DocumentTask[];
}

export default function DocumentView({ document, summary, tasks }: DocumentViewProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'chat'>('summary');

  const tabs = [
    { id: 'summary' as const, label: 'Summary', icon: Sparkles },
    { id: 'tasks' as const, label: 'Tasks', icon: ListChecks },
    { id: 'chat' as const, label: 'Chat', icon: FileText },
  ];

  if (document.status === 'processing') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-foreground/60 font-medium">Processing document...</p>
          <p className="text-xs text-foreground/40 mt-1">AI is analyzing your document</p>
        </div>
      </div>
    );
  }

  if (document.status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm text-foreground/60 font-medium">Processing failed</p>
          <p className="text-xs text-foreground/40 mt-1">Something went wrong. Please try again.</p>
        </div>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    low: 'text-blue-400 bg-blue-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    urgent: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Document header */}
      <div className="px-6 py-4 border-b border-border/30 shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground truncate">{document.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-foreground/40">{document.original_filename}</span>
              <span className="text-xs text-foreground/30">·</span>
              <span className="text-xs text-foreground/40">{formatFileSize(document.file_size_bytes)}</span>
              <span className="text-xs text-foreground/30">·</span>
              <span className="text-xs text-foreground/40">{formatDate(document.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-3 border-b border-border/30 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-all duration-200 cursor-pointer",
              activeTab === tab.id
                ? "text-accent bg-accent/5 border-b-2 border-accent font-medium"
                : "text-foreground/50 hover:text-foreground/80",
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' ? (
          <div className="h-full">
            <ChatPanel document={document} />
          </div>
        ) : activeTab === 'summary' ? (
          <div className="p-6 max-w-3xl">
            {summary ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-card/30 border border-border/40 rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    AI Summary
                  </h2>
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {summary.summary_text}
                  </div>
                </div>

                {/* Key Points */}
                {summary.key_points.length > 0 && (
                  <div className="bg-card/30 border border-border/40 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-3">Key Points</h2>
                    <ul className="space-y-2">
                      {summary.key_points.map((point, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-foreground/40">No summary available</p>
              </div>
            )}
          </div>
        ) : (
          /* Tasks tab */
          <div className="p-6 max-w-3xl">
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="bg-card/30 border border-border/40 rounded-xl p-4 flex items-start gap-3">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-foreground/30 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-foreground/50 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          priorityColors[task.priority]
                        )}>
                          {task.priority}
                        </span>
                        {task.deadline && (
                          <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                            <Clock className="w-3 h-3" />
                            {new Date(task.deadline).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListChecks className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-foreground/40">No tasks extracted yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}