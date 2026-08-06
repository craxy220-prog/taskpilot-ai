import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../dashboard/Dashboard';
import DocumentUpload from '../documents/DocumentUpload';
import DocumentView from '../documents/DocumentView';
import TasksPage from '../tasks/TasksPage';
import CalendarPage from '../calendar/CalendarPage';
import AiAssistantPage from '../chat/AiAssistantPage';
import SettingsPage from '../settings/SettingsPage';
import GlobalSearch from '../search/GlobalSearch';
import { useDocuments } from '../../hooks/useDocuments';
import { useTasks } from '../../hooks/useTasks';
import { Sparkles, Menu, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Document, AppView } from '../../types';

export default function MainLayout() {
  const {
    documents,
    currentDoc,
    summary,
    tasks: docTasks,
    loadDocument,
    setCurrentDoc,
  } = useDocuments();

  const { fetchTasks } = useTasks();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSelectDoc(doc: Document) {
    loadDocument(doc);
    setCurrentView('documents');
    setShowUpload(false);
  }

  function handleNavigate(view: AppView) {
    setCurrentView(view);
    if (view !== 'documents') {
      setCurrentDoc(null);
    }
    setShowUpload(false);
    fetchTasks();
  }

  function handleUploadClick() {
    setShowUpload(!showUpload);
    setCurrentView('documents');
  }

  function renderContent() {
    if (showUpload) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Upload Document</h1>
              <p className="text-sm text-foreground/50 mt-1">
                Upload a PDF, DOCX, TXT, or Markdown file for AI analysis
              </p>
            </div>
            <button
              onClick={() => setShowUpload(false)}
              className="p-2 rounded-lg hover:bg-muted text-foreground/60 transition-all duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <DocumentUpload />
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'documents':
        if (currentDoc) {
          return (
            <DocumentView
              document={currentDoc}
              summary={summary}
              tasks={docTasks}
            />
          );
        }
        // Show document library if no doc selected
        return (
          <div className="p-6 max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Documents</h1>
                <p className="text-sm text-foreground/50 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 active:scale-[0.97] transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Upload
              </button>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-accent/60" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">No documents yet</h2>
                <p className="text-sm text-foreground/50 mb-6 max-w-md mx-auto">
                  Upload a document to get AI-powered summaries, task extraction, and chat-based insights.
                </p>
                <button
                  onClick={handleUploadClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Upload your first document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="text-left bg-card/50 border border-border/20 rounded-xl p-4 hover:bg-card/70 hover:border-accent/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">{doc.original_filename}</p>
                        <span className={cn(
                          "inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-2",
                          doc.status === 'ready' ? "bg-emerald-500/10 text-emerald-400" :
                          doc.status === 'processing' ? "bg-amber-500/10 text-amber-400" :
                          "bg-red-500/10 text-red-400",
                        )}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'tasks':
        return <TasksPage defaultView="list" />;
      case 'calendar':
        return <CalendarPage />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSearch={() => setSearchOpen(true)}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border/30 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted text-foreground/60 hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">TaskPilot</span>
          </div>
          <button
            onClick={handleUploadClick}
            className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {renderContent()}
        </div>
      </div>

      {/* Global search */}
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDocument={handleSelectDoc}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

