import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../auth-provider';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRole?: 'buyer' | 'artist' | 'admin';
}

export function ProtectedRoute({ component: Component, requiredRole }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      if (location.startsWith('/artist')) {
        setLocation(`/artist/login?redirect=${encodeURIComponent(location)}`);
      } else if (location.startsWith('/admin')) {
        setLocation(`/admin/login?redirect=${encodeURIComponent(location)}`);
      } else {
        setLocation(`/buyer/login?redirect=${encodeURIComponent(location)}`);
      }
      return;
    }

    if (requiredRole) {
      // Admin has access to all roles
      if (user?.role === 'admin') return;

      if (user?.role !== requiredRole) {
        if (requiredRole === 'artist') {
          setLocation(`/artist/login?redirect=${encodeURIComponent(location)}`);
        } else if (requiredRole === 'admin') {
          setLocation(`/admin/login?redirect=${encodeURIComponent(location)}`);
        } else {
          setLocation('/');
        }
      }
    }
  }, [isSignedIn, isLoaded, user, location, setLocation, requiredRole]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#fbf8f1]" role="status" aria-label="Loading authentication">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#8f754b] border-t-transparent" />
          <p className="mt-4 font-editorial text-lg text-[#342f29]">Verifying authentication…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return null;
  }

  return <Component />;
}
