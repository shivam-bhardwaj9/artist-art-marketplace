import React, { useState, FormEvent } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowRight, User, Palette, Shield, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../auth-provider';

export function getSafeReturnUrl(defaultFallback = '/'): string {
  if (typeof window === 'undefined') return defaultFallback;
  const searchParams = new URLSearchParams(window.location.search);
  const rawTarget = searchParams.get('returnTo') || searchParams.get('redirect') || '';
  const action = searchParams.get('action');
  const artworkId = searchParams.get('artworkId');
  const artistId = searchParams.get('artistId');

  let target = defaultFallback;
  // Enforce internal relative path only (prevent open redirects)
  if (rawTarget && rawTarget.startsWith('/') && !rawTarget.startsWith('//') && !rawTarget.includes('://')) {
    target = rawTarget;
  }

  // Preserve query parameters if specified separately
  const extra = new URLSearchParams();
  if (action && !target.includes('action=')) extra.set('action', action);
  if (artworkId && !target.includes('artworkId=')) extra.set('artworkId', artworkId);
  if (artistId && !target.includes('artistId=')) extra.set('artistId', artistId);

  const extraStr = extra.toString();
  if (extraStr) {
    target = target.includes('?') ? `${target}&${extraStr}` : `${target}?${extraStr}`;
  }

  return target;
}

export function BrandHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#342f29] font-editorial text-lg text-[#fbf8f1]">
        F
      </div>
      <div>
        <span className="font-editorial text-xl tracking-tight text-[#342f29]">Forma</span>
        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-[#8f754b]">Gallery</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. Buyer Login: /buyer/login
// -------------------------------------------------------------
export function BuyerLoginPage() {
  const { signIn, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnUrl = getSafeReturnUrl('/');

  // If already logged in, redirect
  if (isSignedIn) {
    setLocation(returnUrl);
    return null;
  }

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    signIn('buyer', email.split('@')[0] || 'Collector', email);
    setLocation(returnUrl);
  };

  const handleQuickLogin = (name = 'Elena Rostova', userEmail = 'elena@forma.gallery') => {
    setIsSubmitting(true);
    signIn('buyer', name, userEmail);
    setLocation(returnUrl);
  };

  return (
    <div className="grain flex min-h-[100dvh] flex-col items-center justify-center bg-[#eee7db] px-4 py-12">
      <div className="mb-8">
        <BrandHeader />
      </div>

      <div className="w-full max-w-[440px] rounded-2xl border border-[#dfd5c7] bg-[#fbf8f1] p-8 shadow-sm">
        <div className="text-center">
          <p className="eyebrow text-[#8f754b]">Collector Sign In</p>
          <h1 className="mt-2 font-editorial text-3xl text-[#342f29]">Welcome Back</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#797064]">
            Sign in to explore original artworks, save to your collection, and acquire pieces.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Quick Demo Collector Login */}
        <div className="mt-6 rounded-xl border border-[#e2d5c3] bg-[#f3ecdf] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <User size={16} className="text-[#8f754b]" />
              <span className="text-xs font-medium text-[#463e33]">Demo Collector Account</span>
            </div>
            <span className="rounded bg-[#dfd3c0] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#635646]">
              Instant
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#786c5e]">Elena Rostova (Collector)</p>
          <button
            type="button"
            onClick={() => handleQuickLogin()}
            disabled={isSubmitting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#62513e] py-2.5 text-xs font-semibold text-[#fbf8f1] transition hover:bg-[#514231]"
            data-testid="button-quick-login-buyer"
          >
            Sign in as Collector <ArrowRight size={13} />
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#dfd5c7]" />
          </div>
          <span className="relative bg-[#fbf8f1] px-3 text-[10px] uppercase tracking-widest text-[#8a7f72]">
            Or enter email
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-buyer-email"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-buyer-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#342f29] bg-[#342f29] py-3 text-xs font-semibold uppercase tracking-widest text-[#fbf8f1] transition hover:bg-[#201d19]"
            data-testid="button-buyer-submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in to Gallery'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#dfd5c7] pt-4 text-center">
          <p className="text-xs text-[#797064]">
            Don't have an account?{' '}
            <Link href="/buyer/register" className="font-medium text-[#62513e] underline" data-testid="link-buyer-register">
              Create account
            </Link>
          </p>
          <p className="mt-3 text-xs text-[#8f754b]">
            Are you an artist?{' '}
            <Link href="/artist/login" className="underline" data-testid="link-switch-artist">
              Artist Studio Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Buyer Register: /buyer/register
// -------------------------------------------------------------
export function BuyerRegisterPage() {
  const { signIn, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnUrl = getSafeReturnUrl('/');

  if (isSignedIn) {
    setLocation(returnUrl);
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    signIn('buyer', name || 'Collector', email || 'collector@forma.gallery');
    setLocation(returnUrl);
  };

  return (
    <div className="grain flex min-h-[100dvh] flex-col items-center justify-center bg-[#eee7db] px-4 py-12">
      <div className="mb-8">
        <BrandHeader />
      </div>

      <div className="w-full max-w-[440px] rounded-2xl border border-[#dfd5c7] bg-[#fbf8f1] p-8 shadow-sm">
        <div className="text-center">
          <p className="eyebrow text-[#8f754b]">Join the Gallery</p>
          <h1 className="mt-2 font-editorial text-3xl text-[#342f29]">Create Collector Account</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#797064]">
            Follow original artists, build your wishlist, and collect one-of-a-kind art.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elena Rostova"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-register-name"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@domain.com"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-register-email"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-register-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#62513e] py-3 text-xs font-semibold uppercase tracking-widest text-[#fbf8f1] transition hover:bg-[#514231]"
            data-testid="button-register-submit"
          >
            {isSubmitting ? 'Creating account…' : 'Complete Registration'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#dfd5c7] pt-4 text-center">
          <p className="text-xs text-[#797064]">
            Already have an account?{' '}
            <Link href="/buyer/login" className="font-medium text-[#62513e] underline" data-testid="link-to-buyer-login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. Artist Login: /artist/login
// -------------------------------------------------------------
export function ArtistLoginPage() {
  const { signIn, isSignedIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnUrl = getSafeReturnUrl('/artist/dashboard');

  if (isSignedIn && user?.role === 'artist') {
    setLocation(returnUrl);
    return null;
  }

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    signIn('artist', email.split('@')[0] || 'Studio Artist', email || 'artist@mirasenstudio.com');
    setLocation(returnUrl);
  };

  const handleQuickLogin = () => {
    setIsSubmitting(true);
    signIn('artist', 'Mira Sen', 'mira@mirasenstudio.com');
    setLocation(returnUrl);
  };

  return (
    <div className="grain flex min-h-[100dvh] flex-col items-center justify-center bg-[#eee7db] px-4 py-12">
      <div className="mb-8">
        <BrandHeader />
      </div>

      <div className="w-full max-w-[440px] rounded-2xl border border-[#dfd5c7] bg-[#fbf8f1] p-8 shadow-sm">
        <div className="text-center">
          <p className="eyebrow text-[#8f754b]">Artist Studio</p>
          <h1 className="mt-2 font-editorial text-3xl text-[#342f29]">Artist Sign In</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#797064]">
            Manage your artwork listings, view studio orders, and manage sales.
          </p>
        </div>

        {/* Quick Demo Artist Login */}
        <div className="mt-6 rounded-xl border border-[#e2d5c3] bg-[#f3ecdf] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Palette size={16} className="text-[#8f754b]" />
              <span className="text-xs font-medium text-[#463e33]">Studio Artist Account</span>
            </div>
            <span className="rounded bg-[#dfd3c0] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#635646]">
              Instant
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#786c5e]">Mira Sen (Studio Artist)</p>
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={isSubmitting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#342f29] py-2.5 text-xs font-semibold text-[#fbf8f1] transition hover:bg-[#201d19]"
            data-testid="button-quick-login-artist"
          >
            Enter Artist Studio <ArrowRight size={13} />
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#dfd5c7]" />
          </div>
          <span className="relative bg-[#fbf8f1] px-3 text-[10px] uppercase tracking-widest text-[#8a7f72]">
            Or enter credentials
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Studio Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mira@mirasenstudio.com"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-artist-email"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-artist-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#62513e] py-3 text-xs font-semibold uppercase tracking-widest text-[#fbf8f1] transition hover:bg-[#514231]"
            data-testid="button-artist-submit"
          >
            {isSubmitting ? 'Entering studio…' : 'Sign in to Studio'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#dfd5c7] pt-4 text-center">
          <p className="text-xs text-[#797064]">
            New artist?{' '}
            <Link href="/artist/register" className="font-medium text-[#62513e] underline" data-testid="link-artist-register">
              Apply for an artist studio
            </Link>
          </p>
          <p className="mt-3 text-xs text-[#8f754b]">
            Looking to buy art?{' '}
            <Link href="/buyer/login" className="underline" data-testid="link-switch-buyer">
              Collector Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Artist Register: /artist/register
// -------------------------------------------------------------
export function ArtistRegisterPage() {
  const { signIn, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [medium, setMedium] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnUrl = getSafeReturnUrl('/artist/dashboard');

  if (isSignedIn) {
    setLocation(returnUrl);
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    signIn('artist', name || 'Studio Artist', email || 'artist@studio.com');
    setLocation(returnUrl);
  };

  return (
    <div className="grain flex min-h-[100dvh] flex-col items-center justify-center bg-[#eee7db] px-4 py-12">
      <div className="mb-8">
        <BrandHeader />
      </div>

      <div className="w-full max-w-[440px] rounded-2xl border border-[#dfd5c7] bg-[#fbf8f1] p-8 shadow-sm">
        <div className="text-center">
          <p className="eyebrow text-[#8f754b]">Artist Representation</p>
          <h1 className="mt-2 font-editorial text-3xl text-[#342f29]">Join as an Artist</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#797064]">
            Build your storefront, share your creative story, and reach independent collectors directly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Artist / Studio Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-artist-register-name"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maya@studio.art"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-artist-register-email"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Primary Medium / Practice</label>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="e.g. Oil on linen, Ceramic sculpture"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-artist-register-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#342f29] py-3 text-xs font-semibold uppercase tracking-widest text-[#fbf8f1] transition hover:bg-[#201d19]"
            data-testid="button-artist-register-submit"
          >
            {isSubmitting ? 'Opening studio…' : 'Open Artist Studio'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#dfd5c7] pt-4 text-center">
          <p className="text-xs text-[#797064]">
            Already represented?{' '}
            <Link href="/artist/login" className="font-medium text-[#62513e] underline" data-testid="link-to-artist-login">
              Sign in to Studio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. Admin Login: /admin/login
// -------------------------------------------------------------
export function AdminLoginPage() {
  const { signIn, isSignedIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnUrl = getSafeReturnUrl('/admin/dashboard');

  if (isSignedIn && user?.role === 'admin') {
    setLocation(returnUrl);
    return null;
  }

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    signIn('admin', 'Forma Curator', email || 'curator@forma.gallery');
    setLocation(returnUrl);
  };

  const handleQuickLogin = () => {
    setIsSubmitting(true);
    signIn('admin', 'Forma Curator', 'curator@forma.gallery');
    setLocation(returnUrl);
  };

  return (
    <div className="grain flex min-h-[100dvh] flex-col items-center justify-center bg-[#eee7db] px-4 py-12">
      <div className="mb-8">
        <BrandHeader />
      </div>

      <div className="w-full max-w-[440px] rounded-2xl border border-[#dfd5c7] bg-[#fbf8f1] p-8 shadow-sm">
        <div className="text-center">
          <p className="eyebrow text-[#8f754b]">Administration</p>
          <h1 className="mt-2 font-editorial text-3xl text-[#342f29]">Curator Portal</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#797064]">
            Review submissions, manage categories, curate artists, and monitor platform orders.
          </p>
        </div>

        {/* Quick Demo Admin Login */}
        <div className="mt-6 rounded-xl border border-[#e2d5c3] bg-[#f3ecdf] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield size={16} className="text-[#8f754b]" />
              <span className="text-xs font-medium text-[#463e33]">Curator Credentials</span>
            </div>
            <span className="rounded bg-[#dfd3c0] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#635646]">
              Admin
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#786c5e]">Forma Curator & Operations</p>
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={isSubmitting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#342f29] py-2.5 text-xs font-semibold text-[#fbf8f1] transition hover:bg-[#201d19]"
            data-testid="button-quick-login-admin"
          >
            Access Curator Console <ArrowRight size={13} />
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#dfd5c7]" />
          </div>
          <span className="relative bg-[#fbf8f1] px-3 text-[10px] uppercase tracking-widest text-[#8a7f72]">
            Or enter admin credentials
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="curator@forma.gallery"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-admin-email"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#60574c]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-[#dfd5c7] bg-[#fffdf8] px-3.5 py-2 text-sm text-[#342f29] outline-none focus:border-[#8f754b]"
              data-testid="input-admin-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#62513e] py-3 text-xs font-semibold uppercase tracking-widest text-[#fbf8f1] transition hover:bg-[#514231]"
            data-testid="button-admin-submit"
          >
            {isSubmitting ? 'Verifying credentials…' : 'Sign in as Curator'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#dfd5c7] pt-4 text-center">
          <p className="text-xs text-[#797064]">
            Collector or Artist?{' '}
            <Link href="/buyer/login" className="font-medium text-[#62513e] underline" data-testid="link-to-buyer-login-from-admin">
              Return to Buyer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
