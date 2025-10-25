"use client"

import React from 'react';
import { useAuth } from '../lib/authProvider';
import AuthForm from './AuthForm';
import { Shield, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthForm, setShowAuthForm] = React.useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading PhishingSense...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        mode={showAuthForm}
        onToggleMode={() => setShowAuthForm(showAuthForm === 'signin' ? 'signup' : 'signin')}
        onSuccess={() => {
          // User will be redirected automatically when auth state changes
        }}
      />
    );
  }

  return <>{children}</>;
}
