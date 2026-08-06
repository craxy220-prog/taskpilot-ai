export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_size_bytes: number;
  file_path: string;
  original_filename: string;
  content_text: string | null;
  status: 'processing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: string;
  document_id: string;
  user_id: string;
  summary_text: string;
  key_points: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  document_id?: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DocumentTask {
  id: string;
  document_id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  tags: string[];
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  estimated_duration_minutes: number | null;
  category: string | null;
  tags: string[];
  source_document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_view: 'list' | 'kanban' | 'calendar';
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

export interface DashboardStats {
  todayTasks: number;
  upcomingDeadlines: number;
  documentsCount: number;
  completedTasks: number;
  recentActivity: number;
}

export type AppView = 'dashboard' | 'documents' | 'tasks' | 'calendar' | 'ai-assistant' | 'settings';