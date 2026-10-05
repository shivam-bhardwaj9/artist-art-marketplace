import { Router } from "express";
import { store } from "../lib/store";
import { requireRole } from "../lib/auth";

const router = Router();

// GET /api/artist/dashboard
router.get("/artist/dashboard", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const artist = store.getArtistByUserId(user.id) || store.updateArtistProfile(user.id, { displayName: "Artist Studio" });
  const myArtworks = store.listArtworks({ artistId: artist.id });
  const earnings = store.getArtistEarnings(artist.id);
  const artistOrders = store.listArtistOrders(artist.id);

  res.json({
    totalSales: earnings.totalSales,
    artworksCount: myArtworks.total,
    viewsCount: artist.views,
    followerCount: 300 + artist.id * 85,
    monthlySales: [
      { month: "Jan", sales: Math.round(earnings.totalSales * 0.25) },
      { month: "Feb", sales: Math.round(earnings.totalSales * 0.35) },
      { month: "Mar", sales: Math.round(earnings.totalSales * 0.4) },
    ],
    recentOrders: artistOrders.slice(0, 5),
  });
});

// GET /api/artist/profile
router.get("/artist/profile", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const artist = store.getArtistByUserId(user.id) || store.updateArtistProfile(user.id, { displayName: "Artist Studio" });
  res.json({
    ...artist,
    followerCount: 300 + artist.id * 85,
    artworkCount: store.listArtworks({ artistId: artist.id }).total,
  });
});

// PATCH /api/artist/profile & PUT /api/artist/profile
const handleUpdateProfile = async (req: any, res: any) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const { displayName, location, biography, imageUrl, website } = req.body;
  const updated = store.updateArtistProfile(user.id, {
    displayName,
    location,
    biography,
    imageUrl,
    website,
  });

  res.json({
    ...updated,
    followerCount: 300 + updated.id * 85,
    artworkCount: store.listArtworks({ artistId: updated.id }).total,
  });
};

router.patch("/artist/profile", handleUpdateProfile);
router.put("/artist/profile", handleUpdateProfile);

// GET /api/artist/artworks
router.get("/artist/artworks", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const artist = store.getArtistByUserId(user.id) || store.updateArtistProfile(user.id, { displayName: "Artist Studio" });
  // Return all artworks owned by artist regardless of status
  const myArtworks = store.state?.artworks
    ? store.listArtworks({ artistId: artist.id }).items
    : store.listArtworks({ artistId: artist.id }).items;

  const formatted = myArtworks.map((art) => ({
    ...art,
    imageUrl: art.imageUrls[0] || "",
    artist: {
      ...artist,
      followerCount: 300 + artist.id * 85,
      artworkCount: myArtworks.length,
    },
  }));

  res.json(formatted);
});

// POST /api/artist/artworks
router.post("/artist/artworks", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const artist = store.getArtistByUserId(user.id) || store.updateArtistProfile(user.id, { displayName: "Artist Studio" });

  const {
    title,
    description,
    price,
    currency,
    category,
    medium,
    dimensions,
    yearCreated,
    quantity,
    artworkType,
    status,
    imageUrls,
    featured,
  } = req.body;

  // Validation
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!price || isNaN(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: "Valid price greater than 0 is required" });
  }
  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "Category is required" });
  }
  if (!medium || typeof medium !== "string") {
    return res.status(400).json({ error: "Medium is required" });
  }

  const newArtwork = store.createArtwork(artist.id, {
    title: title.trim(),
    slug: (title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "artwork") + "-" + Date.now().toString().slice(-4),
    description: description || "",
    price: Number(price),
    currency: currency || "USD",
    category: category.trim(),
    medium: medium.trim(),
    dimensions: dimensions || "Standard",
    yearCreated: Number(yearCreated) || new Date().getFullYear(),
    status: status || "published",
    imageUrls: Array.isArray(imageUrls) && imageUrls.length ? imageUrls : ["/artwork/after-the-rain.jpg"],
    artworkType: artworkType || "original",
    featured: Boolean(featured),
    quantity: quantity !== undefined ? Number(quantity) : 1,
  });

  res.status(201).json({
    ...newArtwork,
    imageUrl: newArtwork.imageUrls[0] || "",
    artist: {
      ...artist,
      followerCount: 300 + artist.id * 85,
      artworkCount: store.listArtworks({ artistId: artist.id }).total,
    },
  });
});

// GET /api/artist/artworks/:id
router.get("/artist/artworks/:id", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  const artwork = store.getArtworkById(id);
  if (!artwork) {
    return res.status(404).json({ error: "Artwork not found" });
  }

  const artist = store.getArtistByUserId(user.id);
  if (user.role !== "admin" && (!artist || artwork.artistId !== artist.id)) {
    return res.status(403).json({ error: "You can only view artwork in your own studio" });
  }

  res.json({
    ...artwork,
    imageUrl: artwork.imageUrls[0] || "",
    artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
  });
});

// PATCH /api/artist/artworks/:id
router.patch("/artist/artworks/:id", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  const artwork = store.getArtworkById(id);
  if (!artwork) {
    return res.status(404).json({ error: "Artwork not found" });
  }

  const artist = store.getArtistByUserId(user.id);
  // Verify ownership
  if (user.role !== "admin" && (!artist || artwork.artistId !== artist.id)) {
    return res.status(403).json({ error: "You can only modify artwork belonging to your artist studio" });
  }

  const updated = store.updateArtwork(id, req.body);
  res.json({
    ...updated,
    imageUrl: updated?.imageUrls[0] || "",
    artist: artist ? { ...artist, followerCount: 300 + artist.id * 85, artworkCount: 1 } : null,
  });
});

// DELETE /api/artist/artworks/:id
router.delete("/artist/artworks/:id", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  const artwork = store.getArtworkById(id);
  if (!artwork) {
    return res.status(404).json({ error: "Artwork not found" });
  }

  const artist = store.getArtistByUserId(user.id);
  // Verify ownership
  if (user.role !== "admin" && (!artist || artwork.artistId !== artist.id)) {
    return res.status(403).json({ error: "You can only delete artwork belonging to your artist studio" });
  }

  store.deleteArtwork(id);
  res.status(204).end();
});

// GET /api/artist/orders
router.get("/artist/orders", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const artist = store.getArtistByUserId(user.id);
  if (!artist) {
    return res.json([]);
  }

  const orders = store.listArtistOrders(artist.id);
  res.json(orders);
});

// GET /api/artist/earnings
router.get("/artist/earnings", async (req, res) => {
  const user = await requireRole(req, res, "artist");
  if (!user) return;

  const artist = store.getArtistByUserId(user.id);
  if (!artist) {
    return res.json({ totalSales: 0, totalCommission: 0, netEarnings: 0, paidOut: 0, pendingPayout: 0, payouts: [] });
  }

  const earnings = store.getArtistEarnings(artist.id);
  res.json(earnings);
});

export default router;
