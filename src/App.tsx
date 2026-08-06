import { useAuth } from './hooks/useAuth';
import AuthForm from './components/auth/AuthForm';
import MainLayout from './components/layout/MainLayout';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-sm text-foreground/60">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <MainLayout />;
}