import { Router } from "express";
import { store } from "../lib/store";
import { getSignedInUserId, ensureMarketplaceUser } from "../lib/auth";

const router = Router();

// GET /api/account
router.get("/account", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const user = await ensureMarketplaceUser(userId);
  const artistProfile = store.getArtistByUserId(userId);

  res.json({
    id: user.id,
    email: `${user.id.replace(/[^a-zA-Z0-9]/g, '')}@forma.gallery`,
    role: user.role,
    artistProfile: artistProfile
      ? {
          ...artistProfile,
          followerCount: 300 + artistProfile.id * 85,
          artworkCount: store.listArtworks({ artistId: artistProfile.id, status: "published" }).total,
        }
      : null,
  });
});

// GET /api/account/role
router.get("/account/role", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const user = await ensureMarketplaceUser(userId);
  res.json({ role: user.role });
});

// PUT /api/account/role
router.put("/account/role", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const { role } = req.body;
  if (!["buyer", "artist", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  const updatedUser = store.setUserRole(userId, role);
  const artistProfile = role === "artist" ? store.updateArtistProfile(userId, { displayName: "Artist Studio" }) : null;

  res.json({
    id: updatedUser.id,
    email: `${updatedUser.id.replace(/[^a-zA-Z0-9]/g, '')}@forma.gallery`,
    role: updatedUser.role,
    artistProfile,
  });
});

// GET /api/buyer/dashboard
router.get("/buyer/dashboard", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const orders = store.listUserOrders(userId);
  const savedArtworks = store.getWishlist(userId).map((art) => {
    const artist = store.getArtistById(art.artistId);
    return {
      ...art,
      imageUrl: art.imageUrls[0] || "",
      artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
    };
  });
  const followedArtists = store.getFollowedArtists(userId).map((artist) => ({
    ...artist,
    followerCount: 300 + artist.id * 85,
    artworkCount: store.listArtworks({ artistId: artist.id, status: "published" }).total,
  }));

  res.json({
    orderCount: orders.length,
    savedCount: savedArtworks.length,
    followingCount: followedArtists.length,
    recentOrders: orders.slice(0, 5),
    savedArtworks,
    followedArtists,
  });
});

// --- Cart Endpoints ---

// GET /api/buyer/cart
router.get("/buyer/cart", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  res.json(store.getCart(userId));
});

// POST /api/buyer/cart & POST /api/buyer/cart/items
const handleAddToCart = async (req: any, res: any) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const artworkId = parseInt(req.body.artworkId, 10);
  const quantity = Math.max(1, parseInt(req.body.quantity || "1", 10));

  if (!artworkId) {
    return res.status(400).json({ error: "artworkId is required" });
  }

  const artwork = store.getArtworkById(artworkId);
  if (!artwork) {
    return res.status(404).json({ error: "Artwork not found" });
  }

  if (artwork.status !== "published") {
    return res.status(400).json({ error: "Artwork is not available for purchase" });
  }

  const updatedCart = store.addToCart(userId, artworkId, quantity);
  res.status(201).json(updatedCart);
};

router.post("/buyer/cart", handleAddToCart);
router.post("/buyer/cart/items", handleAddToCart);

// PATCH /api/buyer/cart/:id & PATCH /api/buyer/cart/items/:id
const handleUpdateCart = async (req: any, res: any) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const id = parseInt(req.params.id, 10);
  const quantity = parseInt(req.body.quantity, 10);

  const updatedCart = store.updateCartQuantity(userId, id, quantity);
  res.json(updatedCart);
};

router.patch("/buyer/cart/:id", handleUpdateCart);
router.patch("/buyer/cart/items/:id", handleUpdateCart);

// DELETE /api/buyer/cart/:id & DELETE /api/buyer/cart/items/:id
const handleRemoveCart = async (req: any, res: any) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const id = parseInt(req.params.id, 10);
  const updatedCart = store.removeFromCart(userId, id);
  res.json(updatedCart);
};

router.delete("/buyer/cart/:id", handleRemoveCart);
router.delete("/buyer/cart/items/:id", handleRemoveCart);

// --- Wishlist Endpoints ---

// GET /api/buyer/wishlist
router.get("/buyer/wishlist", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const saved = store.getWishlist(userId).map((art) => {
    const artist = store.getArtistById(art.artistId);
    return {
      ...art,
      imageUrl: art.imageUrls[0] || "",
      artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
    };
  });
  res.json(saved);
});

// POST /api/buyer/wishlist & PUT /api/buyer/wishlist/:artworkId
const handleSaveWishlist = async (req: any, res: any) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const artworkId = parseInt(req.params.artworkId || req.body.artworkId, 10);
  if (!artworkId) {
    return res.status(400).json({ error: "artworkId is required" });
  }

  store.addToWishlist(userId, artworkId);
  res.status(204).end();
};

router.post("/buyer/wishlist", handleSaveWishlist);
router.put("/buyer/wishlist/:artworkId", handleSaveWishlist);

// DELETE /api/buyer/wishlist/:id
router.delete("/buyer/wishlist/:id", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const artworkId = parseInt(req.params.id, 10);
  store.removeFromWishlist(userId, artworkId);
  res.status(204).end();
});

// --- Follows Endpoints ---

// GET /api/buyer/following
router.get("/buyer/following", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const artists = store.getFollowedArtists(userId).map((artist) => ({
    ...artist,
    followerCount: 300 + artist.id * 85,
    artworkCount: store.listArtworks({ artistId: artist.id, status: "published" }).total,
  }));
  res.json(artists);
});

// POST /api/buyer/following & PUT /api/buyer/following/:artistId
const handleFollow = async (req: any, res: any) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const artistId = parseInt(req.params.artistId || req.body.artistId, 10);
  if (!artistId) {
    return res.status(400).json({ error: "artistId is required" });
  }

  store.followArtist(userId, artistId);
  res.status(204).end();
};

router.post("/buyer/following", handleFollow);
router.put("/buyer/following/:artistId", handleFollow);

// DELETE /api/buyer/following/:artistId
router.delete("/buyer/following/:artistId", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const artistId = parseInt(req.params.artistId, 10);
  store.unfollowArtist(userId, artistId);
  res.status(204).end();
});

// --- Checkout ---

// POST /api/buyer/checkout
router.post("/buyer/checkout", async (req, res) => {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return;

  const cart = store.getCart(userId);
  if (!cart.items.length) {
    return res.status(400).json({ error: "Cannot checkout with an empty cart" });
  }

  const { fullName, email, address1, city, region, postalCode, country, phone } = req.body;

  try {
    const { order } = store.createOrder({
      userId,
      fullName: fullName || "Valued Collector",
      email: email || "collector@forma.gallery",
      phone,
      address1: address1 || "Gallery Way",
      city: city || "Art City",
      region: region || "State",
      postalCode: postalCode || "00000",
      country: country || "United States",
      stripeSessionId: `cs_test_${Date.now()}`,
    });

    res.status(201).json({
      checkoutUrl: `/account?purchased=true&orderId=${order.id}`,
      sessionId: order.stripeSessionId,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create checkout order" });
  }
});

export default router;
