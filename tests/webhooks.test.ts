import assert from "node:assert/strict";
import { test } from "node:test";

import type Stripe from "stripe";

import { getPaypalExternalId, getPaypalInternalOrderId, mapPaypalStatus } from "../src/app/api/payments/webhooks/paypal/route";
import { getStripeOrderUpdate, mapStripeStatus } from "../src/app/api/payments/webhooks/stripe/route";

test("PayPal approval does not mark an order as paid before capture", () => {
  assert.equal(mapPaypalStatus("CHECKOUT.ORDER.APPROVED"), null);
  assert.equal(mapPaypalStatus("PAYMENT.CAPTURE.COMPLETED"), "paid");
});

test("PayPal capture events resolve the original checkout order id", () => {
  assert.equal(
    getPaypalExternalId({
      resource: {
        id: "capture_123",
        supplementary_data: {
          related_ids: {
            order_id: "order_123"
          }
        }
      }
    }),
    "order_123"
  );
});

test("PayPal order events retain the internal order id", () => {
  assert.equal(
    getPaypalInternalOrderId({ resource: { purchase_units: [{ custom_id: "00000000-0000-4000-8000-000000000001" }] } }),
    "00000000-0000-4000-8000-000000000001"
  );
});

test("Stripe failed PaymentIntent events update by order metadata", () => {
  const event = {
    type: "payment_intent.payment_failed",
    data: {
      object: {
        id: "pi_123",
        metadata: {
          orderId: "00000000-0000-0000-0000-000000000001"
        }
      }
    }
  } as unknown as Stripe.Event;

  assert.deepEqual(getStripeOrderUpdate(event), {
    status: "failed",
    externalId: "pi_123",
    orderId: "00000000-0000-0000-0000-000000000001"
  });
});

test("Stripe session events can still update by checkout session id", () => {
  const event = {
    type: "checkout.session.expired",
    data: {
      object: {
        id: "cs_test_123",
        metadata: {}
      }
    }
  } as unknown as Stripe.Event;

  assert.equal(mapStripeStatus("checkout.session.async_payment_failed"), "failed");
  assert.deepEqual(getStripeOrderUpdate(event), {
    status: "cancelled",
    externalId: "cs_test_123",
    orderId: null
  });
});

test("Stripe only marks completed Checkout sessions paid after payment confirmation", () => {
  assert.equal(mapStripeStatus("checkout.session.completed", "unpaid"), null);
  assert.equal(mapStripeStatus("checkout.session.completed", "paid"), "paid");
  assert.equal(mapStripeStatus("checkout.session.async_payment_succeeded"), "paid");
});
