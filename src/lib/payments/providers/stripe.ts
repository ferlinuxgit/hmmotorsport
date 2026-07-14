import Stripe from "stripe";

import { getPaymentsEnv } from "@/lib/config/env";
import { decimalToMinorUnits } from "@/lib/payments/money";
import type { CheckoutInput, CheckoutSession, PaymentProvider } from "@/lib/payments/types";

export class StripePaymentProvider implements PaymentProvider {
  readonly key = "stripe" as const;

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const env = getPaymentsEnv();

    if (!env.STRIPE_SECRET_KEY) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("STRIPE_SECRET_KEY is required in production");
      }

      return {
        provider: "stripe",
        sessionId: `stripe-dev-${input.orderId}`,
        checkoutUrl: `${input.successUrl}?provider=stripe&mode=mock`
      };
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      metadata: {
        orderId: input.orderId
      },
      payment_intent_data: {
        metadata: {
          orderId: input.orderId
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: decimalToMinorUnits(input.amount, input.currency),
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
