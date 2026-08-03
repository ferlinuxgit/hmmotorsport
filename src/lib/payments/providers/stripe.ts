import Stripe from "stripe";

import { getPaymentsEnv } from "@/lib/config/env";
import { decimalToMinorUnits } from "@/lib/payments/money";
import type { CheckoutInput, CheckoutSession, PaymentProvider, RefundInput, RefundResult, ReconciledPaymentStatus } from "@/lib/payments/types";

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

  async getPaymentStatus(externalId: string): Promise<ReconciledPaymentStatus> {
    const env = getPaymentsEnv();
    if (!env.STRIPE_SECRET_KEY) return externalId.startsWith("stripe-dev-") ? "paid" : "failed";
    const session = await new Stripe(env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(externalId);
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return "paid";
    if (session.status === "expired") return "cancelled";
    return "checkout_pending";
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    const env = getPaymentsEnv();
    if (!env.STRIPE_SECRET_KEY) return { id: `stripe-refund-dev-${input.idempotencyKey}`, status: "succeeded" };
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(input.externalId, { expand: ["payment_intent"] });
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntent) throw new Error("Stripe Checkout Session has no PaymentIntent to refund");
    const refund = await stripe.refunds.create({ payment_intent: paymentIntent, amount: decimalToMinorUnits(input.amount, input.currency), metadata: { idempotencyKey: input.idempotencyKey } }, { idempotencyKey: input.idempotencyKey });
    if (refund.status === "failed" || refund.status === "canceled" || refund.status === "requires_action") throw new Error(`Stripe refund ended with status ${refund.status}`);
    return { id: refund.id, status: refund.status === "succeeded" ? "succeeded" : "pending" };
  }
}
