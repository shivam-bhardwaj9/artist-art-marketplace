/**
 * Normalized artwork image helper.
 * Safely handles:
 * - artwork.imageUrls (array of strings)
 * - artwork.artworkImages (array of objects { url } or strings)
 * - artwork.images (array of strings or objects)
 * - artwork.imageUrl (single string)
 * - undefined / null / malformed data
 *
 * Never returns undefined. Never throws.
 */

const FALLBACK_ARTWORKS = [
  '/artwork/after-the-rain.jpg',
  '/artwork/blue-hour.jpg',
  '/artwork/citrus-study.jpg',
  '/artwork/tidal-form.jpg',
  '/artwork/quiet-room.jpg',
  '/artwork/soft-architecture.jpg',
  '/artwork/wild-garden.jpg',
  '/artwork/folded-vessel.jpg',
];

export function getArtworkImages(artwork?: any): string[] {
  if (!artwork || typeof artwork !== 'object') {
    return [];
  }

  // 1. Array of imageUrls
  if (Array.isArray(artwork.imageUrls) && artwork.imageUrls.length > 0) {
    const cleaned = artwork.imageUrls
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 2. Array of artworkImages ({ url: string } or string)
  if (Array.isArray(artwork.artworkImages) && artwork.artworkImages.length > 0) {
    const cleaned = artwork.artworkImages
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 3. Array of images
  if (Array.isArray(artwork.images) && artwork.images.length > 0) {
    const cleaned = artwork.images
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 4. Single imageUrl
  if (typeof artwork.imageUrl === 'string' && artwork.imageUrl.trim().length > 0) {
    return [artwork.imageUrl.trim()];
  }

  return [];
}

export function getArtworkPrimaryImage(artwork?: any): string {
  const images = getArtworkImages(artwork);
  if (images.length > 0) {
    return images[0];
  }

  const id = Number(artwork?.id);
  if (Number.isFinite(id) && id > 0) {
    return FALLBACK_ARTWORKS[(id - 1) % FALLBACK_ARTWORKS.length];
  }

  return FALLBACK_ARTWORKS[0];
}
