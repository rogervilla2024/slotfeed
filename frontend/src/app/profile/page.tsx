'use client';

import { useAuth } from '@/contexts/auth-context';
import { UserProfileCard } from '@/components/user';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/auth/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <UserProfileCard />
      </div>
    </main>
  );
}
