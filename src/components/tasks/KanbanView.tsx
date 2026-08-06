import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Task } from '../../types';
import { Circle, CheckCircle2, Clock, Plus } from 'lucide-react';

interface KanbanViewProps {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateTask: (status: 'todo' | 'in_progress' | 'done') => void;
}

const columns: { id: Task['status']; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-t-accent/50' },
  { id: 'in_progress', title: 'In Progress', color: 'border-t-amber-500/50' },
  { id: 'done', title: 'Completed', color: 'border-t-emerald-500/50' },
];

const priorityColors: Record<string, string> = {
  low: 'text-blue-400 bg-blue-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  urgent: 'text-red-400 bg-red-500/10',
};

export default function KanbanView({ tasks, onToggleStatus, onEdit, onCreateTask }: KanbanViewProps) {
  const grouped = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  }), [tasks]);

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4 animate-fade-in">
      {columns.map(col => {
        const columnTasks = grouped[col.id];
        return (
          <div key={col.id} className="flex-1 min-w-[280px] max-w-[380px] flex flex-col">
            {/* Column header */}
            <div className={cn(
              "flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl bg-card/50 border border-border/30 border-t-2",
              col.color,
            )}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{col.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground/50 font-medium">
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => onCreateTask(col.id)}
                className="p-1 rounded-lg hover:bg-muted text-foreground/40 hover:text-accent transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 min-h-[100px]">
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  className="group bg-card/60 border border-border/20 rounded-xl p-3 hover:border-border/40 hover:bg-card/80 transition-all duration-200 cursor-pointer"
                  onClick={() => onEdit(task)}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
                      className="shrink-0 mt-0.5 cursor-pointer"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-foreground/30 hover:text-foreground/50 transition-colors" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        task.status === 'done' ? "line-through text-foreground/40" : "text-foreground",
                      )}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-foreground/40 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          priorityColors[task.priority],
                        )}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {task.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[10px] text-accent/60 bg-accent/5 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-[10px] text-foreground/30">+{task.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center mb-1">
                    <Plus className="w-4 h-4 text-foreground/20" />
                  </div>
                  <p className="text-xs text-foreground/30">No tasks</p>
                  <button
                    onClick={() => onCreateTask(col.id)}
                    className="text-[11px] text-accent/60 hover:text-accent mt-1 transition-colors cursor-pointer"
                  >
                    Add one
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}