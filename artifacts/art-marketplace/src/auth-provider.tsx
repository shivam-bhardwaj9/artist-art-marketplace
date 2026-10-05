import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import {
  ClerkProvider as RealClerkProvider,
  Show as RealShow,
  SignIn as RealSignIn,
  SignUp as RealSignUp,
  useClerk as useRealClerk,
  useUser as useRealUser,
} from '@clerk/react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'buyer' | 'artist' | 'admin';
}

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: AuthUser | null;
  signIn: (role?: 'buyer' | 'artist' | 'admin', name?: string, email?: string) => void;
  signOut: (options?: { redirectUrl?: string }) => void;
  addListener: (callback: (state: { user: { id: string } | null }) => void) => () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function isValidClerkKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) return false;
  try {
    const raw = key.replace(/^pk_(test|live)_/, '');
    const b64 = raw.endsWith('$') ? raw.slice(0, -1) : raw;
    const decoded = atob(b64);
    return decoded.includes('.') && decoded.length > 5;
  } catch {
    return false;
  }
}

export function MockClerkProvider({ children }: { children: ReactNode }) {
  // Use sessionStorage: fresh tab / incognito window begins explicitly unauthenticated
  const [session, setSession] = useState<{ token: string; user: AuthUser } | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('forma_auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.user) return parsed;
      } catch {}
    }
    return null;
  });

  const [isLoaded] = useState<boolean>(true);

  // Synchronize token getter with @workspace/api-client-react customFetch
  useEffect(() => {
    setAuthTokenGetter(() => {
      if (typeof window === 'undefined') return null;
      const raw = sessionStorage.getItem('forma_auth_session');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return parsed?.token || null;
        } catch {}
      }
      return null;
    });
  }, []);

  const listenersRef = useRef<Set<(state: { user: { id: string } | null }) => void>>(new Set());

  const signIn = useCallback((
    role: 'buyer' | 'artist' | 'admin' = 'buyer',
    name = 'Elena Rostova',
    email = 'elena@forma.gallery'
  ) => {
    // Generate isolated user ID based on role and email
    const safeEmailPrefix = email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'user';
    const userId = role === 'artist'
      ? (email.includes('mira') ? 'usr_mira_sen' : `usr_art_${safeEmailPrefix}`)
      : role === 'admin'
        ? 'usr_admin_curator'
        : (email.includes('elena') ? 'usr_forma_collector' : `usr_col_${safeEmailPrefix}`);

    const newUser: AuthUser = {
      id: userId,
      fullName: name,
      email,
      role,
    };

    const newSession = { token: userId, user: newUser };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('forma_auth_session', JSON.stringify(newSession));
    }
    setSession(newSession);

    // Notify listeners
    listenersRef.current.forEach((l) => l({ user: { id: newUser.id } }));
  }, []);

  const signOut = useCallback((options?: { redirectUrl?: string }) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('forma_auth_session');
    }
    setSession(null);

    listenersRef.current.forEach((l) => l({ user: null }));
    if (options?.redirectUrl && typeof window !== 'undefined') {
      window.location.href = options.redirectUrl;
    }
  }, []);

  const addListener = useCallback((callback: (state: { user: { id: string } | null }) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const contextValue = useMemo(() => ({
    isSignedIn: Boolean(session?.token),
    isLoaded,
    user: session?.user || null,
    signIn,
    signOut,
    addListener,
  }), [session, isLoaded, signIn, signOut, addListener]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context) return context;

  // Fallback if rendered outside provider
  return {
    isSignedIn: false,
    isLoaded: true,
    user: null,
    signIn: () => {},
    signOut: () => {},
    addListener: () => () => {},
  };
}

export function useClerkSafe() {
  const auth = useAuth();
  const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (isValidClerkKey(rawKey)) {
    try {
      return useRealClerk();
    } catch {}
  }

  return useMemo(() => ({
    signOut: auth.signOut,
    addListener: auth.addListener,
    user: auth.user ? { id: auth.user.id, fullName: auth.user.fullName } : null,
    session: auth.isSignedIn ? { id: 'sess_mock' } : null,
    loaded: auth.isLoaded,
  }), [auth]);
}

export function ShowSafe({ when, children }: { when: 'signed-in' | 'signed-out'; children: ReactNode }) {
  const auth = useAuth();
  const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (isValidClerkKey(rawKey)) {
    return <RealShow when={when}>{children}</RealShow>;
  }

  if (when === 'signed-in' && auth.isSignedIn) return <>{children}</>;
  if (when === 'signed-out' && !auth.isSignedIn) return <>{children}</>;
  return null;
}

export function ClerkProviderSafe(props: any) {
  const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (isValidClerkKey(rawKey)) {
    return <RealClerkProvider {...props} />;
  }

  return <MockClerkProvider>{props.children}</MockClerkProvider>;
}
