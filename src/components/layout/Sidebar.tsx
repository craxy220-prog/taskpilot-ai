import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import type { AppView } from '../../types';
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  Calendar,
  Bot,
  Settings,
  Search,
  LogOut,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onSearch: () => void;
  open: boolean;
  onToggle: () => void;
}

const navItems: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'documents', label: 'Documents', icon: FileText },
  { view: 'tasks', label: 'Tasks', icon: ListChecks },
  { view: 'calendar', label: 'Calendar', icon: Calendar },
  { view: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentView, onNavigate, onSearch, open, onToggle }: SidebarProps) {
  const { signOut } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-[260px] bg-card/95 border-r border-border/50",
          "flex flex-col transition-all duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm leading-tight block">TaskPilot</span>
              <span className="text-[10px] text-foreground/40 font-medium">AI Platform</span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-foreground/60 hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={onSearch}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface/50 border border-border/30 text-foreground/50 hover:text-foreground hover:bg-surface hover:border-accent/30 transition-all duration-200 cursor-pointer group"
          >
            <Search className="w-4 h-4 group-hover:text-accent transition-colors" />
            <span className="text-sm">Search...</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/30 font-mono">⌘K</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-thin">
          {navItems.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              onClick={() => { onNavigate(view); if (window.innerWidth < 1024) onToggle(); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
                currentView === view
                  ? "bg-accent/10 text-accent font-medium border border-accent/20"
                  : "text-foreground/60 hover:text-foreground hover:bg-muted/50 border border-transparent",
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-colors",
                currentView === view ? "text-accent" : "text-foreground/40 group-hover:text-foreground/60",
              )} />
              <span className="text-sm">{label}</span>
              {currentView === view && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border/50 px-3 py-3 shrink-0">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}