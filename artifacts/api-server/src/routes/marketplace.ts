import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

// GET /api/marketplace/home
router.get("/marketplace/home", (_req, res) => {
  const publishedArtworks = store.listArtworks({ status: "published" }).items;
  const featuredArtworks = publishedArtworks.filter((a) => a.featured);
  const trendingArtists = store.listArtists().map((artist) => {
    const artworksCount = store.listArtworks({ artistId: artist.id, status: "published" }).total;
    return {
      ...artist,
      followerCount: 300 + artist.id * 85,
      artworkCount: artworksCount,
    };
  });
  const categories = store.listCategories().map((cat) => {
    const count = publishedArtworks.filter((a) => a.category.toLowerCase() === cat.name.toLowerCase()).length;
    return {
      ...cat,
      artworkCount: count,
    };
  });

  const formattedArtworks = publishedArtworks.map((art) => {
    const artist = store.getArtistById(art.artistId);
    return {
      ...art,
      imageUrl: art.imageUrls[0] || "",
      artist: artist
        ? {
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id, status: "published" }).total,
          }
        : null,
    };
  });

  res.json({
    featuredArtworks: formattedArtworks.filter((a) => a.featured),
    trendingArtists,
    categories,
    newArrivals: formattedArtworks.slice(0, 4),
  });
});

// GET /api/artworks
router.get("/artworks", (req, res) => {
  const q = req.query.q as string | undefined;
  const category = req.query.category as string | undefined;
  const sort = req.query.sort as string | undefined;
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = parseInt(req.query.limit as string || "24", 10);

  const result = store.listArtworks({
    q,
    category,
    sort,
    page,
    limit,
    status: "published",
  });

  const items = result.items.map((art) => {
    const artist = store.getArtistById(art.artistId);
    return {
      ...art,
      imageUrl: art.imageUrls[0] || "",
      artist: artist
        ? {
            ...artist,
            followerCount: 300 + artist.id * 85,
            artworkCount: store.listArtworks({ artistId: artist.id, status: "published" }).total,
          }
        : null,
    };
  });

  res.json({
    items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

// GET /api/artworks/:id
router.get("/artworks/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const artwork = store.getArtworkById(id);
  if (!artwork) {
    return res.status(404).json({ error: "Artwork not found" });
  }

  // Increment view count
  artwork.views += 1;

  const artist = store.getArtistById(artwork.artistId);
  const relatedList = store
    .listArtworks({ category: artwork.category, status: "published" })
    .items.filter((a) => a.id !== artwork.id)
    .slice(0, 4)
    .map((rel) => {
      const relArtist = store.getArtistById(rel.artistId);
      return {
        ...rel,
        imageUrl: rel.imageUrls[0] || "",
        artist: relArtist
          ? {
              ...relArtist,
              followerCount: 300 + relArtist.id * 85,
              artworkCount: store.listArtworks({ artistId: relArtist.id, status: "published" }).total,
            }
          : null,
      };
    });

  const formattedArtwork = {
    ...artwork,
    imageUrl: artwork.imageUrls[0] || "",
    artist: artist
      ? {
          ...artist,
          followerCount: 300 + artist.id * 85,
          artworkCount: store.listArtworks({ artistId: artist.id, status: "published" }).total,
        }
      : null,
    relatedArtworks: relatedList,
  };

  res.json(formattedArtwork);
});

// GET /api/categories
router.get("/categories", (_req, res) => {
  const published = store.listArtworks({ status: "published" }).items;
  const categories = store.listCategories().map((cat) => {
    const count = published.filter((a) => a.category.toLowerCase() === cat.name.toLowerCase()).length;
    return {
      ...cat,
      artworkCount: count,
    };
  });
  res.json(categories);
});

// GET /api/artists
router.get("/artists", (_req, res) => {
  const artists = store.listArtists().map((artist) => {
    const count = store.listArtworks({ artistId: artist.id, status: "published" }).total;
    return {
      ...artist,
      followerCount: 300 + artist.id * 85,
      artworkCount: count,
    };
  });
  res.json(artists);
});

// GET /api/artists/:slug
router.get("/artists/:slug", (req, res) => {
  const slug = req.params.slug;
  const artist = store.getArtistBySlug(slug);
  if (!artist) {
    return res.status(404).json({ error: "Artist not found" });
  }

  const artistArtworks = store
    .listArtworks({ artistId: artist.id, status: "published" })
    .items.map((art) => ({
      ...art,
      imageUrl: art.imageUrls[0] || "",
      artist: {
        ...artist,
        followerCount: 300 + artist.id * 85,
        artworkCount: store.listArtworks({ artistId: artist.id, status: "published" }).total,
      },
    }));

  res.json({
    artist: {
      ...artist,
      followerCount: 300 + artist.id * 85,
      artworkCount: artistArtworks.length,
    },
    artworks: artistArtworks,
  });
});

export default router;
