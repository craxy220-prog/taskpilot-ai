import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data as Task[]);
  }, []);

  useEffect(() => {
    fetchTasks().finally(() => setLoading(false));
  }, [fetchTasks]);

  async function createTask(task: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    status?: 'todo' | 'in_progress' | 'done';
    tags?: string[];
    category?: string;
    estimated_duration_minutes?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        priority: task.priority || 'medium',
        due_date: task.due_date || null,
        status: task.status || 'todo',
        tags: task.tags || [],
        category: task.category || null,
        estimated_duration_minutes: task.estimated_duration_minutes || null,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => [data as Task, ...prev]);
      return data as Task;
    }
    return null;
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? data as Task : t));
      return data as Task;
    }
    return null;
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }

  async function toggleTaskStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'done' ? 'todo' : currentStatus === 'in_progress' ? 'done' : 'in_progress';
    return updateTask(id, { status: nextStatus as Task['status'] });
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const todayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const today = new Date();
    const due = new Date(t.due_date);
    return due.toDateString() === today.toDateString() && t.status !== 'done';
  });

  const upcomingTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    const today = new Date();
    const due = new Date(t.due_date);
    const diff = due.getTime() - today.getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  return {
    tasks,
    loading,
    todoTasks,
    inProgressTasks,
    doneTasks,
    todayTasks,
    upcomingTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
}