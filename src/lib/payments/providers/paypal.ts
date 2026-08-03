import { getPaymentsEnv } from "@/lib/config/env";
import type { CheckoutInput, CheckoutSession, PaymentProvider, RefundInput, RefundResult, ReconciledPaymentStatus } from "@/lib/payments/types";

type PaypalAccessToken = string | null;

export async function paypalFetch(url: string, init: RequestInit, attempts = 2) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(8_000)
      });

      if (response.status !== 429 && response.status < 500) {
        return response;
      }

      lastError = new Error(`PayPal request failed with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("PayPal request failed");
}

export function getPaypalBaseUrl(environment: "sandbox" | "live") {
  return environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export class PaypalPaymentProvider implements PaymentProvider {
  readonly key = "paypal" as const;

  private getBaseUrl() {
    const env = getPaymentsEnv();

    return getPaypalBaseUrl(env.PAYPAL_ENVIRONMENT);
  }

  private async getAccessToken(): Promise<PaypalAccessToken> {
    const env = getPaymentsEnv();

    if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required in production");
      }

      return null;
    }

    const response = await paypalFetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with PayPal");
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  async captureOrder(orderId: string) {
    const token = await this.getAccessToken();

    if (!token) {
      return { status: "COMPLETED" };
    }

    const response = await paypalFetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": orderId
      }
    });

    if (!response.ok) {
      const existing = await paypalFetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (existing.ok) {
        const order = (await existing.json()) as { status?: string };

        if (order.status === "COMPLETED") {
          return order;
        }
      }

      throw new Error(`Failed to capture PayPal order (${response.status})`);
    }

    return (await response.json()) as { status?: string };
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const token = await this.getAccessToken();

    if (!token) {
      return {
        provider: "paypal",
        sessionId: `paypal-dev-${input.orderId}`,
        checkoutUrl: `${input.successUrl}?provider=paypal&mode=mock`
      };
    }

    const response = await paypalFetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": input.orderId
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: input.description,
            custom_id: input.orderId,
            amount: {
              currency_code: input.currency.toUpperCase(),
              value: input.amount
            }
          }
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: input.successUrl,
              cancel_url: input.cancelUrl
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to create PayPal order");
    }

    const data = (await response.json()) as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    return {
      provider: "paypal",
      sessionId: data.id,
      checkoutUrl: data.links.find((link) => link.rel === "payer-action")?.href ?? input.successUrl
    };
  }

  async getPaymentStatus(externalId: string): Promise<ReconciledPaymentStatus> {
    const token = await this.getAccessToken();
    if (!token) return externalId.startsWith("paypal-dev-") ? "paid" : "failed";
    const response = await paypalFetch(`${this.getBaseUrl()}/v2/checkout/orders/${externalId}`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Failed to reconcile PayPal order (${response.status})`);
    const order = (await response.json()) as { status?: string };
    if (order.status === "COMPLETED") return "paid";
    if (order.status === "VOIDED") return "cancelled";
    if (order.status === "PAYER_ACTION_REQUIRED" || order.status === "CREATED" || order.status === "APPROVED") return "checkout_pending";
    return "failed";
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    const token = await this.getAccessToken();
    if (!token) return { id: `paypal-refund-dev-${input.idempotencyKey}`, status: "succeeded" };
    const orderResponse = await paypalFetch(`${this.getBaseUrl()}/v2/checkout/orders/${input.externalId}`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (!orderResponse.ok) throw new Error(`Failed to retrieve PayPal order (${orderResponse.status})`);
    const order = (await orderResponse.json()) as { purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string; status?: string }> } }> };
    const captureId = order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? []).find((capture) => capture.status === "COMPLETED")?.id;
    if (!captureId) throw new Error("PayPal order has no completed capture to refund");
    const response = await paypalFetch(`${this.getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": input.idempotencyKey, Prefer: "return=representation" },
      body: JSON.stringify({ amount: { value: input.amount, currency_code: input.currency.toUpperCase() } })
    });
    if (!response.ok) throw new Error(`Failed to refund PayPal capture (${response.status})`);
    const refund = (await response.json()) as { id?: string; status?: string };
    if (!refund.id) throw new Error("PayPal refund response has no id");
    if (refund.status !== "COMPLETED" && refund.status !== "PENDING") throw new Error(`PayPal refund ended with status ${refund.status ?? "unknown"}`);
    return { id: refund.id, status: refund.status === "COMPLETED" ? "succeeded" : "pending" };
  }
}
