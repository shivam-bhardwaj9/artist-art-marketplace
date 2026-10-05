import Stripe from "stripe";
import { store } from "./lib/store";

export async function getStripeCredentials(): Promise<{ secretKey?: string; webhookSecret?: string }> {
  // Standard environment variables first
  if (process.env.STRIPE_SECRET_KEY) {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    };
  }

  // Fallback to Replit connector if available
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (hostname && replitToken) {
    try {
      const response = await fetch(
        `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
        {
          headers: { Accept: "application/json", X_REPLIT_TOKEN: replitToken },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (response.ok) {
        const data = await response.json() as {
          items?: Array<{ settings?: { secret_key?: string; webhook_secret?: string } }>;
        };
        const settings = data.items?.[0]?.settings;
        if (settings?.secret_key) {
          return { secretKey: settings.secret_key, webhookSecret: settings.webhook_secret };
        }
      }
    } catch {}
  }

  return {};
}

export async function getUncachableStripeClient(): Promise<Stripe | null> {
  const { secretKey } = await getStripeCredentials();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

export async function createStripeCheckoutSession(params: {
  userId: string;
  items: Array<{ artworkId: number; title: string; price: number; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = await getUncachableStripeClient();
  if (!stripe) return null;

  const line_items = params.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
    },
  });

  return {
    url: session.url || "",
    sessionId: session.id,
  };
}

export async function handleStripeWebhookEvent(payload: Buffer | string, signature: string): Promise<{ received: boolean }> {
  const { secretKey, webhookSecret } = await getStripeCredentials();
  if (!secretKey || !webhookSecret) {
    console.warn("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured");
    return { received: true };
  }

  const stripe = new Stripe(secretKey);
  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        // Complete the order in store
        const existingOrder = store.state?.orders?.find?.((o: any) => o.stripeSessionId === session.id);
        if (existingOrder) {
          existingOrder.paymentStatus = "paid";
          existingOrder.status = "confirmed";
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.warn("Payment failed for payment_intent:", intent.id);
      break;
    }
  }

  return { received: true };
}
