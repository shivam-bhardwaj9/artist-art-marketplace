/**
 * Normalized artwork image helper.
 * Safely handles:
 * - artwork.imageUrls (array of strings)
 * - artwork.artwork_images (array of objects { url } or strings from database schema)
 * - artwork.artworkImages (camelCase variant)
 * - artwork.images (array of strings or objects)
 * - artwork.imageUrl (single string)
 * - artwork.image_url (snake_case string)
 * - undefined / null / malformed data
 *
 * Guaranteed:
 * - Always returns a string[] (never undefined, never null)
 * - Never throws
 * - Never allows undefined.join(...)
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
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 2. Array of artwork_images (drizzle schema)
  if (Array.isArray(artwork.artwork_images) && artwork.artwork_images.length > 0) {
    const cleaned = artwork.artwork_images
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 3. Array of artworkImages (camelCase)
  if (Array.isArray(artwork.artworkImages) && artwork.artworkImages.length > 0) {
    const cleaned = artwork.artworkImages
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 4. Array of images
  if (Array.isArray(artwork.images) && artwork.images.length > 0) {
    const cleaned = artwork.images
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  // 5. Single imageUrl
  if (typeof artwork.imageUrl === 'string' && artwork.imageUrl.trim().length > 0) {
    return [artwork.imageUrl.trim()];
  }

  // 6. Single image_url
  if (typeof artwork.image_url === 'string' && artwork.image_url.trim().length > 0) {
    return [artwork.image_url.trim()];
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
