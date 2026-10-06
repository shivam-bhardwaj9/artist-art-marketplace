import type { Plugin } from 'vite';
import { store } from '../../api-server/src/lib/store.ts';

function jsonResponse(res: any, status: number, data: any): boolean {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
  return true;
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Server-side authentication verification - does NOT silently treat visitors as logged in
function getAuthenticatedUser(req: any): { id: string; role: 'buyer' | 'artist' | 'admin' } | null {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token || token === 'null' || token === 'undefined' || token === '') {
    return null;
  }

  const user = store.getUser(token) || store.ensureUser(token, 'buyer');
  return { id: user.id, role: user.role as any };
}

export async function handleApiRequest(req: any, res: any): Promise<boolean> {
  const urlStr = req.url || '';
  if (!urlStr.startsWith('/api')) {
    return false;
  }

  const [pathWithQuery] = urlStr.split('#');
  const [rawPath, queryString] = pathWithQuery.split('?');
  const pathname = rawPath.replace(/^\/api/, '');
  const query = new URLSearchParams(queryString || '');

  // -------------------------------------------------------------
  // PUBLIC ENDPOINTS (No authentication required)
  // -------------------------------------------------------------

        // 1. Health check
        if (pathname === '/healthz' && req.method === 'GET') {
          return jsonResponse(res, 200, { status: 'ok' });
        }

        // 2. Auth login: POST /api/auth/login
        if (pathname === '/auth/login' && req.method === 'POST') {
          const body = await parseBody(req);
          const email = body.email || 'collector@forma.gallery';
          const role = (body.role as 'buyer' | 'artist' | 'admin') || 'buyer';
          const name = body.name || email.split('@')[0] || 'User';

          const safePrefix = email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'user';
          const userId = role === 'artist'
            ? (email.includes('mira') ? 'usr_mira_sen' : `usr_art_${safePrefix}`)
            : role === 'admin'
              ? 'usr_admin_curator'
              : (email.includes('elena') ? 'usr_forma_collector' : `usr_col_${safePrefix}`);

          const user = store.ensureUser(userId, role);
          if (user.role !== role) {
            store.setUserRole(userId, role);
          }
          if (role === 'artist') {
            store.updateArtistProfile(userId, { displayName: name });
          }

          return jsonResponse(res, 200, {
            token: userId,
            user: { id: user.id, role: user.role, email, fullName: name },
          });
        }

        // 3. Auth register: POST /api/auth/register
        if (pathname === '/auth/register' && req.method === 'POST') {
          const body = await parseBody(req);
          const email = body.email;
          const role = (body.role as 'buyer' | 'artist') || 'buyer';
          const name = body.fullName || body.name || 'User';

          if (!email) {
            return jsonResponse(res, 400, { error: 'Email is required' });
          }

          const safePrefix = email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'user';
          const userId = role === 'artist' ? `usr_art_${safePrefix}` : `usr_col_${safePrefix}`;

          const user = store.ensureUser(userId, role);
          store.setUserRole(userId, role);
          if (role === 'artist') {
            store.updateArtistProfile(userId, { displayName: name });
          }

          return jsonResponse(res, 201, {
            token: userId,
            user: { id: user.id, role, email, fullName: name },
          });
        }

        // 4. Marketplace Home: GET /api/marketplace/home
        if (pathname === '/marketplace/home' && req.method === 'GET') {
          const published = store.listArtworks({ status: 'published' }).items;
          const formattedArtworks = published.map((art) => {
            const artist = store.getArtistById(art.artistId);
            return {
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist
                ? {
                    ...artist,
                    followerCount: 300 + artist.id * 85,
                    artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
                  }
                : null,
            };
          });

          const trendingArtists = store.listArtists().map((artist) => ({
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
          }));

          const categories = store.listCategories().map((cat) => ({
            ...cat,
            artworkCount: published.filter((a) => a.category.toLowerCase() === cat.name.toLowerCase()).length,
          }));

          return jsonResponse(res, 200, {
            featuredArtworks: formattedArtworks.filter((a) => a.featured),
            trendingArtists,
            categories,
            newArrivals: formattedArtworks.slice(0, 4),
          });
        }

        // 5. Artworks Catalog: GET /api/artworks
        if (pathname === '/artworks' && req.method === 'GET') {
          const q = query.get('q') || undefined;
          const category = query.get('category') || undefined;
          const sort = query.get('sort') || undefined;
          const page = parseInt(query.get('page') || '1', 10);
          const limit = parseInt(query.get('limit') || '24', 10);

          const result = store.listArtworks({ q, category, sort, page, limit, status: 'published' });
          const items = result.items.map((art) => {
            const artist = store.getArtistById(art.artistId);
            return {
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist
                ? {
                    ...artist,
                    followerCount: 300 + artist.id * 85,
                    artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
                  }
                : null,
            };
          });

          return jsonResponse(res, 200, {
            items,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          });
        }

        // 6. Single Artwork: GET /api/artworks/:id or :slug
        const artworkMatch = pathname.match(/^\/artworks\/([^/]+)$/);
        if (artworkMatch && req.method === 'GET') {
          const idOrSlug = artworkMatch[1];
          const artwork = /^\d+$/.test(idOrSlug)
            ? (store.getArtworkById(parseInt(idOrSlug, 10)) || store.getArtworkBySlug(idOrSlug))
            : store.getArtworkBySlug(idOrSlug);
          if (!artwork) {
            return jsonResponse(res, 404, { error: 'Artwork not found' });
          }

          artwork.views += 1;
          const artist = store.getArtistById(artwork.artistId);
          const relatedArtworks = store
            .listArtworks({ category: artwork.category, status: 'published' })
            .items.filter((a) => a.id !== artwork.id)
            .slice(0, 4)
            .map((rel) => {
              const relArtist = store.getArtistById(rel.artistId);
              return {
                ...rel,
                imageUrl: rel.imageUrls[0] || '/artwork/after-the-rain.jpg',
                imageUrls: rel.imageUrls || ['/artwork/after-the-rain.jpg'],
                artist: relArtist
                  ? {
                      ...relArtist,
                      followerCount: 300 + relArtist.id * 85,
                      artworkCount: store.listArtworks({ artistId: relArtist.id, status: 'published' }).total,
                    }
                  : null,
              };
            });

          const normalizedArtwork = {
            ...artwork,
            imageUrl: artwork.imageUrls[0] || '/artwork/after-the-rain.jpg',
            imageUrls: artwork.imageUrls || ['/artwork/after-the-rain.jpg'],
            artist: artist
              ? {
                  ...artist,
                  followerCount: 300 + artist.id * 85,
                  artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
                }
              : null,
          };

          return jsonResponse(res, 200, {
            ...normalizedArtwork,
            artwork: normalizedArtwork,
            similarArtworks: relatedArtworks,
            relatedArtworks,
          });
        }

        // 7. Categories: GET /api/categories
        if (pathname === '/categories' && req.method === 'GET') {
          const published = store.listArtworks({ status: 'published' }).items;
          const categories = store.listCategories().map((cat) => ({
            ...cat,
            artworkCount: published.filter((a) => a.category.toLowerCase() === cat.name.toLowerCase()).length,
          }));
          return jsonResponse(res, 200, categories);
        }

        // 8. Artists: GET /api/artists
        if (pathname === '/artists' && req.method === 'GET') {
          const artists = store.listArtists().map((artist) => ({
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
          }));
          return jsonResponse(res, 200, artists);
        }

        // 9. Artist Storefront: GET /api/artists/:slug
        const artistMatch = pathname.match(/^\/artists\/([^/]+)$/);
        if (artistMatch && req.method === 'GET') {
          const slug = artistMatch[1];
          const artist = store.getArtistBySlug(slug);
          if (!artist) {
            return jsonResponse(res, 404, { error: 'Artist not found' });
          }

          const artistArtworks = store
            .listArtworks({ artistId: artist.id, status: 'published' })
            .items.map((art) => ({
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: {
                ...artist,
                followerCount: 300 + artist.id * 85,
                artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
              },
            }));

          return jsonResponse(res, 200, {
            artist: {
              ...artist,
              followerCount: 300 + artist.id * 85,
              artworkCount: artistArtworks.length,
            },
            artworks: artistArtworks,
          });
        }

        // -------------------------------------------------------------
        // PROTECTED ENDPOINTS (Authentication strictly required)
        // -------------------------------------------------------------
        const authUser = getAuthenticatedUser(req);
        if (!authUser) {
          return jsonResponse(res, 401, { error: 'Sign-in required' });
        }

        // 10. Account: GET /api/account, GET /api/account/role, PUT /api/account/role
        if (pathname === '/account' && req.method === 'GET') {
          const artistProfile = store.getArtistByUserId(authUser.id);
          return jsonResponse(res, 200, {
            id: authUser.id,
            email: `${authUser.id.replace(/[^a-zA-Z0-9]/g, '')}@forma.gallery`,
            role: authUser.role,
            artistProfile: artistProfile
              ? {
                  ...artistProfile,
                  followerCount: 300 + artistProfile.id * 85,
                  artworkCount: store.listArtworks({ artistId: artistProfile.id, status: 'published' }).total,
                }
              : null,
          });
        }
        if (pathname === '/account/role' && (req.method === 'GET' || req.method === 'PUT')) {
          if (req.method === 'PUT') {
            const body = await parseBody(req);
            if (body.role) {
              const updated = store.setUserRole(authUser.id, body.role);
              const artistProfile = body.role === 'artist' ? store.updateArtistProfile(authUser.id, { displayName: 'Artist Studio' }) : null;
              return jsonResponse(res, 200, {
                id: updated.id,
                email: `${updated.id.replace(/[^a-zA-Z0-9]/g, '')}@forma.gallery`,
                role: updated.role,
                artistProfile,
              });
            }
          }
          return jsonResponse(res, 200, { role: authUser.role });
        }

        // 11. Buyer Dashboard: GET /api/buyer/dashboard
        if (pathname === '/buyer/dashboard' && req.method === 'GET') {
          const orders = store.listUserOrders(authUser.id);
          const savedArtworks = store.getWishlist(authUser.id).map((art) => {
            const artist = store.getArtistById(art.artistId);
            return {
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
            };
          });
          const followedArtists = store.getFollowedArtists(authUser.id).map((artist) => ({
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
          }));

          const recentOrders = orders.map((o) => ({
            id: String(o.id),
            status: o.status,
            total: o.total,
            currency: o.currency,
            createdAt: o.createdAt,
            artworkTitles: (o.items && o.items.length)
              ? o.items.map((i: any) => i.title || 'Artwork')
              : ['Artwork Collection'],
          }));

          return jsonResponse(res, 200, {
            orderCount: orders.length,
            savedCount: savedArtworks.length,
            wishlistCount: savedArtworks.length,
            followingCount: followedArtists.length,
            recentOrders,
            savedArtworks,
            followedArtists,
          });
        }

        // 12. Buyer Cart: GET, POST, PATCH, DELETE (User-isolated)
        if ((pathname === '/buyer/cart' || pathname === '/buyer/cart/items') && req.method === 'GET') {
          return jsonResponse(res, 200, store.getCart(authUser.id));
        }
        if ((pathname === '/buyer/cart' || pathname === '/buyer/cart/items') && req.method === 'POST') {
          const body = await parseBody(req);
          const artworkId = parseInt(body.artworkId, 10);
          const quantity = Math.max(1, parseInt(body.quantity || '1', 10));

          if (!artworkId) {
            return jsonResponse(res, 400, { error: 'artworkId is required' });
          }

          const artwork = store.getArtworkById(artworkId);
          if (!artwork) {
            return jsonResponse(res, 404, { error: 'Artwork not found' });
          }

          const updatedCart = store.addToCart(authUser.id, artworkId, quantity);
          return jsonResponse(res, 201, updatedCart);
        }
        const cartItemMatch = pathname.match(/^\/buyer\/cart(?:\/items)?\/(\d+)$/);
        if (cartItemMatch) {
          const id = parseInt(cartItemMatch[1], 10);
          if (req.method === 'PATCH') {
            const body = await parseBody(req);
            const qty = parseInt(body.quantity, 10);
            return jsonResponse(res, 200, store.updateCartQuantity(authUser.id, id, qty));
          }
          if (req.method === 'DELETE') {
            return jsonResponse(res, 200, store.removeFromCart(authUser.id, id));
          }
        }

        // 13. Buyer Wishlist: GET, POST, PUT, DELETE (User-isolated)
        if (pathname === '/buyer/wishlist' && req.method === 'GET') {
          const saved = store.getWishlist(authUser.id).map((art) => {
            const artist = store.getArtistById(art.artistId);
            return {
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
            };
          });
          return jsonResponse(res, 200, saved);
        }
        if (pathname === '/buyer/wishlist' && req.method === 'POST') {
          const body = await parseBody(req);
          const artworkId = parseInt(body.artworkId, 10);
          if (artworkId) store.addToWishlist(authUser.id, artworkId);
          res.statusCode = 204;
          return res.end();
        }
        const wishlistMatch = pathname.match(/^\/buyer\/wishlist\/(\d+)$/);
        if (wishlistMatch) {
          const artworkId = parseInt(wishlistMatch[1], 10);
          if (req.method === 'PUT') {
            store.addToWishlist(authUser.id, artworkId);
            res.statusCode = 204;
            return res.end();
          }
          if (req.method === 'DELETE') {
            store.removeFromWishlist(authUser.id, artworkId);
            res.statusCode = 204;
            return res.end();
          }
        }

        // 14. Buyer Following: GET, POST, PUT, DELETE (User-isolated)
        if (pathname === '/buyer/following' && req.method === 'GET') {
          const artists = store.getFollowedArtists(authUser.id).map((artist) => ({
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id, status: 'published' }).total,
          }));
          return jsonResponse(res, 200, artists);
        }
        if (pathname === '/buyer/following' && req.method === 'POST') {
          const body = await parseBody(req);
          const artistId = parseInt(body.artistId, 10);
          if (artistId) store.followArtist(authUser.id, artistId);
          res.statusCode = 204;
          return res.end();
        }
        const followMatch = pathname.match(/^\/buyer\/following\/(\d+)$/);
        if (followMatch) {
          const artistId = parseInt(followMatch[1], 10);
          if (req.method === 'PUT') {
            store.followArtist(authUser.id, artistId);
            res.statusCode = 204;
            return res.end();
          }
          if (req.method === 'DELETE') {
            store.unfollowArtist(authUser.id, artistId);
            res.statusCode = 204;
            return res.end();
          }
        }

        // 15. Checkout: POST /api/buyer/checkout
        if (pathname === '/buyer/checkout' && req.method === 'POST') {
          const cart = store.getCart(authUser.id);
          if (!cart.items.length) {
            return jsonResponse(res, 400, { error: 'Cannot checkout with an empty cart' });
          }

          const body = await parseBody(req);
          try {
            const { order } = store.createOrder({
              userId: authUser.id,
              fullName: body.fullName || 'Elena Rostova',
              email: body.email || 'collector@forma.gallery',
              phone: body.phone,
              address1: body.address1 || '450 West 24th Street',
              address2: body.address2 || 'Apt 8B',
              city: body.city || 'New York',
              region: body.region || 'NY',
              postalCode: body.postalCode || '10011',
              country: body.country || 'United States',
              stripeSessionId: `cs_test_${Date.now()}`,
            });

            return jsonResponse(res, 201, {
              checkoutUrl: `/account?purchased=true&orderId=${order.id}`,
              sessionId: order.stripeSessionId,
            });
          } catch (err: any) {
            return jsonResponse(res, 400, { error: err.message || 'Failed to create checkout order' });
          }
        }

        // -------------------------------------------------------------
        // ARTIST ENDPOINTS (Artist or Admin role required)
        // -------------------------------------------------------------
        if (pathname.startsWith('/artist/')) {
          if (authUser.role !== 'artist' && authUser.role !== 'admin') {
            return jsonResponse(res, 403, { error: 'An artist account is required' });
          }
        }

        // 16. Artist Dashboard & Profile
        if (pathname === '/artist/dashboard' && req.method === 'GET') {
          const artist = store.getArtistByUserId(authUser.id) || store.updateArtistProfile(authUser.id, { displayName: 'Artist Studio' });
          const myArtworks = store.listArtworks({ artistId: artist.id });
          const earnings = store.getArtistEarnings(artist.id);
          const artistOrders = store.listArtistOrders(artist.id);

          return jsonResponse(res, 200, {
            totalSales: earnings.totalSales,
            artworksCount: myArtworks.total,
            publishedArtworks: myArtworks.total,
            totalOrders: artistOrders.length,
            totalEarnings: earnings.netEarnings,
            pendingOrders: artistOrders.filter(o => o.order.status === 'pending').length,
            views: artist.views,
            viewsCount: artist.views,
            favorites: 140,
            followerCount: 300 + artist.id * 85,
            bestSellers: myArtworks.items.slice(0, 3).map(art => ({
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist,
            })),
            monthlySales: [
              { month: 'Jan', sales: Math.round(earnings.totalSales * 0.25), revenue: Math.round(earnings.totalSales * 0.25) },
              { month: 'Feb', sales: Math.round(earnings.totalSales * 0.35), revenue: Math.round(earnings.totalSales * 0.35) },
              { month: 'Mar', sales: Math.round(earnings.totalSales * 0.4), revenue: Math.round(earnings.totalSales * 0.4) },
            ],
            recentOrders: artistOrders.slice(0, 5),
          });
        }
        if (pathname === '/artist/profile' && req.method === 'GET') {
          const artist = store.getArtistByUserId(authUser.id) || store.updateArtistProfile(authUser.id, { displayName: 'Artist Studio' });
          return jsonResponse(res, 200, {
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id }).total,
          });
        }
        if (pathname === '/artist/profile' && (req.method === 'PATCH' || req.method === 'PUT')) {
          const body = await parseBody(req);
          const updated = store.updateArtistProfile(authUser.id, body);
          return jsonResponse(res, 200, {
            ...updated,
            followerCount: 300 + updated.id * 85,
            artworkCount: store.listArtworks({ artistId: updated.id }).total,
          });
        }

        // 17. Artist Artworks CRUD
        if (pathname === '/artist/artworks' && req.method === 'GET') {
          const artist = store.getArtistByUserId(authUser.id) || store.updateArtistProfile(authUser.id, { displayName: 'Artist Studio' });
          const myArtworks = store.listArtworks({ artistId: artist.id }).items.map((art) => ({
            ...art,
            imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
            imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
            artist: {
              ...artist,
              followerCount: 300 + artist.id * 85,
              artworkCount: store.listArtworks({ artistId: artist.id }).total,
            },
          }));
          return jsonResponse(res, 200, myArtworks);
        }
        if (pathname === '/artist/artworks' && req.method === 'POST') {
          const artist = store.getArtistByUserId(authUser.id) || store.updateArtistProfile(authUser.id, { displayName: 'Artist Studio' });
          const body = await parseBody(req);

          if (!body.title?.trim()) {
            return jsonResponse(res, 400, { error: 'Title is required' });
          }
          if (!body.price || isNaN(Number(body.price)) || Number(body.price) <= 0) {
            return jsonResponse(res, 400, { error: 'Valid price is required' });
          }

          const rawImages = Array.isArray(body.imageUrls) ? body.imageUrls : [];
          const imageUrls = rawImages.length ? rawImages : ['/artwork/after-the-rain.jpg'];

          const newArt = store.createArtwork(artist.id, {
            title: body.title.trim(),
            slug: (body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'artwork') + '-' + Date.now().toString().slice(-4),
            description: body.description || '',
            price: Number(body.price),
            currency: body.currency || 'USD',
            category: body.category || 'Painting',
            medium: body.medium || 'Mixed Media',
            dimensions: body.dimensions || '50 × 60 cm',
            yearCreated: Number(body.yearCreated) || new Date().getFullYear(),
            status: body.status || 'published',
            imageUrls,
            artworkType: body.artworkType || 'original',
            featured: Boolean(body.featured),
            quantity: body.quantity !== undefined ? Number(body.quantity) : 1,
          });

          return jsonResponse(res, 201, {
            ...newArt,
            imageUrl: newArt.imageUrls[0] || '/artwork/after-the-rain.jpg',
            imageUrls: newArt.imageUrls,
            artist: {
              ...artist,
              followerCount: 300 + artist.id * 85,
              artworkCount: store.listArtworks({ artistId: artist.id }).total,
            },
          });
        }
        const artistArtMatch = pathname.match(/^\/artist\/artworks\/(\d+)$/);
        if (artistArtMatch) {
          const id = parseInt(artistArtMatch[1], 10);
          const artist = store.getArtistByUserId(authUser.id);
          const artwork = store.getArtworkById(id);

          if (!artwork) {
            return jsonResponse(res, 404, { error: 'Artwork not found' });
          }
          // Enforce ownership: an artist can only modify their own artwork
          if (artist && artwork.artistId !== artist.id && authUser.role !== 'admin') {
            return jsonResponse(res, 403, { error: 'You do not own this artwork' });
          }

          if (req.method === 'GET') {
            return jsonResponse(res, 200, {
              ...artwork,
              imageUrl: artwork.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: artwork.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
            });
          }
          if (req.method === 'PATCH') {
            const body = await parseBody(req);
            const updated = store.updateArtwork(id, body);
            return jsonResponse(res, 200, {
              ...updated,
              imageUrl: updated?.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: updated?.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
            });
          }
          if (req.method === 'DELETE') {
            store.deleteArtwork(id);
            res.statusCode = 204;
            return res.end();
          }
        }
        if (pathname === '/artist/orders' && req.method === 'GET') {
          const artist = store.getArtistByUserId(authUser.id);
          const orders = artist ? store.listArtistOrders(artist.id) : [];
          return jsonResponse(res, 200, orders);
        }
        if (pathname === '/artist/earnings' && req.method === 'GET') {
          const artist = store.getArtistByUserId(authUser.id);
          const earnings = artist
            ? store.getArtistEarnings(artist.id)
            : { totalSales: 0, totalCommission: 0, netEarnings: 0, paidOut: 0, pendingPayout: 0, payouts: [] };
          return jsonResponse(res, 200, earnings);
        }

        // -------------------------------------------------------------
        // ADMIN ENDPOINTS (Admin role strictly required)
        // -------------------------------------------------------------
        if (pathname.startsWith('/admin/')) {
          if (authUser.role !== 'admin') {
            return jsonResponse(res, 403, { error: 'An admin account is required' });
          }
        }

        if (pathname === '/admin/dashboard' && req.method === 'GET') {
          const allArtworks = store.listArtworks({ status: undefined }).items;
          const pendingArtworks = allArtworks.filter((a) => a.status === 'pending_review');
          const allOrders = store.listAllOrders();
          const totalRevenue = allOrders.reduce((acc, o) => acc + (o.paymentStatus === 'paid' ? o.total : 0), 0);
          const totalCommission = allOrders.reduce((acc, o) => {
            if (o.paymentStatus !== 'paid') return acc;
            return acc + (o.items || []).reduce((iAcc, item) => iAcc + item.commissionAmount, 0);
          }, 0);

          return jsonResponse(res, 200, {
            pendingArtworkCount: pendingArtworks.length,
            totalArtists: store.listArtists().length,
            totalArtworks: allArtworks.length,
            totalRevenue,
            totalCommission,
            commissionRate: store.getSettings().commissionRate,
            pendingArtworks,
          });
        }
        if (pathname === '/admin/users' && req.method === 'GET') {
          return jsonResponse(res, 200, store.listUsers());
        }
        if (pathname === '/admin/artists' && req.method === 'GET') {
          const artists = store.listArtists().map((artist) => ({
            ...artist,
            artworkCount: store.listArtworks({ artistId: artist.id }).total,
            totalSales: store.getArtistEarnings(artist.id).totalSales,
            pendingPayout: store.getArtistEarnings(artist.id).pendingPayout,
          }));
          return jsonResponse(res, 200, artists);
        }
        if (pathname === '/admin/artworks' && req.method === 'GET') {
          const status = query.get('status') || undefined;
          const artworks = store.listArtworks({ status }).items.map((art) => {
            const artist = store.getArtistById(art.artistId);
            return {
              ...art,
              imageUrl: art.imageUrls[0] || '/artwork/after-the-rain.jpg',
              imageUrls: art.imageUrls || ['/artwork/after-the-rain.jpg'],
              artist: artist ? { ...artist, followerCount: 300, artworkCount: 1 } : null,
            };
          });
          return jsonResponse(res, 200, artworks);
        }
        const adminArtStatusMatch = pathname.match(/^\/admin\/artworks\/(\d+)\/status$/);
        if (adminArtStatusMatch && req.method === 'PATCH') {
          const id = parseInt(adminArtStatusMatch[1], 10);
          const body = await parseBody(req);
          const updated = store.updateArtwork(id, { status: body.status });
          if (!updated) return jsonResponse(res, 404, { error: 'Artwork not found' });
          const artist = store.getArtistById(updated.artistId);
          return jsonResponse(res, 200, {
            ...updated,
            imageUrl: updated.imageUrls[0] || '/artwork/after-the-rain.jpg',
            imageUrls: updated.imageUrls || ['/artwork/after-the-rain.jpg'],
            artist: artist ? { ...artist, followerCount: 300, artworkCount: 1 } : null,
          });
        }
        if (pathname === '/admin/orders' && req.method === 'GET') {
          return jsonResponse(res, 200, store.listAllOrders());
        }
        if (pathname === '/admin/categories' && req.method === 'GET') {
          return jsonResponse(res, 200, store.listCategories());
        }
        if (pathname === '/admin/categories' && req.method === 'POST') {
          const body = await parseBody(req);
          const cat = store.createCategory(body.name, body.description, body.imageUrl);
          return jsonResponse(res, 201, cat);
        }
        const adminCatMatch = pathname.match(/^\/admin\/categories\/(\d+)$/);
        if (adminCatMatch) {
          const id = parseInt(adminCatMatch[1], 10);
          if (req.method === 'PATCH') {
            const body = await parseBody(req);
            return jsonResponse(res, 200, store.updateCategory(id, body) || {});
          }
          if (req.method === 'DELETE') {
            store.deleteCategory(id);
            res.statusCode = 204;
            return res.end();
          }
        }
        if (pathname === '/admin/payouts' && req.method === 'GET') {
          const payouts = store.listPayouts().map((p) => {
            const artist = store.getArtistById(p.artistId);
            return { ...p, artist: artist ? { id: artist.id, displayName: artist.displayName } : null };
          });
          return jsonResponse(res, 200, payouts);
        }
        const adminPayoutMatch = pathname.match(/^\/admin\/payouts\/(\d+)$/);
        if (adminPayoutMatch && req.method === 'PATCH') {
          const id = parseInt(adminPayoutMatch[1], 10);
          const body = await parseBody(req);
          const updated = store.updatePayoutStatus(id, body.status, body.referenceNumber);
          return jsonResponse(res, 200, updated || {});
        }
        if (pathname === '/admin/settings' && req.method === 'GET') {
          return jsonResponse(res, 200, store.getSettings());
        }
        if (pathname === '/admin/settings' && req.method === 'PATCH') {
          const body = await parseBody(req);
          return jsonResponse(res, 200, store.updateSettings(body));
        }

        // 18. Direct Storage Upload URL: POST /api/storage/uploads/request-url
        if (pathname === '/storage/uploads/request-url' && req.method === 'POST') {
          const body = await parseBody(req);
          const filename = (body.filename || 'artwork-image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
          const objectPath = `/artwork/${Date.now()}_${filename}`;
          return jsonResponse(res, 200, {
            uploadUrl: objectPath,
            objectPath,
          });
        }

        return false;
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'art-marketplace-api-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
  };
}
