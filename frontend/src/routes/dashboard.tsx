import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useAuth } from '@/hooks/use-auth';
import { isAdminAuthenticated } from '@/lib/auth-guard';
import { useEffect } from 'react';

export const Route = createFileRoute('/dashboard')({
  // Layer 1: fires before component render — no flash of protected content
  beforeLoad: () => {
    if (!isAdminAuthenticated()) {
      throw redirect({ to: '/' });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Layer 2: React guard — handles token removal while page is open
  useEffect(() => {
    if (!isAdmin) {
      navigate({ to: '/' });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
