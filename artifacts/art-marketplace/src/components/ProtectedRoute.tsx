import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../auth-provider';
import { ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';

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
        setLocation(`/artist/login?returnTo=${encodeURIComponent(location)}`);
      } else if (location.startsWith('/admin')) {
        setLocation(`/admin/login?returnTo=${encodeURIComponent(location)}`);
      } else {
        setLocation(`/buyer/login?returnTo=${encodeURIComponent(location)}`);
      }
    }
  }, [isSignedIn, isLoaded, location, setLocation]);

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

  // Check role authorization
  if (requiredRole && user?.role !== 'admin' && user?.role !== requiredRole) {
    const isArtistRequired = requiredRole === 'artist';
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm md:p-10" role="alert">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4ebe1] text-[#8f754b]">
            <ShieldAlert size={28} />
          </div>
          <p className="eyebrow mt-4 text-[#8f754b]">Access Restricted (403)</p>
          <h1 className="mt-2 font-editorial text-3xl md:text-4xl">
            {isArtistRequired ? 'Artist Studio Required' : 'Curator Access Required'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {isArtistRequired
              ? `You are signed in as a collector (${user?.email}). The studio dashboard is exclusively for artists managing and selling artwork.`
              : `Your account (${user?.email}) does not have curator/administrator privileges.`}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isArtistRequired ? (
              <>
                <Link
                  href={`/artist/login?returnTo=${encodeURIComponent(location)}`}
                  className="button-dark justify-center"
                  data-testid="link-login-artist-role"
                >
                  Sign in as artist <ArrowRight size={14} />
                </Link>
                <Link
                  href="/join"
                  className="button-outline justify-center"
                  data-testid="link-join-artist-role"
                >
                  Join as artist
                </Link>
              </>
            ) : (
              <Link
                href={`/admin/login?returnTo=${encodeURIComponent(location)}`}
                className="button-dark justify-center"
                data-testid="link-login-admin-role"
              >
                Sign in as admin <ArrowRight size={14} />
              </Link>
            )}
            <Link href="/" className="button-outline justify-center">
              <ArrowLeft size={14} /> Back to gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Component />;
}
