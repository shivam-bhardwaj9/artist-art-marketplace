import { and, count, eq } from "drizzle-orm";
import { artistFollowsTable, artistProfilesTable, artworksTable, usersTable } from "@workspace/db/schema";
import type { ArtistProfile, ArtworkRecord } from "@workspace/db/schema";
import { db } from "./db";

export async function toArtistDto(profile: ArtistProfile) {
  const [[artworkResult], [followerResult]] = await Promise.all([
    db.select({ total: count() }).from(artworksTable).where(
      and(eq(artworksTable.artistId, profile.id), eq(artworksTable.status, "published")),
    ),
    db.select({ total: count() }).from(artistFollowsTable).where(eq(artistFollowsTable.artistId, profile.id)),
  ]);
  return {
    id: profile.id,
    displayName: profile.displayName,
    slug: profile.slug,
    location: profile.location,
    biography: profile.biography,
    imageUrl: profile.imageUrl ?? "",
    website: profile.website,
    followerCount: Number(followerResult?.total ?? 0),
    artworkCount: Number(artworkResult?.total ?? 0),
    rating: profile.rating,
  };
}

export async function toArtworkDto(record: ArtworkRecord, suppliedArtist?: ArtistProfile) {
  let profile = suppliedArtist;
  if (!profile) {
    const [found] = await db.select().from(artistProfilesTable)
      .where(eq(artistProfilesTable.id, record.artistId)).limit(1);
    if (!found) throw new Error(`Artwork ${record.id} has no artist profile`);
    profile = found;
  }
  const imageUrls = record.imageUrls ?? [];
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    description: record.description,
    price: record.price,
    currency: record.currency,
    category: record.category,
    medium: record.medium,
    dimensions: record.dimensions,
    yearCreated: record.yearCreated,
    status: record.status,
    imageUrl: imageUrls[0] ?? "",
    imageUrls,
    artist: await toArtistDto(profile),
    artworkType: record.artworkType,
    featured: record.featured,
    quantity: record.quantity,
  };
}

export async function getArtistBySlug(slug: string) {
  const [artist] = await db.select().from(artistProfilesTable)
    .where(eq(artistProfilesTable.slug, slug)).limit(1);
  return artist ?? null;
}

export async function getArtistByUserId(userId: string) {
  const [artist] = await db.select().from(artistProfilesTable)
    .where(eq(artistProfilesTable.userId, userId)).limit(1);
  return artist ?? null;
}

export function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "artwork";
}

const seedArtists = [
  {
    userId: "seed-artist-mira-sen",
    displayName: "Mira Sen",
    slug: "mira-sen",
    location: "Jaipur, India",
    biography: "Mira's paintings find quiet movement in the colors and textures of everyday life. Her studio practice moves between memory, landscape, and the changing light of home.",
    imageUrl: "/artwork/after-the-rain.jpg",
    rating: 0,
  },
  {
    userId: "seed-artist-eli-navarro",
    displayName: "Eli Navarro",
    slug: "eli-navarro",
    location: "Lisbon, Portugal",
    biography: "Working across painting and mixed media, Eli builds layered compositions from walks, found color, and the imperfect geometry of the city.",
    imageUrl: "/artwork/blue-hour.jpg",
    rating: 0,
  },
  {
    userId: "seed-artist-aya-mori",
    displayName: "Aya Mori",
    slug: "aya-mori",
    location: "Kyoto, Japan",
    biography: "Aya makes tactile forms shaped by patient observation. Her work draws on botanical silhouettes and the spaces between objects.",
    imageUrl: "/artwork/citrus-study.jpg",
    rating: 0,
  },
  {
    userId: "seed-artist-noah-bell",
    displayName: "Noah Bell",
    slug: "noah-bell",
    location: "Brooklyn, United States",
    biography: "Noah's photographs and paper works pay attention to small, overlooked moments: a window left open, a garden after rain, a room at rest.",
    imageUrl: "/artwork/quiet-room.jpg",
    rating: 0,
  },
];

const seedArtworks = [
  { title: "After the Rain", artist: "mira-sen", description: "Soft greens and washed blues settle into the last light of a summer storm.", price: 560, category: "Painting", medium: "Oil and cold wax on linen", dimensions: "60 × 80 cm", yearCreated: 2025, image: "/artwork/after-the-rain.jpg", type: "original", featured: true },
  { title: "Blue Hour No. 4", artist: "eli-navarro", description: "A study of evening light, built up in translucent layers of pigment.", price: 420, category: "Painting", medium: "Acrylic and graphite on canvas", dimensions: "50 × 70 cm", yearCreated: 2025, image: "/artwork/blue-hour.jpg", type: "original", featured: true },
  { title: "Citrus Study", artist: "aya-mori", description: "A bright, measured arrangement of fruit, paper, and shifting shadows.", price: 320, category: "Painting", medium: "Gouache on cotton paper", dimensions: "30 × 42 cm", yearCreated: 2024, image: "/artwork/citrus-study.jpg", type: "original", featured: false },
  { title: "Tidal Form", artist: "aya-mori", description: "A hand-built ceramic form with an irregular, salt-like glaze.", price: 720, category: "Sculpture", medium: "Stoneware with satin glaze", dimensions: "24 × 18 × 15 cm", yearCreated: 2025, image: "/artwork/tidal-form.jpg", type: "original", featured: true },
  { title: "Quiet Room", artist: "noah-bell", description: "A calm interior, photographed in the spare light of early morning.", price: 280, category: "Photography", medium: "Archival pigment print", dimensions: "40 × 50 cm", yearCreated: 2024, image: "/artwork/quiet-room.jpg", type: "print", featured: false },
  { title: "Soft Architecture", artist: "eli-navarro", description: "Rounded planes and hand-drawn edges turn a city block into a memory.", price: 480, category: "Painting", medium: "Oil and pastel on panel", dimensions: "45 × 60 cm", yearCreated: 2025, image: "/artwork/soft-architecture.jpg", type: "original", featured: false },
  { title: "Wild Garden", artist: "mira-sen", description: "An expressive garden scene, alive with color and loose, layered brushwork.", price: 640, category: "Painting", medium: "Oil on linen", dimensions: "70 × 90 cm", yearCreated: 2025, image: "/artwork/wild-garden.jpg", type: "original", featured: true },
  { title: "Folded Vessel", artist: "aya-mori", description: "A sculptural paper study translated into a small, tactile ceramic vessel.", price: 350, category: "Sculpture", medium: "Hand-built porcelain", dimensions: "19 × 16 × 13 cm", yearCreated: 2024, image: "/artwork/folded-vessel.jpg", type: "original", featured: false },
];

export async function seedMarketplace() {
  const [existing] = await db.select({ id: artworksTable.id }).from(artworksTable).limit(1);
  if (existing) return;

  const profiles = new Map<string, ArtistProfile>();
  for (const seed of seedArtists) {
    await db.insert(usersTable).values({ id: seed.userId, role: "artist" }).onConflictDoNothing();
    await db.insert(artistProfilesTable).values(seed).onConflictDoNothing();
    const [profile] = await db.select().from(artistProfilesTable)
      .where(eq(artistProfilesTable.slug, seed.slug)).limit(1);
    if (profile) profiles.set(seed.slug, profile);
  }

  for (const [index, seed] of seedArtworks.entries()) {
    const profile = profiles.get(seed.artist);
    if (!profile) continue;
    await db.insert(artworksTable).values({
      artistId: profile.id,
      title: seed.title,
      slug: `${slugify(seed.title)}-${index + 1}`,
      description: seed.description,
      price: seed.price,
      currency: "USD",
      category: seed.category,
      medium: seed.medium,
      dimensions: seed.dimensions,
      yearCreated: seed.yearCreated,
      status: "published",
      imageUrls: [seed.image],
      artworkType: seed.type,
      featured: seed.featured,
      quantity: seed.type === "print" ? 25 : 1,
    }).onConflictDoNothing();
  }
}
