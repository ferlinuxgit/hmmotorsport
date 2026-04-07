import { getPaymentsEnv } from "@/lib/config/env";
import type { CheckoutInput, CheckoutSession, PaymentProvider } from "@/lib/payments/types";

export class PaypalPaymentProvider implements PaymentProvider {
  readonly key = "paypal" as const;

  private getBaseUrl() {
    const env = getPaymentsEnv();

    return env.PAYPAL_ENVIRONMENT === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  private async getAccessToken() {
    const env = getPaymentsEnv();

    if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
      return null;
    }

    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
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

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const token = await this.getAccessToken();

    if (!token) {
      return {
        provider: "paypal",
        sessionId: "paypal-dev-placeholder",
        checkoutUrl: `${input.successUrl}?provider=paypal&mode=mock`
      };
    }

    const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: input.description,
            amount: {
              currency_code: input.currency.toUpperCase(),
              value: input.amount.toFixed(2)
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
}
