import { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Task } from '../../types';
import { ChevronLeft, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export default function CalendarView({ tasks, onEdit }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const taskMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const key = task.due_date;
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  function getDateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{monthName}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-accent hover:bg-accent/10 transition-all duration-200 cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="calendar-grid mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] text-foreground/40 font-medium py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid border border-border/20 rounded-xl overflow-hidden">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="min-h-[90px] bg-muted/10 p-1.5 border border-border/10" />;

          const dateKey = getDateKey(day);
          const dayTasks = taskMap[dateKey] || [];
          const isToday = today.getTime() === new Date(year, month, day).getTime();
          const isPast = new Date(year, month, day) < today;

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[90px] p-1.5 border border-border/10 transition-all duration-200",
                isToday ? "bg-accent/5" : "hover:bg-muted/20",
              )}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1",
                isToday ? "bg-accent text-white" : isPast ? "text-foreground/30" : "text-foreground/60",
              )}>
                {day}
              </span>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className={cn(
                      "w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-left transition-colors cursor-pointer",
                      task.status === 'done' ? "bg-emerald-500/10 text-emerald-400/70" : "bg-accent/10 text-accent/80 hover:bg-accent/20",
                    )}
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    ) : (
                      <Circle className="w-2.5 h-2.5 shrink-0" />
                    )}
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-foreground/30 pl-1">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}