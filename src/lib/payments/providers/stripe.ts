import Stripe from "stripe";

import { getPaymentsEnv } from "@/lib/config/env";
import type { CheckoutInput, CheckoutSession, PaymentProvider } from "@/lib/payments/types";

export class StripePaymentProvider implements PaymentProvider {
  readonly key = "stripe" as const;

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const env = getPaymentsEnv();

    if (!env.STRIPE_SECRET_KEY) {
      return {
        provider: "stripe",
        sessionId: "stripe-dev-placeholder",
        checkoutUrl: `${input.successUrl}?provider=stripe&mode=mock`
      };
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: Math.round(input.amount * 100),
            product_data: {
              name: input.description
            }
          }
        }
      ]
    });

    return {
      provider: "stripe",
      sessionId: session.id,
      checkoutUrl: session.url ?? input.successUrl
    };
  }
}
