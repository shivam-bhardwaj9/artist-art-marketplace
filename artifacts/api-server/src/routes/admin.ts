import { Router } from "express";
import { store } from "../lib/store";
import { requireRole } from "../lib/auth";

const router = Router();

// GET /api/admin/dashboard
router.get("/admin/dashboard", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const allArtworks = store.listArtworks({ status: undefined }).items;
  const pendingArtworks = allArtworks
    .filter((a) => a.status === "pending_review")
    .map((art) => {
      const artist = store.getArtistById(art.artistId);
      return {
        ...art,
        imageUrl: art.imageUrls[0] || "",
        artist: artist ? { ...artist, followerCount: 300, artworkCount: 1 } : null,
      };
    });

  const allArtists = store.listArtists();
  const allOrders = store.listAllOrders();
  const totalRevenue = allOrders.reduce((acc, o) => acc + (o.paymentStatus === "paid" ? o.total : 0), 0);
  const totalCommission = allOrders.reduce((acc, o) => {
    if (o.paymentStatus !== "paid") return acc;
    const items = o.items || [];
    return acc + items.reduce((iAcc, item) => iAcc + item.commissionAmount, 0);
  }, 0);

  res.json({
    pendingArtworkCount: pendingArtworks.length,
    totalArtists: allArtists.length,
    totalArtworks: allArtworks.length,
    totalRevenue,
    totalCommission,
    commissionRate: store.getSettings().commissionRate,
    pendingArtworks,
  });
});

// GET /api/admin/users
router.get("/admin/users", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  res.json(store.listUsers());
});

// GET /api/admin/artists
router.get("/admin/artists", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const artists = store.listArtists().map((artist) => {
    const artworkCount = store.listArtworks({ artistId: artist.id }).total;
    const earnings = store.getArtistEarnings(artist.id);
    return {
      ...artist,
      artworkCount,
      totalSales: earnings.totalSales,
      pendingPayout: earnings.pendingPayout,
    };
  });
  res.json(artists);
});

// GET /api/admin/artworks
router.get("/admin/artworks", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const status = req.query.status as string | undefined;
  const artworks = store.listArtworks({ status }).items.map((art) => {
    const artist = store.getArtistById(art.artistId);
    return {
      ...art,
      imageUrl: art.imageUrls[0] || "",
      artist: artist ? { ...artist, followerCount: 300, artworkCount: 1 } : null,
    };
  });

  res.json(artworks);
});

// PATCH /api/admin/artworks/:id/status
router.patch("/admin/artworks/:id/status", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!["draft", "pending_review", "published", "sold", "archived"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const updated = store.updateArtwork(id, { status });
  if (!updated) {
    return res.status(404).json({ error: "Artwork not found" });
  }

  const artist = store.getArtistById(updated.artistId);
  res.json({
    ...updated,
    imageUrl: updated.imageUrls[0] || "",
    artist: artist ? { ...artist, followerCount: 300, artworkCount: 1 } : null,
  });
});

// GET /api/admin/orders
router.get("/admin/orders", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  res.json(store.listAllOrders());
});

// GET /api/admin/categories
router.get("/admin/categories", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  res.json(store.listCategories());
});

// POST /api/admin/categories
router.post("/admin/categories", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const { name, description, imageUrl } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Category name is required" });
  }

  const newCat = store.createCategory(name, description, imageUrl);
  res.status(201).json(newCat);
});

// PATCH /api/admin/categories/:id
router.patch("/admin/categories/:id", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  const updated = store.updateCategory(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json(updated);
});

// DELETE /api/admin/categories/:id
router.delete("/admin/categories/:id", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  store.deleteCategory(id);
  res.status(204).end();
});

// GET /api/admin/payouts
router.get("/admin/payouts", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const payouts = store.listPayouts().map((p) => {
    const artist = store.getArtistById(p.artistId);
    return {
      ...p,
      artist: artist ? { id: artist.id, displayName: artist.displayName } : null,
    };
  });
  res.json(payouts);
});

// PATCH /api/admin/payouts/:id
router.patch("/admin/payouts/:id", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  const { status, referenceNumber } = req.body;
  const updated = store.updatePayoutStatus(id, status, referenceNumber);
  if (!updated) {
    return res.status(404).json({ error: "Payout record not found" });
  }
  res.json(updated);
});

// GET /api/admin/settings
router.get("/admin/settings", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  res.json(store.getSettings());
});

// PATCH /api/admin/settings
router.patch("/admin/settings", async (req, res) => {
  const user = await requireRole(req, res, "admin");
  if (!user) return;

  const { commissionRate, currency, autoApproveArtworks, minPayoutAmount } = req.body;
  const updated = store.updateSettings({
    commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
    currency,
    autoApproveArtworks: autoApproveArtworks !== undefined ? Boolean(autoApproveArtworks) : undefined,
    minPayoutAmount: minPayoutAmount !== undefined ? Number(minPayoutAmount) : undefined,
  });

  res.json(updated);
});

export default router;
