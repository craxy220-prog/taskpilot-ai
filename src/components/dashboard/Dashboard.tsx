import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useDocuments } from '../../hooks/useDocuments';
import { useTasks } from '../../hooks/useTasks';
import { FileText, MessageSquare, ListChecks, TrendingUp, CalendarCheck, Zap, Sparkles, Clock, Bot, Plus } from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import type { ChatMessage } from '../../types';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 transition-all duration-200 hover:bg-card/70 hover:border-border/40 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-foreground/40 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 group-hover:text-accent transition-colors">{value}</p>
          {sub && <p className="text-xs text-foreground/40 mt-1">{sub}</p>}
        </div>
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          color || "bg-accent/10",
        )}>
          <Icon className={cn("w-4 h-4", color ? "text-white" : "text-accent")} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { documents, loading: docsLoading } = useDocuments();
  const { tasks, todayTasks, upcomingTasks, loading: tasksLoading } = useTasks();
  const [totalChats, setTotalChats] = useState(0);
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: chatCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (chatCount !== null) setTotalChats(chatCount);

      const { data: chats } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(5);

      if (chats) setRecentChats(chats as ChatMessage[]);
    }
    fetchStats();
  }, []);

  const readyDocs = documents.filter(d => d.status === 'ready');
  const recentDocs = documents.slice(0, 5);
  const completedTasks = tasks.filter(t => t.status === 'done');
  const loading = docsLoading || tasksLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-foreground/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Welcome header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-foreground/50">
          {todayTasks.length > 0
            ? `You have ${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} today`
            : 'All caught up — no tasks due today'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={ListChecks} label="Today's Tasks" value={todayTasks.length} sub={`${upcomingTasks.length} upcoming this week`} color="bg-accent/10" />
        <StatCard icon={CalendarCheck} label="Completed" value={completedTasks.length} sub={`${tasks.length} total tasks`} color="bg-emerald-500/10" />
        <StatCard icon={FileText} label="Documents" value={documents.length} sub={`${readyDocs.length} processed`} color="bg-blue-500/10" />
        <StatCard icon={MessageSquare} label="Chat Messages" value={totalChats} color="bg-amber-500/10" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Today's tasks */}
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-accent" />
                Today's Tasks
              </h2>
              <span className="text-xs text-foreground/40">{todayTasks.length} tasks</span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="text-center py-6">
                <CalendarCheck className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-foreground/40">No tasks due today</p>
                <p className="text-xs text-foreground/30 mt-1">Enjoy your day!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todayTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/30 transition-all duration-200">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      task.priority === 'urgent' ? 'bg-red-400' :
                      task.priority === 'high' ? 'bg-orange-400' :
                      task.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400',
                    )} />
                    <span className="text-sm text-foreground/80 truncate flex-1">{task.title}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                      task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400',
                    )}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Task', icon: Plus, onClick: () => {} },
                { label: 'Upload Doc', icon: FileText, onClick: () => {} },
                { label: 'AI Chat', icon: Bot, onClick: () => {} },
                { label: 'View Calendar', icon: Clock, onClick: () => {} },
              ].map((action, i) => (
                <button
                  key={i}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/20 text-sm text-foreground/70 hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-all duration-200 cursor-pointer"
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent documents */}
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Recent Documents
              </h2>
              <span className="text-xs text-foreground/40">{documents.length} total</span>
            </div>
            {recentDocs.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-foreground/40">No documents yet</p>
                <p className="text-xs text-foreground/30 mt-1">Upload a document to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-all duration-200">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-foreground/40">
                        {doc.status === 'ready' ? 'Processed' : doc.status === 'processing' ? 'Processing...' : 'Error'}
                        {' · '}
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      doc.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' :
                      doc.status === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400',
                    )}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming deadlines */}
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Upcoming Deadlines
              </h2>
              <span className="text-xs text-foreground/40">{upcomingTasks.length} this week</span>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6">
                <TrendingUp className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-foreground/40">No upcoming deadlines</p>
                <p className="text-xs text-foreground/30 mt-1">All tasks are on track</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-all duration-200">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      task.priority === 'urgent' ? 'bg-red-500/10' :
                      task.priority === 'high' ? 'bg-orange-500/10' : 'bg-muted/50',
                    )}>
                      <Clock className={cn(
                        "w-4 h-4",
                        task.priority === 'urgent' ? 'text-red-400' :
                        task.priority === 'high' ? 'text-orange-400' : 'text-foreground/40',
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-foreground/40">
                        Due {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent AI activity */}
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                Recent AI Activity
              </h2>
              <span className="text-xs text-foreground/40">{totalChats} messages</span>
            </div>
            {recentChats.length === 0 ? (
              <div className="text-center py-6">
                <Bot className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-foreground/40">No AI conversations yet</p>
                <p className="text-xs text-foreground/30 mt-1">Chat with AI to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentChats.map(chat => (
                  <div key={chat.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-all duration-200">
                    <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground/70 line-clamp-2">{chat.content.substring(0, 120)}</p>
                      <p className="text-[10px] text-foreground/30 mt-0.5">{formatDate(chat.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}