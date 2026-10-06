import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ClerkProviderSafe as ClerkProvider,
  ShowSafe as Show,
  useClerkSafe as useClerk,
  useAuth,
  isValidClerkKey,
} from './auth-provider';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  useAddCartItem, useChooseAccountRole, useCreateArtistArtwork, useCreateCheckout,
  useDeleteArtistArtwork, useFollowArtist, useGetAccount, useGetArtist,
  useGetArtistArtworks, useGetArtistDashboard, useGetArtwork, useGetBuyerDashboard,
  useGetCart, useGetMarketplaceHome, useGetWishlist, useHealthCheck,
  useListArtists, useListArtworks, useListCategories, useRemoveCartItem,
  useSaveArtwork, useUnfollowArtist, useUnsaveArtwork, useUpdateArtistArtwork,
  useUpdateArtistProfile, useUpdateCartItem, useGetAdminDashboard,
  useUpdateArtworkModerationStatus, getGetAccountQueryKey,
  getGetArtworkQueryKey, getGetArtistArtworksQueryKey, getGetArtistDashboardQueryKey, getGetArtistQueryKey,
  getGetBuyerDashboardQueryKey, getGetCartQueryKey, getGetMarketplaceHomeQueryKey,
  getGetWishlistQueryKey, getHealthCheckQueryKey, getListArtistsQueryKey,
  getListArtworksQueryKey, getListCategoriesQueryKey, getGetAdminDashboardQueryKey,
} from '@workspace/api-client-react';
import type { Artwork, ArtworkInput, Artist, CheckoutInput, ListArtworksParams } from '@workspace/api-client-react';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check,
  CircleUserRound, Filter, Heart, Menu, Minus, Plus,
  Search, ShoppingBag, Sparkles, X, Shield, Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { getArtworkImages, getArtworkPrimaryImage } from './lib/images';
import { ProtectedRoute } from './components/ProtectedRoute';
import { toast } from '@/hooks/use-toast';
import {
  BuyerLoginPage,
  BuyerRegisterPage,
  ArtistLoginPage,
  ArtistRegisterPage,
  AdminLoginPage,
} from './pages/AuthPages';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const basePath = (import.meta.env.BASE_PATH || '').replace(/\/$/, '');
const stripBase = (path: string) => {
  if (basePath && path.startsWith(basePath)) {
    const s = path.slice(basePath.length);
    return s.startsWith('/') ? s : `/${s}`;
  }
  return path;
};

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  publishableKeyFromHost(window.location.host);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#62513e', colorForeground: '#342f29', colorMutedForeground: '#797064',
    colorDanger: '#9b4a42', colorBackground: '#fbf8f1', colorInput: '#fffdf8',
    colorInputForeground: '#342f29', colorNeutral: '#dfd5c7', fontFamily: 'DM Sans',
    borderRadius: '0.6rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf8f1] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#dfd5c7]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-editorial text-[#342f29]',
    headerSubtitle: 'text-[#797064]',
    socialButtonsBlockButtonText: 'text-[#342f29]',
    formFieldLabel: 'text-[#51493f]',
    footerActionLink: 'text-[#62513e]',
    footerActionText: 'text-[#797064]',
    dividerText: 'text-[#797064]',
    identityPreviewEditButton: 'text-[#62513e]',
    formFieldSuccessText: 'text-[#456558]',
    alertText: 'text-[#763d37]',
    logoBox: 'mb-2',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#dfd5c7] bg-[#fffdf8]',
    formButtonPrimary: 'bg-[#62513e] hover:bg-[#514231] text-[#fbf8f1]',
    formFieldInput: 'border-[#dfd5c7] bg-[#fffdf8] text-[#342f29]',
    footerAction: 'border-t border-[#dfd5c7]',
    dividerLine: 'bg-[#dfd5c7]',
    alert: 'border-[#d7b2aa] bg-[#f8ece8]',
    otpCodeFieldInput: 'border-[#dfd5c7] bg-[#fffdf8] text-[#342f29]',
    formFieldRow: 'text-[#51493f]',
    main: 'text-[#342f29]',
  },
};

const localArtwork = [
  `${basePath}/artwork/after-the-rain.jpg`, `${basePath}/artwork/blue-hour.jpg`, `${basePath}/artwork/citrus-study.jpg`,
  `${basePath}/artwork/tidal-form.jpg`, `${basePath}/artwork/quiet-room.jpg`, `${basePath}/artwork/soft-architecture.jpg`,
  `${basePath}/artwork/wild-garden.jpg`, `${basePath}/artwork/folded-vessel.jpg`,
];
const fallbackImage = (id: number) => localArtwork[Math.abs(id) % localArtwork.length];
const money = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0,
}).format(amount);

function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo">
    <img src={`${basePath}/logo.svg`} alt="Forma" className="h-9 w-9" />
    {!compact && <span className="font-editorial text-[23px] tracking-[-.04em]">forma<span className="text-[#a78c5c]">.</span></span>}
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, isSignedIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });

  const handleSignOut = () => {
    signOut();
    setLocation('/buyer/login');
  };

  return <div className="min-h-[100dvh] bg-background text-foreground">
    <div className="border-b border-border/80 bg-[#eee7da] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[.19em] text-muted-foreground" data-testid="text-shipping-note">
      Original art, thoughtfully found <span className="mx-2 text-[#ae9361]">·</span> Complimentary shipping over $250
    </div>
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-12">
          <BrandMark />
          <nav className="hidden items-center gap-8 text-[12px] tracking-[.04em] text-[#5d564d] lg:flex" aria-label="Main navigation">
            <Link href="/artworks" className="nav-link" data-testid="link-artworks">Artworks</Link>
            <Link href="/artists" className="nav-link" data-testid="link-artists">Artists</Link>
            {user?.role === 'artist' ? (
              <Link href="/artist/dashboard" className="nav-link font-medium text-[#8f754b]" data-testid="link-studio">My Studio</Link>
            ) : user?.role === 'admin' ? (
              <Link href="/admin/dashboard" className="nav-link font-medium text-[#8f754b]" data-testid="link-admin">Curator Dashboard</Link>
            ) : (
              <Link href="/join" className="nav-link" data-testid="link-join">Sell with us</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-5">
          <Link href="/artworks" className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-secondary sm:flex" aria-label="Search artworks" data-testid="link-search">
            <Search size={17} strokeWidth={1.5} />
          </Link>
          <Link href="/account" className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-secondary sm:flex" aria-label="Your account" data-testid="link-account">
            <CircleUserRound size={18} strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-secondary sm:flex" aria-label="Wishlist" data-testid="link-wishlist">
            <Heart size={18} strokeWidth={1.5} />
          </Link>
          <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-secondary" aria-label="Shopping bag" data-testid="link-cart">
            <ShoppingBag size={18} strokeWidth={1.5} />
          </Link>
          {isSignedIn ? (
            <button onClick={handleSignOut} className="hidden text-[11px] uppercase tracking-[.14em] text-muted-foreground transition hover:text-foreground md:block" data-testid="button-sign-out">
              Sign out
            </button>
          ) : (
            <Link href="/buyer/login" className="hidden text-[11px] uppercase tracking-[.14em] text-muted-foreground transition hover:text-foreground md:block" data-testid="link-sign-in">
              Sign in
            </Link>
          )}
          <button className="flex h-10 w-10 items-center justify-center lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && <nav className="grid gap-1 border-t border-border bg-background px-5 py-4 lg:hidden" data-testid="navigation-mobile">
        {[['Discover art', '/artworks'], ['Meet the artists', '/artists'], ['Your account', '/account'], ['Wishlist', '/wishlist'], ['Sell with us', '/join']].map(([label, href]) =>
          <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="py-3 text-sm" data-testid={`link-mobile-${href.slice(1)}`}>{label}</Link>)}
        {isSignedIn && (
          <button onClick={handleSignOut} className="py-3 text-left text-sm text-muted-foreground">Sign out</button>
        )}
      </nav>}
    </header>
    {health.isError && <div className="hidden" role="status" data-testid="status-health-error">Marketplace connection needs attention.</div>}
    <main>{children}</main>
    <footer className="mt-24 bg-[#292922] text-[#f2ecdf]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div><BrandMark /><p className="mt-5 max-w-xs text-sm leading-6 text-[#c6bfb2]">A more human way to find art. Every piece has a maker, a place, and a story.</p></div>
        <div><p className="eyebrow text-[#c5a970]">Explore</p><div className="mt-5 grid gap-3 text-sm text-[#c6bfb2]"><Link href="/artworks" data-testid="link-footer-artworks">Artworks</Link><Link href="/artists" data-testid="link-footer-artists">Artists</Link><Link href="/wishlist" data-testid="link-footer-wishlist">Saved art</Link></div></div>
        <div><p className="eyebrow text-[#c5a970]">For artists</p><div className="mt-5 grid gap-3 text-sm text-[#c6bfb2]"><Link href="/join" data-testid="link-footer-join">Join the gallery</Link><Link href="/artist/dashboard" data-testid="link-footer-dashboard">Studio dashboard</Link></div></div>
        <div><p className="eyebrow text-[#c5a970]">Stay curious</p><p className="mt-5 text-sm leading-6 text-[#c6bfb2]">A considered collection of new work, notes from artists, and things worth looking at.</p></div>
      </div>
      <div className="mx-auto flex max-w-[1440px] justify-between border-t border-white/10 px-6 py-5 text-[10px] uppercase tracking-[.15em] text-[#aaa397] md:px-10"><span>© Forma Gallery 2025</span><span>Art, made personal.</span></div>
    </footer>
  </div>;
}

function PageTitle({ kicker, title, detail }: { kicker: string; title: string; detail?: string }) {
  return <div className="mb-10 max-w-3xl reveal"><p className="eyebrow text-[#927a52]">{kicker}</p><h1 className="mt-4 font-editorial text-4xl leading-[1.05] tracking-[-.045em] md:text-6xl">{title}</h1>{detail && <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">{detail}</p>}</div>;
}
function LoadingState({ label = 'Gathering the collection' }: { label?: string }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-4" aria-label={label} data-testid="state-loading">
    {Array.from({ length: 4 }, (_, i) => <div key={i} className="animate-pulse"><div className="aspect-[4/5] bg-[#e9e1d4]" /><div className="mt-4 h-3 w-2/3 bg-[#e9e1d4]" /><div className="mt-2 h-3 w-1/2 bg-[#e9e1d4]" /></div>)}
  </div>;
}
function QueryError({ retry, label = 'We couldn’t load this just now.' }: { retry: () => void; label?: string }) {
  return <div className="my-12 border border-border bg-card px-6 py-10 text-center" role="alert" data-testid="state-error">
    <p className="font-editorial text-2xl">{label}</p><p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
    <button onClick={retry} className="button-dark mt-6" data-testid="button-retry">Try again <ArrowRight size={15} /></button>
  </div>;
}
function EmptyState({ title, copy, href, action }: { title: string; copy: string; href?: string; action?: string }) {
  return <div className="my-10 border border-dashed border-[#cfc3b1] bg-[#f0eadf] px-6 py-16 text-center" data-testid="state-empty">
    <Sparkles className="mx-auto text-[#a78c5c]" size={22} strokeWidth={1.3} /><h2 className="mt-4 font-editorial text-2xl">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{copy}</p>
    {href && action && <Link href={href} className="button-dark mt-6" data-testid="link-empty-action">{action}<ArrowRight size={15} /></Link>}
  </div>;
}

function ArtworkCard({ artwork, index = 0 }: { artwork: Artwork; index?: number }) {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const save = useSaveArtwork();
  const unsave = useUnsaveArtwork();
  const add = useAddCartItem();
  const wishlist = useGetWishlist({ query: { queryKey: getGetWishlistQueryKey(), enabled: isSignedIn } });
  const saved = wishlist.data?.some(item => item.id === artwork.id) ?? false;
  const busy = save.isPending || unsave.isPending || add.isPending;

  const toggleSave = () => {
    if (!isSignedIn) {
      setLocation(`/buyer/login?returnTo=${encodeURIComponent(`/artworks/${artwork.id}`)}&action=wishlist&artworkId=${artwork.id}`);
      return;
    }
    return saved
      ? unsave.mutate({ artworkId: artwork.id }, {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: 'Removed from collection', description: `"${artwork.title}" was removed from your wishlist.` });
          },
        })
      : save.mutate({ artworkId: artwork.id }, {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: 'Saved to collection', description: `"${artwork.title}" was saved to your wishlist.` });
          },
        });
  };

  const addToBag = () => {
    if (!isSignedIn) {
      setLocation(`/buyer/login?returnTo=${encodeURIComponent(`/artworks/${artwork.id}`)}&action=add-to-cart&artworkId=${artwork.id}`);
      return;
    }
    add.mutate({ data: { artworkId: artwork.id, quantity: 1 } }, {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: 'Added to bag', description: `"${artwork.title}" was added to your cart.` });
      },
    });
  };

  const primaryImg = getArtworkPrimaryImage(artwork);

  return <motion.article className="group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: Math.min(index * .06, .3) }} data-testid={`card-artwork-${artwork.id}`}>
    <div className="relative overflow-hidden bg-[#e9e2d7]">
      <Link href={`/artworks/${artwork.id}`} className="block" data-testid={`link-artwork-${artwork.id}`}>
        <img src={primaryImg} alt={artwork.title} onError={e => { e.currentTarget.src = fallbackImage(artwork.id); }} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.035]" loading={index > 4 ? 'lazy' : 'eager'} data-testid={`img-artwork-${artwork.id}`} />
      </Link>
      {artwork.featured && <span className="absolute left-3 top-3 bg-[#f8f4eb]/95 px-3 py-1.5 text-[9px] uppercase tracking-[.15em]">Curator’s pick</span>}
      <button onClick={toggleSave} disabled={busy} aria-label={saved ? 'Remove from wishlist' : 'Save artwork'} className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4eb]/95 transition hover:bg-white disabled:opacity-50 ${saved ? 'text-[#9a5348]' : 'text-[#4b453b]'}`} data-testid={`button-save-${artwork.id}`}>
        <Heart size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
      </button>
      <button onClick={addToBag} disabled={busy} className="absolute bottom-3 left-3 right-3 flex translate-y-3 items-center justify-center gap-2 bg-[#322f29]/95 py-3 text-[10px] uppercase tracking-[.15em] text-[#faf6ed] opacity-0 transition duration-300 hover:bg-[#574a37] group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 disabled:opacity-60" data-testid={`button-add-cart-${artwork.id}`}>
        <ShoppingBag size={14} /> {add.isPending ? 'Adding…' : 'Add to bag'}
      </button>
    </div>
    <div className="flex items-start justify-between gap-3 pt-4">
      <div className="min-w-0"><Link href={`/artworks/${artwork.id}`} className="block truncate font-editorial text-[19px] leading-6 hover:text-[#8f754b]" data-testid={`text-title-${artwork.id}`}>{artwork.title}</Link>
        <Link href={`/artist/${artwork.artist?.slug || 'artist'}`} className="mt-1 block truncate text-[11px] tracking-[.04em] text-muted-foreground hover:text-foreground" data-testid={`link-artist-${artwork.id}`}>{artwork.artist?.displayName || 'Artist'}</Link></div>
      <span className="shrink-0 pt-1 text-xs" data-testid={`text-price-${artwork.id}`}>{money(artwork.price, artwork.currency)}</span>
    </div>
    {(add.isError || save.isError || unsave.isError) && <p role="status" className="mt-2 text-xs text-destructive" data-testid={`status-artwork-action-${artwork.id}`}>Sign in to save or shop this artwork.</p>}
  </motion.article>;
}

function ArtistCard({ artist }: { artist: Artist }) {
  return <Link href={`/artist/${artist.slug}`} className="group grid grid-cols-[76px_1fr] items-center gap-4 border-b border-border py-5 transition hover:pl-2" data-testid={`card-artist-${artist.id}`}>
    {artist.imageUrl ? <img src={artist.imageUrl} alt="" className="h-[76px] w-[76px] rounded-full object-cover" data-testid={`img-artist-${artist.id}`} /> : <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#e7ddcc] font-editorial text-xl" data-testid={`avatar-artist-${artist.id}`}>{artist.displayName.slice(0, 1)}</span>}
    <span><span className="block font-editorial text-xl group-hover:text-[#8f754b]" data-testid={`text-artist-name-${artist.id}`}>{artist.displayName}</span><span className="mt-1 block text-xs text-muted-foreground">{artist.location}</span><span className="mt-2 block text-[10px] uppercase tracking-[.15em] text-[#8f754b]">{artist.artworkCount} works · {artist.followerCount.toLocaleString()} followers</span></span>
  </Link>;
}

function HomePage() {
  const [, setLocation] = useLocation();
  const home = useGetMarketplaceHome({ query: { queryKey: getGetMarketplaceHomeQueryKey() } });
  const [search, setSearch] = useState('');
  const submitSearch = (e: FormEvent) => { e.preventDefault(); setLocation(`/artworks?q=${encodeURIComponent(search)}`); };
  return <Shell><section className="relative mx-auto grid max-w-[1440px] overflow-hidden px-5 pb-16 pt-10 md:grid-cols-[.92fr_1.08fr] md:px-10 md:pb-24 md:pt-16">
    <div className="relative z-10 flex flex-col justify-center pb-10 md:pb-0">
      <p className="eyebrow text-[#927a52] reveal">The independent art gallery</p>
      <h1 className="mt-5 max-w-[620px] font-editorial text-[clamp(3.4rem,7.7vw,7.1rem)] leading-[.94] tracking-[-.065em] reveal">Find the piece<br />that feels like <i className="font-normal text-[#937650]">you.</i></h1>
      <p className="mt-7 max-w-[410px] text-[15px] leading-7 text-[#6a6257] reveal">Original work from independent artists, chosen for the way it makes a room feel — and the story it brings with it.</p>
      <form onSubmit={submitSearch} className="mt-8 flex max-w-[450px] border-b border-[#9f9179] pb-2 reveal">
        <Search size={18} className="mt-1 shrink-0 text-[#897958]" strokeWidth={1.5} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by feeling, form, or artist" className="ml-3 min-w-0 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-[#9a9285]" aria-label="Search artworks" data-testid="input-home-search" />
        <button className="flex items-center gap-1 text-[10px] uppercase tracking-[.16em]" data-testid="button-home-search">Explore<ArrowRight size={14} /></button>
      </form>
      <div className="mt-8 flex gap-8 text-[10px] uppercase tracking-[.14em] text-muted-foreground"><span>One of a kind</span><span>Artist direct</span><span>Made to keep</span></div>
    </div>
    <div className="relative min-h-[450px] md:min-h-[620px]">
      <div className="absolute inset-0 left-[8%] bg-[#e8dfd2]" />
      <div className="absolute inset-y-[5%] left-[14%] right-[8%] overflow-hidden bg-[#d6c6ac]">
        <img src={home.data?.featuredArtworks?.[0]?.imageUrl || localArtwork[0]} alt={home.data?.featuredArtworks?.[0]?.title || 'Abstract original artwork in warm rose and ochre'} onError={e => { e.currentTarget.src = localArtwork[0]; }} className="h-full w-full object-cover transition duration-1000 hover:scale-[1.025]" data-testid="img-hero-artwork" />
      </div>
      <div className="absolute bottom-[4%] left-0 max-w-[270px] bg-[#faf6ed] p-5 shadow-sm md:bottom-[9%]">
        <p className="eyebrow text-[#927a52]">A gallery of real lives</p><p className="mt-2 font-editorial text-2xl leading-tight">Every artwork begins somewhere.</p><Link href="/artists" className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.15em]" data-testid="link-hero-artists">Meet the makers <ArrowUpRight size={14} /></Link>
      </div>
    </div>
  </section>
  <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow text-[#927a52]">The collection</p><h2 className="mt-2 font-editorial text-4xl leading-tight tracking-[-.04em] md:text-5xl">Featured work</h2></div><Link href="/artworks" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.16em]" data-testid="link-all-artworks">View all pieces <ArrowRight size={14} /></Link></div>
    {home.isLoading ? <LoadingState /> : home.isError ? <QueryError retry={() => home.refetch()} /> : <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{home.data?.featuredArtworks?.slice(0, 8).map((art, i) => <ArtworkCard key={art.id} artwork={art} index={i} />)}</div>}
  </section></Shell>;
}

function ArtworksPage() {
  const [params, setParams] = useState<ListArtworksParams>(() => {
    const current = new URLSearchParams(window.location.search);
    return { q: current.get('q') || undefined, category: current.get('category') || undefined, sort: (current.get('sort') as ListArtworksParams['sort']) || 'featured', limit: 24, page: 1 };
  });
  const [search, setSearch] = useState(params.q || '');
  const arts = useListArtworks(params, { query: { queryKey: getListArtworksQueryKey(params) } });
  const cats = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const searchSubmit = (e: FormEvent) => { e.preventDefault(); setParams(p => ({ ...p, q: search || undefined, page: 1 })); };
  const update = (key: keyof ListArtworksParams, value: string) => setParams(p => ({ ...p, [key]: value || undefined, page: 1 }));
  return <Shell><section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
    <PageTitle kicker="The gallery" title="Art with a life of its own." detail="Originals and limited editions, made by independent artists and chosen to be lived with." />
    <div className="mb-8 flex flex-col justify-between gap-4 border-y border-border py-4 md:flex-row md:items-center">
      <form onSubmit={searchSubmit} className="flex min-w-[240px] flex-1 items-center gap-3 md:max-w-md"><Search size={17} className="text-[#8d7959]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artworks or artists" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" data-testid="input-artwork-search" /><button className="sr-only" data-testid="button-search-submit">Search</button></form>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[10px] uppercase tracking-[.12em] text-muted-foreground"><Filter size={14} /> Medium</label>
        <select aria-label="Filter by category" value={params.category || ''} onChange={e => update('category', e.target.value)} className="select-editorial" data-testid="select-artwork-category"><option value="">All categories</option>{cats.data?.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
        <select aria-label="Sort artworks" value={params.sort || 'featured'} onChange={e => update('sort', e.target.value)} className="select-editorial" data-testid="select-artwork-sort"><option value="featured">Curator’s picks</option><option value="newest">Newest</option><option value="popular">Most loved</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
      </div>
    </div>
    <p className="mb-5 text-[10px] uppercase tracking-[.15em] text-muted-foreground" data-testid="text-artwork-count">{arts.data ? `${arts.data.total} works to discover` : 'A thoughtful selection'}</p>
    {arts.isLoading ? <LoadingState /> : arts.isError ? <QueryError retry={() => arts.refetch()} /> : arts.data?.items.length ? <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4" data-testid="grid-artworks">{arts.data.items.map((art, i) => <ArtworkCard key={art.id} artwork={art} index={i} />)}</div>
      {(arts.data.total > (params.page || 1) * (params.limit || 24) || (params.page || 1) > 1) && <div className="mt-14 flex justify-center gap-3">
        {(params.page || 1) > 1 && <button className="button-outline" onClick={() => setParams(p => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))} data-testid="button-previous-page"><ArrowLeft size={15} /> Previous</button>}
        {arts.data.total > (params.page || 1) * (params.limit || 24) && <button className="button-outline" onClick={() => setParams(p => ({ ...p, page: (p.page || 1) + 1 }))} data-testid="button-next-page">Next page <ArrowDownRight size={15} /></button>}
      </div>}
    </> : <EmptyState title="Nothing in this frame yet" copy="Try a different search, or clear your filters and wander through the whole gallery." href="/artworks" action="Clear your search" />}
  </section></Shell>;
}

function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const artworkId = Number(id);
  const query = useGetArtwork(artworkId, { query: { enabled: Number.isFinite(artworkId), queryKey: getGetArtworkQueryKey(artworkId) } });
  const client = useQueryClient();
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const add = useAddCartItem();
  const save = useSaveArtwork();
  const item: any = query.data?.artwork || query.data;

  // Auto-continuation effect when returning from login - MUST be called unconditionally before early returns
  const actionExecutedRef = useRef(false);
  useEffect(() => {
    if (!isSignedIn || !item?.id || actionExecutedRef.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    const targetArtworkId = Number(searchParams.get('artworkId'));

    if (action && (!targetArtworkId || targetArtworkId === item.id)) {
      actionExecutedRef.current = true;
      window.history.replaceState({}, '', window.location.pathname);

      if (action === 'add-to-cart') {
        add.mutate({ data: { artworkId: item.id, quantity: 1 } }, {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getGetCartQueryKey() });
            toast({ title: 'Added to cart', description: `"${item.title}" was added to your bag.` });
          },
        });
      } else if (action === 'buy-now') {
        add.mutate({ data: { artworkId: item.id, quantity: 1 } }, {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getGetCartQueryKey() });
            setLocation('/cart');
          },
        });
      } else if (action === 'wishlist') {
        save.mutate({ artworkId: item.id }, {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: 'Saved to collection', description: `"${item.title}" was saved to your wishlist.` });
          },
        });
      }
    }
  }, [isSignedIn, item?.id, item?.title, add, save, client, setLocation]);

  if (query.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (query.isError || !item) return <Shell><div className="mx-auto max-w-5xl px-5 py-14"><QueryError retry={() => query.refetch()} label="This artwork has slipped out of view." /></div></Shell>;

  const primaryImg = getArtworkPrimaryImage(item);
  const allImages = getArtworkImages(item);

  const addToBag = () => {
    if (!isSignedIn) {
      setLocation(`/buyer/login?returnTo=${encodeURIComponent(`/artworks/${item.id}`)}&action=add-to-cart&artworkId=${item.id}`);
      return;
    }
    add.mutate({ data: { artworkId: item.id, quantity: 1 } }, {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: 'Added to cart', description: `"${item.title}" was added to your bag.` });
      },
    });
  };

  const buyNow = () => {
    if (!isSignedIn) {
      setLocation(`/buyer/login?returnTo=${encodeURIComponent('/cart')}&action=buy-now&artworkId=${item.id}`);
      return;
    }
    add.mutate({ data: { artworkId: item.id, quantity: 1 } }, {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: getGetCartQueryKey() });
        setLocation('/cart');
      },
    });
  };

  const saveForLater = () => {
    if (!isSignedIn) {
      setLocation(`/buyer/login?returnTo=${encodeURIComponent(`/artworks/${item.id}`)}&action=wishlist&artworkId=${item.id}`);
      return;
    }
    save.mutate({ artworkId: item.id }, {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        toast({ title: 'Saved to collection', description: `"${item.title}" was saved to your wishlist.` });
      },
    });
  };

  return <Shell><section className="mx-auto grid max-w-[1440px] gap-9 px-5 py-10 md:grid-cols-[1.12fr_.88fr] md:gap-16 md:px-10 md:py-16">
    <div className="bg-[#e6ded1]">
      <img src={primaryImg} alt={item.title} onError={e => { e.currentTarget.src = fallbackImage(item.id); }} className="w-full object-cover" data-testid="img-artwork-detail" />
      {allImages.length > 1 && (
        <div className="grid grid-cols-2 gap-3 pt-3">
          {allImages.slice(1, 3).map((url, i) => (
            <img key={url} src={url} alt={`${item.title}, view ${i + 2}`} className="w-full object-cover" />
          ))}
        </div>
      )}
    </div>
    <div className="flex flex-col justify-center py-5 md:sticky md:top-28 md:self-start">
      <Link href="/artworks" className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.15em] text-muted-foreground" data-testid="link-back-artworks">
        <ArrowLeft size={14} /> Back to the gallery
      </Link>
      <p className="eyebrow text-[#927a52]">{item.category} <span className="mx-2">/</span> {item.artworkType}</p>
      <h1 className="mt-4 font-editorial text-5xl leading-[1.04] tracking-[-.05em] md:text-6xl" data-testid="text-artwork-detail-title">{item.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">An original work by <Link href={`/artist/${item.artist?.slug || 'artist'}`} className="underline decoration-[#b9a27a] underline-offset-4" data-testid="link-artwork-artist">{item.artist?.displayName || 'Artist'}</Link></p>
      <p className="mt-7 font-editorial text-3xl" data-testid="text-artwork-detail-price">{money(item.price, item.currency)}</p>
      <p className="mt-5 max-w-lg text-sm leading-7 text-[#665e53]" data-testid="text-artwork-description">{item.description}</p>
      <div className="my-7 grid grid-cols-2 gap-y-4 border-y border-border py-5 text-xs"><span className="text-muted-foreground">Medium</span><span>{item.medium}</span><span className="text-muted-foreground">Dimensions</span><span>{item.dimensions}</span><span className="text-muted-foreground">Created</span><span>{item.yearCreated}</span><span className="text-muted-foreground">Availability</span><span>{item.quantity === 1 ? 'One of a kind' : `${item.quantity ?? 'Limited'} available`}</span></div>
      <div className="flex flex-col gap-3">
        <button onClick={buyNow} disabled={add.isPending} className="button-dark w-full justify-center" data-testid="button-detail-buy-now">
          Acquire artwork <ArrowRight size={15} />
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={addToBag} disabled={add.isPending} className="button-outline w-full justify-center" data-testid="button-detail-add-cart">
            {add.isPending ? 'Adding…' : 'Add to bag'} <ShoppingBag size={15} />
          </button>
          <button onClick={saveForLater} disabled={save.isPending} className="button-outline w-full justify-center" data-testid="button-detail-save">
            <Heart size={15} /> Save for later
          </button>
        </div>
      </div>
      {(add.isError || save.isError) && <p className="mt-3 text-center text-xs text-destructive" role="status" data-testid="status-detail-error">Please sign in to save or add this artwork.</p>}
      <Link href={`/artist/${item.artist?.slug || 'artist'}`} className="mt-8 flex items-center gap-4 border-t border-border pt-6" data-testid="link-artist-story">
        {item.artist?.imageUrl ? <img src={item.artist.imageUrl} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary font-editorial text-xl">{item.artist?.displayName?.slice(0,1) || 'A'}</span>}
        <span><span className="block text-[9px] uppercase tracking-[.16em] text-muted-foreground">Made by</span><span className="mt-1 block font-editorial text-xl">{item.artist?.displayName || 'Artist'}</span><span className="mt-1 block text-xs text-muted-foreground">{item.artist?.location}</span></span><ArrowUpRight size={16} className="ml-auto" />
      </Link>
    </div>
  </section>
  {query.data?.similarArtworks?.length ? <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10"><p className="eyebrow text-[#927a52]">Keep looking</p><h2 className="mb-8 mt-3 font-editorial text-4xl">Works that belong nearby</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-4">{query.data.similarArtworks.slice(0,4).map(art => <ArtworkCard key={art.id} artwork={art} />)}</div></section> : null}</Shell>;
}

function ArtistsPage() {
  const artists = useListArtists({ query: { queryKey: getListArtistsQueryKey() } });
  const [search, setSearch] = useState('');
  const visible = artists.data?.filter(artist => `${artist.displayName} ${artist.location} ${artist.biography}`.toLowerCase().includes(search.toLowerCase()));
  return <Shell><section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
    <PageTitle kicker="People who make" title="Meet the artists." detail="A little about the people behind the pieces. Explore their practices, their places, and the work they can’t stop making." />
    <div className="mb-7 flex max-w-lg items-center gap-3 border-b border-border pb-3"><Search size={17} className="text-[#8d7959]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find an artist or place" className="flex-1 bg-transparent py-2 text-sm outline-none" data-testid="input-artist-search" /></div>
    {artists.isLoading ? <div className="grid animate-pulse md:grid-cols-2 md:gap-x-10">{[0,1,2,3,4,5].map(i => <div key={i} className="h-28 border-b border-border" />)}</div> : artists.isError ? <QueryError retry={() => artists.refetch()} /> : visible?.length ? <div className="grid md:grid-cols-2 md:gap-x-10" data-testid="grid-artists">{visible.map(artist => <ArtistCard key={artist.id} artist={artist} />)}</div> : <EmptyState title="No artist by that name" copy="Try searching by a different name or location." />}
  </section></Shell>;
}

function ArtistStorePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const store = useGetArtist(slug, { query: { enabled: !!slug, queryKey: getGetArtistQueryKey(slug) } });
  const client = useQueryClient();
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const follow = useFollowArtist();
  const unfollow = useUnfollowArtist();
  const [following, setFollowing] = useState(false);

  const { artist, artworks } = store.data || ({} as any);

  // Auto-continuation effect for follow action
  const followActionExecutedRef = useRef(false);
  useEffect(() => {
    if (!isSignedIn || !artist?.id || followActionExecutedRef.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('action') === 'follow') {
      followActionExecutedRef.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      follow.mutate({ artistId: artist.id }, {
        onSuccess: () => {
          setFollowing(true);
          client.invalidateQueries({ queryKey: getGetBuyerDashboardQueryKey() });
          client.invalidateQueries({ queryKey: getListArtistsQueryKey() });
          client.invalidateQueries({ queryKey: getGetArtistQueryKey(slug) });
          toast({ title: 'Following artist', description: `You are now following ${artist.displayName}.` });
        },
      });
    }
  }, [isSignedIn, artist?.id, slug]);

  if (store.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (store.isError || !store.data) return <Shell><div className="mx-auto max-w-5xl px-5 py-14"><QueryError retry={() => store.refetch()} label="This artist’s studio is unavailable." /></div></Shell>;

  const toggleFollow = () => {
    if (!isSignedIn) {
      setLocation(`/buyer/login?returnTo=${encodeURIComponent(`/artist/${slug}`)}&action=follow&artistId=${artist.id}`);
      return;
    }
    const mutation = following ? unfollow : follow;
    mutation.mutate({ artistId: artist.id }, {
      onSuccess: () => {
        setFollowing(!following);
        client.invalidateQueries({ queryKey: getGetBuyerDashboardQueryKey() });
        client.invalidateQueries({ queryKey: getListArtistsQueryKey() });
        client.invalidateQueries({ queryKey: getGetArtistQueryKey(slug) });
        toast({
          title: following ? 'Unfollowed artist' : 'Following artist',
          description: following ? `You are no longer following ${artist.displayName}.` : `You are now following ${artist.displayName}.`,
        });
      },
    });
  };
  return <Shell><section className="relative overflow-hidden bg-[#e8e0d4]">
    <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 md:grid-cols-[.42fr_1fr] md:items-center md:px-10 md:py-20">
      <div className="flex items-center gap-6 md:block">
        {artist.imageUrl ? <img src={artist.imageUrl} alt={artist.displayName} className="h-28 w-28 rounded-full object-cover md:mb-6 md:h-48 md:w-48" data-testid="img-store-artist" /> : <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#d2c2ad] font-editorial text-4xl md:mb-6 md:h-48 md:w-48 md:text-6xl" data-testid="avatar-store-artist">{artist.displayName.slice(0,1)}</span>}
        <div><p className="eyebrow text-[#927a52]">{artist.location}</p><h1 className="mt-2 font-editorial text-4xl leading-tight tracking-[-.05em] md:text-6xl" data-testid="text-store-artist-name">{artist.displayName}</h1></div>
      </div>
      <div className="max-w-3xl"><p className="max-w-2xl text-[15px] leading-8 text-[#665e53]" data-testid="text-artist-biography">{artist.biography}</p><div className="mt-6 flex flex-wrap items-center gap-6">
        <span className="text-[10px] uppercase tracking-[.14em] text-[#776a56]">{artist.artworkCount} works <span className="mx-2">·</span> {artist.followerCount.toLocaleString()} followers</span>
        <button onClick={toggleFollow} disabled={follow.isPending || unfollow.isPending} className="button-dark" data-testid="button-follow-artist">{following ? <><Check size={14} /> Following</> : <>Follow artist <Plus size={14} /></>}</button>
        {artist.website && <a href={artist.website} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4" data-testid="link-artist-website">Artist website</a>}
      </div></div>
    </div>
  </section>
  <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20"><div className="mb-8 flex items-end justify-between"><div><p className="eyebrow text-[#927a52]">From the studio</p><h2 className="mt-3 font-editorial text-4xl tracking-[-.04em]">Available works</h2></div><span className="text-xs text-muted-foreground">{artworks.length} pieces</span></div>
    <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{artworks.map((art, i) => <ArtworkCard key={art.id} artwork={art} index={i} />)}</div>
  </section></Shell>;
}

function JoinPage() {
  const [, setLocation] = useLocation();
  const role = useChooseAccountRole();
  const client = useQueryClient();
  const selectRole = (roleName: 'buyer' | 'artist') => role.mutate({ data: { role: roleName } }, { onSuccess: () => {
    client.invalidateQueries({ queryKey: getGetAccountQueryKey() });
    setLocation(roleName === 'artist' ? '/artist/dashboard' : '/account');
  } });
  return <Shell><section className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-[.78fr_1.22fr] md:px-10 md:py-24">
    <div className="flex flex-col justify-center"><p className="eyebrow text-[#927a52]">A gallery, not a marketplace maze</p><h1 className="mt-4 font-editorial text-5xl leading-[1.02] tracking-[-.05em] md:text-7xl">There’s a place<br />for your point<br /><i className="font-normal text-[#937650]">of view.</i></h1><p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">Whether you’re here to collect or create, start with what brings you in.</p><Link href="/artworks" className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.15em]" data-testid="link-join-explore">Browse first <ArrowRight size={14} /></Link></div>
    <div className="grid gap-4">
      <div className="border border-border bg-card p-7 md:p-10"><p className="eyebrow text-[#927a52]">For collectors</p><h2 className="mt-3 font-editorial text-3xl">Find a work that feels like home.</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Save the pieces you love, follow the artists you admire, and make a collection of your own.</p><button onClick={() => selectRole('buyer')} disabled={role.isPending} className="button-dark mt-6" data-testid="button-join-buyer">Join as a buyer <ArrowRight size={15} /></button></div>
      <div className="bg-[#3b3a32] p-7 text-[#f5eee1] md:p-10"><p className="eyebrow text-[#cfb982]">For artists</p><h2 className="mt-3 font-editorial text-3xl">Your work deserves a thoughtful room.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#d0c9bd]">Build your own storefront, share the story behind your practice, and sell directly to collectors.</p><button onClick={() => selectRole('artist')} disabled={role.isPending} className="button-light mt-6" data-testid="button-join-artist">Join as an artist <ArrowUpRight size={15} /></button></div>
      {role.isError && <p role="alert" className="text-sm text-destructive" data-testid="status-role-error">Please sign in before choosing your gallery role. <Link href="/buyer/login" className="underline">Sign in</Link></p>}
    </div>
  </section></Shell>;
}

function AccountPage() {
  const account = useGetAccount({ query: { queryKey: getGetAccountQueryKey() } });
  const dashboard = useGetBuyerDashboard({ query: { queryKey: getGetBuyerDashboardQueryKey() } });
  if (account.isLoading || dashboard.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (account.isError || dashboard.isError) return <Shell><div className="mx-auto max-w-4xl px-5 py-14"><QueryError retry={() => { account.refetch(); dashboard.refetch(); }} label="Your account is waiting for you to sign in." /></div></Shell>;
  const buyer: any = dashboard.data;
  const recentOrders = Array.isArray(buyer?.recentOrders) ? buyer.recentOrders : [];
  return <Shell><section className="mx-auto max-w-[1280px] px-5 py-14 md:px-10 md:py-20">
    <PageTitle kicker="Your gallery" title={`Welcome, ${account.data?.fullName || account.data?.email?.split('@')[0] || 'collector'}.`} detail="The art you’re following, saved for when you’re ready." />
    <div className="grid gap-5 md:grid-cols-[1fr_1fr_1.3fr]">
      <Link href="/wishlist" className="bg-[#e9e1d5] p-7 transition hover:bg-[#e2d8c8]" data-testid="card-account-wishlist">
        <p className="eyebrow text-[#927a52]">Saved works</p>
        <p className="mt-5 font-editorial text-5xl">{buyer?.wishlistCount ?? buyer?.savedCount ?? 0}</p>
        <span className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[.14em]">Your wishlist <ArrowUpRight size={14} /></span>
      </Link>
      <Link href="/cart" className="bg-[#d9cbb7] p-7 transition hover:bg-[#d3c2aa]" data-testid="card-account-cart">
        <p className="eyebrow text-[#766347]">A little closer</p>
        <p className="mt-5 font-editorial text-3xl">Your bag</p>
        <span className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[.14em]">Ready when you are <ArrowUpRight size={14} /></span>
      </Link>
      <div className="border border-border p-7" data-testid="section-following">
        <p className="eyebrow text-[#927a52]">Artists you follow</p>
        {buyer?.followedArtists?.length ? (
          <div className="mt-3">{buyer.followedArtists.slice(0, 3).map((a: any) => <ArtistCard key={a.id} artist={a} />)}</div>
        ) : (
          <div className="mt-5">
            <p className="text-sm leading-6 text-muted-foreground">Follow an artist to keep their next work close.</p>
            <Link href="/artists" className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.15em]" data-testid="link-discover-artists">Find an artist <ArrowRight size={14} /></Link>
          </div>
        )}
      </div>
    </div>
    <div className="mt-14">
      <div className="mb-5 flex items-end justify-between">
        <div><p className="eyebrow text-[#927a52]">Recent orders</p><h2 className="mt-2 font-editorial text-3xl">A record of what you love</h2></div>
      </div>
      {recentOrders.length ? (
        <div className="border-t border-border">
          {recentOrders.map((order: any) => {
            const titles = Array.isArray(order?.artworkTitles) && order.artworkTitles.length
              ? order.artworkTitles.join(', ')
              : (Array.isArray(order?.items) && order.items.length
                  ? order.items.map((i: any) => i?.title || 'Artwork').filter(Boolean).join(', ')
                  : 'Original Artwork');
            return (
              <div key={order.id} className="grid gap-2 border-b border-border py-5 md:grid-cols-[1fr_1fr_auto_auto] md:items-center" data-testid={`row-order-${order.id}`}>
                <span className="font-editorial text-lg">{titles}</span>
                <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="text-xs uppercase tracking-[.1em]">{order.status}</span>
                <span>{money(order.total, order.currency)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Your story with art starts here" copy="When you find the one, your order will live here." href="/artworks" action="Explore the gallery" />
      )}
    </div>
  </section></Shell>;
}

function WishlistPage() {
  const wishlist = useGetWishlist({ query: { queryKey: getGetWishlistQueryKey() } });
  return <Shell><section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
    <PageTitle kicker="Kept close" title="Your wishlist." detail="A little corner for the pieces you keep coming back to." />
    {wishlist.isLoading ? <LoadingState /> : wishlist.isError ? <QueryError retry={() => wishlist.refetch()} /> : wishlist.data?.length ? <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{wishlist.data.map((art, i) => <ArtworkCard key={art.id} artwork={art} index={i} />)}</div> : <EmptyState title="Nothing saved just yet" copy="Tap the heart on a piece that speaks to you. It’ll be waiting here." href="/artworks" action="Find your first piece" />}
  </section></Shell>;
}

function CartPage() {
  const { isSignedIn } = useAuth();
  const client = useQueryClient();
  const cart = useGetCart({ query: { queryKey: getGetCartQueryKey(), enabled: isSignedIn } });
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const checkout = useCreateCheckout();
  const [checkoutError, setCheckoutError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const changeQuantity = (id: number, quantity: number) => update.mutate({ artworkId: id, data: { quantity } }, { onSuccess: () => client.invalidateQueries({ queryKey: getGetCartQueryKey() }) });
  const submitCheckout = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCheckoutError('');
    const form = new FormData(e.currentTarget);
    const data: CheckoutInput = Object.fromEntries(form.entries()) as unknown as CheckoutInput;
    checkout.mutate({ data }, { onSuccess: session => { window.location.assign(session.checkoutUrl); }, onError: () => setCheckoutError('Checkout could not start. Please check your details and try again.') });
  };

  if (!isSignedIn) {
    return (
      <Shell>
        <section className="mx-auto max-w-[1280px] px-5 py-14 md:px-10 md:py-20">
          <PageTitle kicker="A good choice" title="Your cart." detail="Original work, packed with care and sent from the artist’s studio." />
          <div className="my-10 border border-dashed border-[#cfc3b1] bg-[#f0eadf] px-6 py-16 text-center" data-testid="cart-unauth-state">
            <ShoppingBag className="mx-auto text-[#a78c5c]" size={28} strokeWidth={1.3} />
            <h2 className="mt-4 font-editorial text-3xl">Sign in to view and save your cart</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Sign in to access your saved pieces, complete your acquisition, or keep exploring original works from independent artists.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/buyer/login?returnTo=/cart" className="button-dark" data-testid="button-cart-signin">
                Sign In <ArrowRight size={15} />
              </Link>
              <Link href="/artworks" className="button-outline" data-testid="link-cart-browse">
                Explore the gallery
              </Link>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  if (cart.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (cart.isError) return <Shell><div className="mx-auto max-w-4xl px-5 py-14"><QueryError retry={() => cart.refetch()} label="Your bag couldn’t be loaded right now." /></div></Shell>;
  const items = Array.isArray(cart.data?.items) ? cart.data.items : [];
  return <Shell><section className="mx-auto max-w-[1280px] px-5 py-14 md:px-10 md:py-20">
    <PageTitle kicker="A good choice" title="Your bag." detail="Original work, packed with care and sent from the artist’s studio." />
    {!items.length ? <EmptyState title="Your bag is still empty" copy="Take your time. The right piece has a way of finding you." href="/artworks" action="Explore the gallery" /> : <div className="grid gap-12 md:grid-cols-[1.5fr_.7fr]">
      <div className="border-t border-border">{items.map((item: any) => {
        const artwork = item?.artwork || {};
        const artworkId = artwork?.id || item?.artworkId || 0;
        const primaryImg = getArtworkPrimaryImage(artwork);
        const quantity = item?.quantity || 1;
        const effectiveLineTotal = item?.lineTotal !== undefined ? item.lineTotal : (artwork?.price || 0) * quantity;
        return (
          <div key={artworkId} className="grid grid-cols-[94px_1fr_auto] gap-4 border-b border-border py-5 md:grid-cols-[130px_1fr_auto_auto] md:gap-6" data-testid={`row-cart-${artworkId}`}>
            <Link href={`/artworks/${artworkId}`} data-testid={`link-cart-art-${artworkId}`}><img src={primaryImg} alt={artwork.title || 'Artwork'} onError={e => { e.currentTarget.src = fallbackImage(artworkId); }} className="aspect-[4/5] w-full object-cover" /></Link>
            <div className="py-1"><p className="eyebrow text-[#927a52]">{artwork.category || 'Artwork'}</p><Link href={`/artworks/${artworkId}`} className="mt-2 block font-editorial text-xl" data-testid={`text-cart-title-${artworkId}`}>{artwork.title || 'Untitled'}</Link><p className="mt-1 text-xs text-muted-foreground">{artwork.artist?.displayName || 'Artist'}</p><div className="mt-4 flex items-center border border-border"><button onClick={() => quantity > 1 && changeQuantity(artworkId, quantity - 1)} aria-label="Decrease quantity" className="p-2" disabled={quantity <= 1} data-testid={`button-cart-minus-${artworkId}`}><Minus size={13} /></button><span className="min-w-8 text-center text-xs" data-testid={`text-cart-quantity-${artworkId}`}>{quantity}</span><button onClick={() => changeQuantity(artworkId, quantity + 1)} aria-label="Increase quantity" className="p-2" data-testid={`button-cart-plus-${artworkId}`}><Plus size={13} /></button></div><button onClick={() => remove.mutate({ artworkId }, { onSuccess: () => client.invalidateQueries({ queryKey: getGetCartQueryKey() }) })} className="mt-3 text-[9px] uppercase tracking-[.14em] text-muted-foreground underline underline-offset-4" data-testid={`button-cart-remove-${artworkId}`}>Remove</button></div>
            <span className="pt-2 text-xs" data-testid={`text-cart-line-total-${artworkId}`}>{money(effectiveLineTotal, cart.data?.currency || 'USD')}</span>
          </div>
        );
      })}</div>
      <aside className="h-fit border border-border bg-[#f0eadf] p-6 md:p-8"><p className="eyebrow text-[#927a52]">The details</p><h2 className="mt-2 font-editorial text-3xl">Order summary</h2>
        <div className="mt-7 grid gap-4 border-b border-border pb-5 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(cart.data?.subtotal || 0, cart.data?.currency || 'USD')}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{cart.data?.shipping ? money(cart.data.shipping, cart.data.currency) : 'Complimentary'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Estimated tax</span><span>{money(cart.data?.tax || 0, cart.data?.currency || 'USD')}</span></div></div>
        <div className="mt-5 flex justify-between font-editorial text-2xl"><span>Total</span><span data-testid="text-cart-total">{money(cart.data?.total || 0, cart.data?.currency || 'USD')}</span></div>
        <button onClick={() => setShowCheckout(!showCheckout)} className="button-dark mt-6 w-full" data-testid="button-checkout">Continue to checkout <ArrowRight size={15} /></button>
        <p className="mt-4 text-center text-[10px] leading-5 text-muted-foreground">Secure checkout powered by Stripe. Your card details are never handled here.</p>
        {showCheckout && <form onSubmit={submitCheckout} className="mt-7 grid gap-3 border-t border-border pt-6" data-testid="form-checkout">
          <p className="eyebrow text-[#927a52]">Where to send it</p>
          {([['fullName','Full name'],['email','Email'],['phone','Phone'],['address1','Address'],['address2','Apartment, suite (optional)'],['city','City'],['region','State or region'],['postalCode','Postal code'],['country','Country']] as const).map(([name, label]) => <label key={name} className="grid gap-1 text-[10px] uppercase tracking-[.11em] text-muted-foreground">{label}<input name={name} required={!['phone','address2'].includes(name)} type={name === 'email' ? 'email' : 'text'} className="input-editorial normal-case tracking-normal text-foreground" data-testid={`input-checkout-${name}`} /></label>)}
          {checkoutError && <p className="text-xs text-destructive" role="alert" data-testid="status-checkout-error">{checkoutError}</p>}
          <button type="submit" disabled={checkout.isPending} className="button-dark mt-2 w-full" data-testid="button-checkout-redirect">{checkout.isPending ? 'Preparing secure checkout…' : 'Continue to secure payment'}<ArrowRight size={15} /></button>
        </form>}
      </aside>
    </div>}
  </section></Shell>;
}

function ArtistDashboardPage() {
  const client = useQueryClient();
  const stats = useGetArtistDashboard({ query: { queryKey: getGetArtistDashboardQueryKey() } });
  const account = useGetAccount({ query: { queryKey: getGetAccountQueryKey() } });
  const updateProfile = useUpdateArtistProfile();
  const [profileMessage, setProfileMessage] = useState('');
  const saveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const oldProfile = account.data?.artistProfile;
    const data = {
      displayName: String(fields.get('displayName') || ''),
      location: String(fields.get('location') || ''),
      biography: String(fields.get('biography') || ''),
      imageUrl: String(fields.get('imageUrl') || '') || null,
      website: String(fields.get('website') || '') || null,
    };
    updateProfile.mutate({ data }, { onSuccess: artist => {
      setProfileMessage('Your public profile is up to date.');
      client.setQueryData(getGetAccountQueryKey(), (old: typeof account.data) => old ? { ...old, artistProfile: artist } : old);
      client.invalidateQueries({ queryKey: getGetArtistDashboardQueryKey() });
      client.invalidateQueries({ queryKey: getListArtistsQueryKey() });
      if (oldProfile?.slug) client.invalidateQueries({ queryKey: getGetArtistQueryKey(oldProfile.slug) });
      if (artist.slug) client.invalidateQueries({ queryKey: getGetArtistQueryKey(artist.slug) });
    }, onError: () => setProfileMessage('We couldn’t save your profile. Please try again.') });
  };
  if (stats.isLoading || account.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (stats.isError || account.isError) return <Shell><div className="mx-auto max-w-4xl px-5 py-14"><QueryError retry={() => { stats.refetch(); account.refetch(); }} label="Your studio is waiting for you to sign in." /></div></Shell>;
  const data: any = stats.data!;
  const profile = account.data?.artistProfile;
  const monthlySales = Array.isArray(data?.monthlySales) ? data.monthlySales : [];
  return <Shell><section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
    <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow text-[#927a52]">Your studio</p><h1 className="mt-3 font-editorial text-5xl tracking-[-.05em]">Good work, {profile?.displayName || account.data?.fullName || 'artist'}.</h1></div><div className="flex gap-3"><Link href="/artist/artworks" className="button-outline" data-testid="link-manage-artworks">Manage work <ArrowRight size={14} /></Link><Link href="/artist/artworks/new" className="button-dark" data-testid="link-create-artwork">List a new artwork <Plus size={14} /></Link></div></div>
    <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4" data-testid="grid-artist-stats">{[['Sales', money(data?.totalSales || 0)],['Orders', data?.totalOrders || 0],['Earnings', money(data?.totalEarnings || data?.totalSales * 0.9 || 0)],['Pending orders', data?.pendingOrders || 0]].map(([label, value]) => <div key={label} className="bg-card p-5 md:p-7"><p className="eyebrow text-[#927a52]">{label}</p><p className="mt-4 font-editorial text-3xl md:text-4xl" data-testid={`text-stat-${String(label).toLowerCase().replaceAll(' ','-')}`}>{value}</p></div>)}</div>
    <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <div className="border border-border p-6 md:p-8"><div className="flex items-end justify-between"><div><p className="eyebrow text-[#927a52]">People are looking</p><h2 className="mt-2 font-editorial text-3xl">Your studio at a glance</h2></div><span className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">All time</span></div>
        <div className="mt-7 grid grid-cols-3 gap-4 border-t border-border pt-5">{[['Published works', data?.publishedArtworks ?? data?.artworksCount ?? 0],['Views', (data?.views ?? data?.viewsCount ?? 0).toLocaleString()],['Favorites', (data?.favorites ?? 140).toLocaleString()]].map(([label,value]) => <div key={label}><p className="font-editorial text-2xl">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</p></div>)}</div>
        <div className="mt-7 flex h-[150px] items-end gap-2 border-b border-border pb-2">{monthlySales.length ? monthlySales.slice(-8).map((month: any, i: number) => {
          const revenue = month.revenue || month.sales || 0;
          const max = Math.max(...monthlySales.map((m: any) => m.revenue || m.sales || 0), 1);
          return <div key={`${month.month}-${i}`} className="group flex flex-1 flex-col items-center gap-2"><div className="w-full bg-[#c7b38e] transition group-hover:bg-[#9e8156]" style={{ height: `${Math.max(7, revenue / max * 105)}px` }} title={money(revenue)} /><span className="text-[8px] uppercase tracking-[.1em] text-muted-foreground">{month.month}</span></div>;
        }) : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Monthly sales chart will appear as works sell.</div>}</div>
      </div>
      <div className="border border-border bg-card p-6 md:p-8">
        <p className="eyebrow text-[#927a52]">Public profile</p><h2 className="mt-2 font-editorial text-3xl">How collectors see you</h2>
        <form onSubmit={saveProfile} className="mt-6 grid gap-4 text-xs" data-testid="form-artist-profile">
          <label className="grid gap-1 uppercase tracking-wider text-muted-foreground">Studio name<input name="displayName" defaultValue={profile?.displayName || ''} required className="input-editorial text-foreground" data-testid="input-profile-name" /></label>
          <label className="grid gap-1 uppercase tracking-wider text-muted-foreground">Location<input name="location" defaultValue={profile?.location || ''} placeholder="City, Country" className="input-editorial text-foreground" data-testid="input-profile-location" /></label>
          <label className="grid gap-1 uppercase tracking-wider text-muted-foreground">Studio biography<textarea name="biography" rows={4} defaultValue={profile?.biography || ''} className="input-editorial resize-y text-foreground" data-testid="input-profile-bio" /></label>
          <label className="grid gap-1 uppercase tracking-wider text-muted-foreground">Profile photo URL<input name="imageUrl" defaultValue={profile?.imageUrl || ''} placeholder="https://…" className="input-editorial text-foreground" data-testid="input-profile-image" /></label>
          <label className="grid gap-1 uppercase tracking-wider text-muted-foreground">Website<input name="website" defaultValue={profile?.website || ''} placeholder="https://…" className="input-editorial text-foreground" data-testid="input-profile-website" /></label>
          {profileMessage && <p className="text-xs text-[#8f754b]" role="status" data-testid="status-profile-message">{profileMessage}</p>}
          <button type="submit" disabled={updateProfile.isPending} className="button-dark justify-center" data-testid="button-save-profile">{updateProfile.isPending ? 'Saving profile…' : 'Save public profile'}<ArrowRight size={14} /></button>
        </form>
      </div>
    </div>
  </section></Shell>;
}

function ArtistArtworksPage() {
  const client = useQueryClient();
  const list = useGetArtistArtworks({ query: { queryKey: getGetArtistArtworksQueryKey() } });
  const archive = useDeleteArtistArtwork();
  const removeArtwork = (id: number) => {
    archive.mutate({ id }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getGetArtistArtworksQueryKey() });
      client.invalidateQueries({ queryKey: getGetArtistDashboardQueryKey() });
    } });
  };
  return <Shell><section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow text-[#927a52]">Studio catalog</p><h1 className="mt-2 font-editorial text-4xl tracking-[-.04em] md:text-5xl">Your artworks.</h1></div><Link href="/artist/artworks/new" className="button-dark" data-testid="link-create-new-artwork">Add new artwork <Plus size={15} /></Link></div>
    {list.isLoading ? <LoadingState /> : list.isError ? <QueryError retry={() => list.refetch()} label="Couldn’t load studio artworks." /> : !list.data?.length ? <EmptyState title="Your catalog is waiting" copy="Every work you add here can be seen and collected across the gallery." href="/artist/artworks/new" action="Add your first piece" /> : <div className="divide-y divide-border border-y border-border">{list.data.map(art => {
      const primaryImg = getArtworkPrimaryImage(art);
      return (
        <div key={art.id} className="grid grid-cols-[80px_1fr] items-center gap-4 py-5 md:grid-cols-[100px_1.5fr_1fr_1fr_auto] md:gap-6" data-testid={`row-artist-artwork-${art.id}`}>
          <img src={primaryImg} alt={art.title} onError={e => { e.currentTarget.src = fallbackImage(art.id); }} className="aspect-[4/5] w-full object-cover" />
          <div><p className="eyebrow text-[#927a52]">{art.category}</p><Link href={`/artworks/${art.id}`} className="font-editorial text-xl hover:text-[#8f754b]">{art.title}</Link><p className="mt-1 text-xs text-muted-foreground">{art.medium}</p></div>
          <div className="hidden md:block"><p className="text-xs uppercase tracking-wider text-muted-foreground">Inventory</p><p className="mt-1 font-editorial text-lg">{art.quantity ?? 1} available</p></div>
          <div className="hidden md:block"><p className="text-xs uppercase tracking-wider text-muted-foreground">Price</p><p className="mt-1 font-editorial text-lg">{money(art.price, art.currency)}</p></div>
          <div className="flex items-center gap-3">
            <Link href={`/artist/artworks/${art.id}/edit`} className="button-outline text-xs" data-testid={`button-edit-artwork-${art.id}`}>Edit</Link>
            <button onClick={() => removeArtwork(art.id)} disabled={archive.isPending} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Archive artwork" data-testid={`button-archive-artwork-${art.id}`}><X size={15} /></button>
          </div>
        </div>
      );
    })}</div>}
  </section></Shell>;
}

function ArtworkFormPage({ editing }: { editing: boolean }) {
  const { id } = useParams<{ id: string }>();
  const artworkId = Number(id);
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const create = useCreateArtistArtwork();
  const update = useUpdateArtistArtwork();
  const list = useGetArtistArtworks({ query: { enabled: editing, queryKey: getGetArtistArtworksQueryKey() } });
  const existing = editing && list.data ? list.data.find(a => a.id === artworkId) : undefined;
  const busy = create.isPending || update.isPending;
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const images = String(values.get('imageUrls') || '').split('\n').map(s => s.trim()).filter(Boolean);
    const payload: ArtworkInput = {
      title: String(values.get('title') || ''),
      description: String(values.get('description') || ''),
      price: Number(values.get('price') || 0),
      currency: 'USD',
      category: String(values.get('category') || ''),
      medium: String(values.get('medium') || ''),
      dimensions: String(values.get('dimensions') || ''),
      yearCreated: Number(values.get('yearCreated') || new Date().getFullYear()),
      imageUrls: images.length ? images : ['/artwork/after-the-rain.jpg'],
      artworkType: String(values.get('artworkType') || 'original') as ArtworkInput['artworkType'],
      quantity: Number(values.get('quantity') || 1),
      featured: values.get('featured') === 'on',
    };
    const onSuccess = () => {
      client.invalidateQueries({ queryKey: getGetArtistArtworksQueryKey() });
      client.invalidateQueries({ queryKey: getGetArtistDashboardQueryKey() });
      setLocation('/artist/artworks');
    };
    if (editing) update.mutate({ id: artworkId, data: payload }, { onSuccess });
    else create.mutate({ data: payload }, { onSuccess });
  };
  if (editing && list.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (editing && (list.isError || !existing)) return <Shell><div className="mx-auto max-w-4xl px-5 py-14"><QueryError retry={() => list.refetch()} label="This artwork isn’t in your studio." /></div></Shell>;
  const imageUrls = (Array.isArray(getArtworkImages(existing)) ? getArtworkImages(existing) : []).join('\n') || existing?.imageUrl || '';
  return <Shell><section className="mx-auto max-w-[950px] px-5 py-12 md:px-10 md:py-16">
    <Link href="/artist/artworks" className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.15em] text-muted-foreground" data-testid="link-back-studio"><ArrowLeft size={14} /> Back to your artworks</Link>
    <PageTitle kicker={editing ? 'Make a change' : 'Put it out there'} title={editing ? 'Edit your artwork.' : 'Add a new artwork.'} detail="Tell collectors what makes this piece yours." />
    <form onSubmit={submit} className="grid gap-5 border border-border bg-card p-6 md:grid-cols-2 md:p-9" data-testid="form-artwork">
      <label className="field-label md:col-span-2">Artwork title<input name="title" required minLength={2} maxLength={160} defaultValue={existing?.title || ''} className="input-editorial" data-testid="input-artwork-title" /></label>
      <label className="field-label md:col-span-2">The story behind it<textarea name="description" required minLength={2} maxLength={5000} rows={5} defaultValue={existing?.description || ''} className="input-editorial resize-y" data-testid="input-artwork-description" /></label>
      <label className="field-label">Price<input name="price" required min="0" step="0.01" type="number" defaultValue={existing?.price ?? ''} className="input-editorial" data-testid="input-artwork-price" /></label>
      <label className="field-label">Category<input name="category" required defaultValue={existing?.category || ''} className="input-editorial" data-testid="input-artwork-category" /></label>
      <label className="field-label">Medium<input name="medium" required defaultValue={existing?.medium || ''} className="input-editorial" data-testid="input-artwork-medium" /></label>
      <label className="field-label">Dimensions<input name="dimensions" required placeholder="e.g. 60 × 80 cm" defaultValue={existing?.dimensions || ''} className="input-editorial" data-testid="input-artwork-dimensions" /></label>
      <label className="field-label">Year created<input name="yearCreated" required type="number" min="0" defaultValue={existing?.yearCreated ?? new Date().getFullYear()} className="input-editorial" data-testid="input-artwork-year" /></label>
      <label className="field-label">Artwork type<select name="artworkType" defaultValue={existing?.artworkType || 'original'} className="input-editorial" data-testid="select-artwork-type"><option value="original">Original</option><option value="print">Limited print</option><option value="digital">Digital</option></select></label>
      <label className="field-label">Available quantity<input name="quantity" required type="number" min="1" defaultValue={existing?.quantity ?? 1} className="input-editorial" data-testid="input-artwork-quantity" /></label>
      <label className="field-label md:col-span-2">Image URLs <span className="normal-case tracking-normal text-muted-foreground">(one per line; first image is the cover)</span><textarea name="imageUrls" required rows={3} defaultValue={imageUrls} placeholder="https://…" className="input-editorial resize-y" data-testid="input-artwork-images" /></label>
      <label className="flex items-center gap-3 text-sm md:col-span-2"><input type="checkbox" name="featured" defaultChecked={existing?.featured || false} className="accent-[#62513e]" data-testid="checkbox-artwork-featured" /> Submit for featured selection</label>
      {(create.isError || update.isError) && <p className="text-sm text-destructive md:col-span-2" role="alert" data-testid="status-artwork-save-error">We couldn’t save this work. Check the details and try again.</p>}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end md:col-span-2"><Link href="/artist/artworks" className="button-outline justify-center" data-testid="link-cancel-artwork">Cancel</Link><button disabled={busy} className="button-dark justify-center" data-testid="button-save-artwork">{busy ? 'Saving artwork…' : editing ? 'Save changes' : 'Create artwork'}<ArrowRight size={15} /></button></div>
    </form>
  </section></Shell>;
}

function AdminDashboardPage() {
  const client = useQueryClient();
  const dashboard = useGetAdminDashboard({ query: { queryKey: getGetAdminDashboardQueryKey() } });
  const updateStatus = useUpdateArtworkModerationStatus();
  const [activeTab, setActiveTab] = useState<'pending' | 'overview'>('pending');

  const handleModerate = (artworkId: number, status: 'published' | 'archived') => {
    updateStatus.mutate(
      { id: artworkId, data: { status } },
      {
        onSuccess: () => {
          client.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
          client.invalidateQueries({ queryKey: getListArtworksQueryKey() });
          toast({
            title: status === 'published' ? 'Artwork approved' : 'Artwork archived',
            description: `The artwork was successfully ${status === 'published' ? 'published to the gallery' : 'archived'}.`,
          });
        },
      }
    );
  };

  if (dashboard.isLoading) return <Shell><div className="mx-auto max-w-[1440px] px-5 py-14"><LoadingState /></div></Shell>;
  if (dashboard.isError || !dashboard.data) return <Shell><div className="mx-auto max-w-4xl px-5 py-14"><QueryError retry={() => dashboard.refetch()} label="Curator dashboard could not load." /></div></Shell>;

  const data = dashboard.data;
  const pending = Array.isArray(data.pendingArtworks) ? data.pendingArtworks : [];

  return (
    <Shell>
      <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-[#8f754b]">Forma Administration</p>
            <h1 className="mt-2 font-editorial text-4xl tracking-[-.04em] md:text-5xl">Curator console.</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition ${
                activeTab === 'pending' ? 'bg-[#342f29] text-[#fbf8f1]' : 'border border-border bg-card'
              }`}
              data-testid="tab-pending-artworks"
            >
              Moderation Queue ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition ${
                activeTab === 'overview' ? 'bg-[#342f29] text-[#fbf8f1]' : 'border border-border bg-card'
              }`}
              data-testid="tab-curator-overview"
            >
              Metrics & Operations
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="border border-border bg-card p-5" data-testid="stat-pending">
            <p className="eyebrow text-[#8f754b]">Pending Review</p>
            <p className="mt-2 font-editorial text-3xl">{pending.length}</p>
          </div>
          <div className="border border-border bg-card p-5" data-testid="stat-total-artworks">
            <p className="eyebrow text-[#8f754b]">Total Artworks</p>
            <p className="mt-2 font-editorial text-3xl">{data.totalArtworks ?? 0}</p>
          </div>
          <div className="border border-border bg-card p-5" data-testid="stat-total-artists">
            <p className="eyebrow text-[#8f754b]">Artists</p>
            <p className="mt-2 font-editorial text-3xl">{data.totalArtists ?? 0}</p>
          </div>
          <div className="border border-border bg-card p-5" data-testid="stat-total-revenue">
            <p className="eyebrow text-[#8f754b]">Gross Sales</p>
            <p className="mt-2 font-editorial text-3xl">{money(data.totalRevenue ?? 0, 'USD')}</p>
          </div>
          <div className="border border-border bg-card p-5" data-testid="stat-total-commission">
            <p className="eyebrow text-[#8f754b]">Commission ({data.commissionRate ?? 10}%)</p>
            <p className="mt-2 font-editorial text-3xl">{money(data.totalCommission ?? 0, 'USD')}</p>
          </div>
        </div>

        {/* Tab 1: Moderation Queue */}
        {activeTab === 'pending' && (
          <div className="mt-12">
            <h2 className="font-editorial text-2xl">Artworks Awaiting Review</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Review artist submissions before publishing them to the public marketplace.
            </p>

            {pending.length === 0 ? (
              <div className="mt-6 border border-dashed border-[#cfc3b1] bg-[#f0eadf] px-6 py-12 text-center">
                <Check className="mx-auto text-[#8f754b]" size={24} />
                <h3 className="mt-3 font-editorial text-xl">Queue is clear</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  All submitted artworks have been reviewed and published.
                </p>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-border border-y border-border">
                {pending.map((art: any) => {
                  const img = getArtworkPrimaryImage(art);
                  return (
                    <div
                      key={art.id}
                      className="grid grid-cols-[80px_1fr] items-center gap-4 py-5 md:grid-cols-[100px_2fr_1fr_1fr_auto] md:gap-6"
                      data-testid={`row-pending-artwork-${art.id}`}
                    >
                      <img src={img} alt={art.title} className="aspect-[4/5] w-full object-cover" />
                      <div>
                        <p className="eyebrow text-[#8f754b]">{art.category}</p>
                        <Link href={`/artworks/${art.id}`} className="font-editorial text-xl hover:underline">
                          {art.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{art.medium}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{art.description}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                        <p className="mt-1 text-xs capitalize">{art.artworkType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</p>
                        <p className="mt-1 font-editorial text-lg">{money(art.price, art.currency || 'USD')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModerate(art.id, 'published')}
                          disabled={updateStatus.isPending}
                          className="button-dark text-xs"
                          data-testid={`button-approve-artwork-${art.id}`}
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleModerate(art.id, 'archived')}
                          disabled={updateStatus.isPending}
                          className="button-outline text-xs text-destructive"
                          data-testid={`button-archive-artwork-${art.id}`}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Metrics and Policy */}
        {activeTab === 'overview' && (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="border border-border bg-card p-6 md:p-8">
              <h2 className="font-editorial text-2xl">Marketplace Economics</h2>
              <div className="mt-6 space-y-4 text-xs">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Standard Commission</span>
                  <span className="font-medium">{data.commissionRate ?? 10}%</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Total Artists Represented</span>
                  <span className="font-medium">{data.totalArtists ?? 0}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Artworks Catalogued</span>
                  <span className="font-medium">{data.totalArtworks ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Platform Revenue</span>
                  <span className="font-medium">{money(data.totalCommission ?? 0, 'USD')}</span>
                </div>
              </div>
            </div>

            <div className="border border-border bg-card p-6 md:p-8">
              <h2 className="font-editorial text-2xl">Curator Guidelines</h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                All submissions must represent original artist-created paintings, drawings, sculpture, or numbered limited editions. Ensure image fidelity, dimensions, and medium details are accurate before publishing.
              </p>
              <div className="mt-6">
                <Link href="/artworks" className="button-outline text-xs">
                  Review Public Gallery <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}

function ClerkCacheSync() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const prev = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const userId = user?.id ?? null;
    if (prev.current !== undefined && prev.current !== userId) client.clear();
    prev.current = userId;
  }), [addListener, client]);
  return null;
}

function RedirectTo({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function RouterContent() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/buyer/login`} signUpUrl={`${basePath}/buyer/register`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Return to the art you love.' } }, signUp: { start: { title: 'Make room for art', subtitle: 'Join a gallery built around artists.' } } }}
    routerPush={to => setLocation(stripBase(to))} routerReplace={to => setLocation(stripBase(to), { replace: true })}>
    <ClerkCacheSync />
    <Switch>
      {/* Public Auth Routes */}
      <Route path="/buyer/login" component={BuyerLoginPage} />
      <Route path="/buyer/register" component={BuyerRegisterPage} />
      <Route path="/artist/login" component={ArtistLoginPage} />
      <Route path="/artist/register" component={ArtistRegisterPage} />
      <Route path="/admin/login" component={AdminLoginPage} />

      {/* Legacy and Clerk Aliases */}
      <Route path="/sign-in/*?">
        {() => <RedirectTo to="/buyer/login" />}
      </Route>
      <Route path="/sign-up/*?">
        {() => <RedirectTo to="/buyer/register" />}
      </Route>

      {/* Public Marketplace Browsing Routes (No Login Required) */}
      <Route path="/" component={HomePage} />
      <Route path="/artworks" component={ArtworksPage} />
      <Route path="/artworks/:id" component={ArtworkDetailPage} />
      <Route path="/artists" component={ArtistsPage} />
      <Route path="/artist/:slug" component={ArtistStorePage} />
      <Route path="/cart" component={CartPage} />

      {/* Protected Buyer Routes */}
      <Route path="/account" component={() => <ProtectedRoute component={AccountPage} requiredRole="buyer" />} />
      <Route path="/wishlist" component={() => <ProtectedRoute component={WishlistPage} requiredRole="buyer" />} />
      <Route path="/join" component={() => <ProtectedRoute component={JoinPage} />} />

      {/* Protected Artist Routes (Requires Artist Role) */}
      <Route path="/artist/dashboard" component={() => <ProtectedRoute component={ArtistDashboardPage} requiredRole="artist" />} />
      <Route path="/artist/artworks" component={() => <ProtectedRoute component={ArtistArtworksPage} requiredRole="artist" />} />
      <Route path="/artist/artworks/new" component={() => <ProtectedRoute component={() => <ArtworkFormPage editing={false} />} requiredRole="artist" />} />
      <Route path="/artist/artworks/:id/edit" component={() => <ProtectedRoute component={() => <ArtworkFormPage editing />} requiredRole="artist" />} />

      {/* Protected Admin Routes (Requires Admin Role) */}
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboardPage} requiredRole="admin" />} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}><RouterContent /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
