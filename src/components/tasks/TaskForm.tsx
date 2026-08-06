import { useState } from 'react';
import { X, Plus, Tag, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    tags: string[];
    category: string;
  }) => Promise<void>;
  onClose: () => void;
  initial?: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    tags: string[];
    category: string;
  };
}

export default function TaskForm({ onSubmit, onClose, initial }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(initial?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initial?.due_date || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [category, setCategory] = useState(initial?.category || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSubmit({ title: title.trim(), description, priority, due_date: dueDate, tags, category });
    setSaving(false);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-blue-400 bg-blue-500/10' },
    { value: 'medium', label: 'Medium', color: 'text-amber-400 bg-amber-500/10' },
    { value: 'high', label: 'High', color: 'text-orange-400 bg-orange-500/10' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-400 bg-red-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-sm font-semibold text-foreground">{initial ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-foreground/40 hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className="w-full px-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full px-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200 resize-none"
          />

          <div className="flex gap-2">
            {priorityOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value as typeof priority)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer",
                  priority === opt.value
                    ? `${opt.color} border-current`
                    : 'text-foreground/40 border-border/30 hover:border-border/60',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-foreground/50 mb-1.5">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs text-foreground/50 mb-1.5">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Work, Personal, Project"
              className="w-full px-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs text-foreground/50 mb-1.5">Tags</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 px-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
              />
              <button
                type="button"
                onClick={addTag}
                className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(prev => prev.filter((_, j) => j !== i))}
                      className="hover:text-destructive transition-colors cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            ) : (
              initial ? 'Save Changes' : 'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}