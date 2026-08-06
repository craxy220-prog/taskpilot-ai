import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cgksadcrorettklvytbp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNna3NhZGNyb3JldHRrbHZ5dGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTc3NDEsImV4cCI6MjEwMTQzMzc0MX0.dky0LRYXlBIEEYc2V9rshiFeGU49GqQSvKb7h5QxMok';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});