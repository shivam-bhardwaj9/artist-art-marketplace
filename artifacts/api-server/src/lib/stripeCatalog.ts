import { eq } from "drizzle-orm";
import { artworksTable } from "@workspace/db/schema";
import type { ArtworkRecord } from "@workspace/db/schema";
import { db } from "./db";
import { getUncachableStripeClient } from "../stripeClient";

export async function ensureArtworkStripePrice(record: ArtworkRecord): Promise<ArtworkRecord> {
  const stripe = await getUncachableStripeClient();
  let productId = record.stripeProductId;

  if (productId) {
    await stripe.products.update(productId, {
      name: record.title,
      description: record.description.slice(0, 500),
      active: record.status !== "archived",
      metadata: { marketplace_artwork_id: String(record.id), artist_id: String(record.artistId) },
    });
  } else {
    const product = await stripe.products.create({
      name: record.title,
      description: record.description.slice(0, 500),
      active: record.status !== "archived",
      metadata: { marketplace_artwork_id: String(record.id), artist_id: String(record.artistId) },
    });
    productId = product.id;
    await db.update(artworksTable).set({ stripeProductId: productId })
      .where(eq(artworksTable.id, record.id));
  }

  const amount = Math.round(record.price * 100);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error("Artwork price must be at least one minor currency unit");
  }
  const previousPrice = record.stripePriceId
    ? await stripe.prices.retrieve(record.stripePriceId)
    : null;
  if (previousPrice && previousPrice.unit_amount === amount &&
      previousPrice.currency === record.currency.toLowerCase() && previousPrice.active) {
    const [current] = await db.select().from(artworksTable)
      .where(eq(artworksTable.id, record.id)).limit(1);
    return current ?? record;
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: record.currency.toLowerCase(),
    metadata: { marketplace_artwork_id: String(record.id) },
  });
  const [updated] = await db.update(artworksTable)
    .set({ stripeProductId: productId, stripePriceId: price.id })
    .where(eq(artworksTable.id, record.id)).returning();
  if (record.stripePriceId) {
    await stripe.prices.update(record.stripePriceId, { active: false });
  }
  return updated ?? record;
}
