import { useTasks } from '../../hooks/useTasks';
import CalendarView from '../tasks/CalendarView';
import { Loader2, CalendarDays, ListChecks } from 'lucide-react';
import { useState } from 'react';
import TaskForm from '../tasks/TaskForm';
import type { Task } from '../../types';

export default function CalendarPage() {
  const { tasks, loading, updateTask, todayTasks, upcomingTasks } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
        <p className="text-sm text-foreground/50 mt-1">
          {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} today · {upcomingTasks.length} upcoming
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Deadline summary */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-card/50 border border-border/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-foreground/60">Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{todayTasks.length}</p>
          </div>
          <div className="flex-1 bg-card/50 border border-border/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-foreground/60">This Week</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{upcomingTasks.length}</p>
          </div>
          <div className="flex-1 bg-card/50 border border-border/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-foreground/60">Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === 'done').length}</p>
          </div>
        </div>

        {/* Calendar */}
        <CalendarView
          tasks={tasks}
          onEdit={(t) => setEditingTask(t)}
        />
      </div>

      {editingTask && (
        <TaskForm
          onSubmit={async (data) => {
            await updateTask(editingTask.id, {
              title: data.title,
              description: data.description || null,
              priority: data.priority,
              due_date: data.due_date || null,
              tags: data.tags,
              category: data.category || null,
            });
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
          initial={{
            title: editingTask.title,
            description: editingTask.description || '',
            priority: editingTask.priority,
            due_date: editingTask.due_date || '',
            tags: editingTask.tags || [],
            category: editingTask.category || '',
          }}
        />
      )}
    </div>
  );
}