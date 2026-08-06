import { usePreferences } from '../../hooks/usePreferences';
import { Sun, Moon, LayoutList, Columns3, CalendarDays } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const { preferences, setTheme, setDefaultView } = usePreferences();

  async function handleThemeChange(theme: 'light' | 'dark') {
    await setTheme(theme);
  }

  async function handleViewChange(view: 'list' | 'kanban' | 'calendar') {
    await setDefaultView(view);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-foreground/50 mt-1">Customize your TaskPilot experience</p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div className="bg-card/50 border border-border/30 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Appearance</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange('dark')}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                preferences?.theme === 'dark'
                  ? "border-accent bg-accent/5"
                  : "border-border/30 hover:border-border/60 bg-card/30",
              )}
            >
              <Moon className={cn("w-5 h-5", preferences?.theme === 'dark' ? "text-accent" : "text-foreground/40")} />
              <span className={cn("text-xs font-medium", preferences?.theme === 'dark' ? "text-accent" : "text-foreground/60")}>
                Dark
              </span>
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                preferences?.theme === 'light'
                  ? "border-accent bg-accent/5"
                  : "border-border/30 hover:border-border/60 bg-card/30",
              )}
            >
              <Sun className={cn("w-5 h-5", preferences?.theme === 'light' ? "text-accent" : "text-foreground/40")} />
              <span className={cn("text-xs font-medium", preferences?.theme === 'light' ? "text-accent" : "text-foreground/60")}>
                Light
              </span>
            </button>
          </div>
        </div>

        {/* Default view */}
        <div className="bg-card/50 border border-border/30 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Default Task View</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleViewChange('list')}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                preferences?.default_view === 'list'
                  ? "border-accent bg-accent/5"
                  : "border-border/30 hover:border-border/60 bg-card/30",
              )}
            >
              <LayoutList className={cn("w-5 h-5", preferences?.default_view === 'list' ? "text-accent" : "text-foreground/40")} />
              <span className={cn("text-xs font-medium", preferences?.default_view === 'list' ? "text-accent" : "text-foreground/60")}>
                List
              </span>
            </button>
            <button
              onClick={() => handleViewChange('kanban')}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                preferences?.default_view === 'kanban'
                  ? "border-accent bg-accent/5"
                  : "border-border/30 hover:border-border/60 bg-card/30",
              )}
            >
              <Columns3 className={cn("w-5 h-5", preferences?.default_view === 'kanban' ? "text-accent" : "text-foreground/40")} />
              <span className={cn("text-xs font-medium", preferences?.default_view === 'kanban' ? "text-accent" : "text-foreground/60")}>
                Kanban
              </span>
            </button>
            <button
              onClick={() => handleViewChange('calendar')}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                preferences?.default_view === 'calendar'
                  ? "border-accent bg-accent/5"
                  : "border-border/30 hover:border-border/60 bg-card/30",
              )}
            >
              <CalendarDays className={cn("w-5 h-5", preferences?.default_view === 'calendar' ? "text-accent" : "text-foreground/40")} />
              <span className={cn("text-xs font-medium", preferences?.default_view === 'calendar' ? "text-accent" : "text-foreground/60")}>
                Calendar
              </span>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-card/50 border border-border/30 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">About TaskPilot AI</h2>
          <p className="text-xs text-foreground/50 leading-relaxed">
            TaskPilot AI transforms documents, meeting notes, and text into organized work.
            AI-powered task management, smart scheduling, and intelligent assistance.
          </p>
          <p className="text-xs text-foreground/30 mt-2">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}