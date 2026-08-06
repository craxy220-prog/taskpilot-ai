import { useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import TaskListView from './TaskListView';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import TaskForm from './TaskForm';
import { List, Columns3, CalendarDays, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

type ViewMode = 'list' | 'kanban' | 'calendar';

interface TasksPageProps {
  defaultView?: ViewMode;
}

export default function TasksPage({ defaultView = 'list' }: TasksPageProps) {
  const { tasks, loading, createTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();
  const [view, setView] = useState<ViewMode>(defaultView);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleToggleTaskStatus = async (task: Task) => {
    await toggleTaskStatus(task.id, task.status);
  };

  const views: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'list', label: 'List', icon: List },
    { id: 'kanban', label: 'Kanban', icon: Columns3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  async function handleCreate(data: Parameters<typeof createTask>[0]) {
    await createTask(data);
    setShowForm(false);
  }

  async function handleEdit(data: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    tags: string[];
    category: string;
  }) {
    if (editingTask) {
      await updateTask(editingTask.id, {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        due_date: data.due_date || null,
        tags: data.tags,
        category: data.category || null,
      });
      setEditingTask(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-foreground/50 mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {tasks.filter(t => t.status === 'done').length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex items-center bg-card/50 border border-border/30 rounded-xl p-0.5">
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                  view === v.id ? "bg-accent text-white" : "text-foreground/40 hover:text-foreground/70",
                )}
                title={v.label}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {view === 'list' && (
          <TaskListView
            tasks={tasks}
            onToggleStatus={handleToggleTaskStatus}
            onEdit={(t) => setEditingTask(t)}
            onDelete={deleteTask}
          />
        )}
        {view === 'kanban' && (
          <KanbanView
            tasks={tasks}
            onToggleStatus={handleToggleTaskStatus}
            onEdit={(t) => setEditingTask(t)}
            onDelete={deleteTask}
            onCreateTask={() => setShowForm(true)}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onEdit={(t) => setEditingTask(t)}
          />
        )}
      </div>

      {/* Form modal */}
      {(showForm || editingTask) && (
        <TaskForm
          onSubmit={editingTask ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          initial={editingTask ? {
            title: editingTask.title,
            description: editingTask.description || '',
            priority: editingTask.priority,
            due_date: editingTask.due_date || '',
            tags: editingTask.tags || [],
            category: editingTask.category || '',
          } : undefined}
        />
      )}
    </div>
  );
}