import { Task } from '../../types';
import { cn } from '../../lib/utils';
import { Circle, CheckCircle2, Clock, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface TaskListViewProps {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<string, string> = {
  low: 'text-blue-400 bg-blue-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  urgent: 'text-red-400 bg-red-500/10',
};

export default function TaskListView({ tasks, onToggleStatus, onEdit, onDelete }: TaskListViewProps) {
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('created_at');

  const sorted = [...tasks].sort((a, b) => {
    if (sortBy === 'due_date') return (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1;
    if (sortBy === 'priority') {
      const p = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] || 0) - (p[b.priority] || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="animate-fade-in">
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-xs text-foreground/40">Sort by:</span>
        {(['created_at', 'due_date', 'priority'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
              sortBy === s ? "bg-accent/10 text-accent" : "text-foreground/40 hover:text-foreground/60",
            )}
          >
            {s === 'created_at' ? 'Recent' : s === 'due_date' ? 'Due Date' : 'Priority'}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {sorted.map(task => (
          <div
            key={task.id}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card/30 border border-border/20 hover:bg-card/50 hover:border-border/40 transition-all duration-200"
          >
            <button
              onClick={() => onToggleStatus(task)}
              className="shrink-0 cursor-pointer"
            >
              {task.status === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className={cn(
                  "w-5 h-5 transition-colors",
                  task.status === 'in_progress' ? 'text-accent' : 'text-foreground/30 hover:text-foreground/50',
                )} />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-sm font-medium truncate",
                  task.status === 'done' ? "line-through text-foreground/40" : "text-foreground",
                )}>
                  {task.title}
                </p>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  priorityColors[task.priority],
                )}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-xs text-foreground/40 mt-0.5 line-clamp-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  task.status === 'todo' ? 'bg-foreground/5 text-foreground/50' :
                  task.status === 'in_progress' ? 'bg-accent/10 text-accent' :
                  'bg-emerald-500/10 text-emerald-400',
                )}>
                  {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                {task.due_date && (
                  <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {(task.tags || []).length > 0 && (task.tags || []).map((tag, i) => (
                  <span key={i} className="text-[10px] text-accent/60 bg-accent/5 px-1.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-foreground/40 hover:text-destructive transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12">
          <ArrowUpDown className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/40">No tasks found</p>
        </div>
      )}
    </div>
  );
}