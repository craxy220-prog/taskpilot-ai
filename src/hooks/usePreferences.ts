import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserPreferences } from '../types';

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    let { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!data) {
      const { data: inserted } = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id, theme: 'dark', default_view: 'list' })
        .select()
        .single();
      data = inserted;
    }

    if (data) {
      setPrefs(data as UserPreferences);
      applyTheme((data as UserPreferences).theme);
    }
    setLoading(false);
  }

  async function setTheme(theme: 'light' | 'dark') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_preferences')
      .update({ theme })
      .eq('user_id', user.id);

    setPrefs(prev => prev ? { ...prev, theme } : null);
    applyTheme(theme);
  }

  async function setDefaultView(view: 'list' | 'kanban' | 'calendar') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_preferences')
      .update({ default_view: view })
      .eq('user_id', user.id);

    setPrefs(prev => prev ? { ...prev, default_view: view } : null);
  }

  function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', theme === 'dark' ? '#0A0A0F' : '#F8FAFC'
    );
  }

  return {
    preferences: prefs,
    loading,
    setTheme,
    setDefaultView,
  };
}