import { PaypalPaymentProvider } from "@/lib/payments/providers/paypal";
import { StripePaymentProvider } from "@/lib/payments/providers/stripe";
import type { PaymentProvider } from "@/lib/payments/types";

const providers: Record<string, PaymentProvider> = {
  stripe: new StripePaymentProvider(),
  paypal: new PaypalPaymentProvider()
};

export function getPaymentProvider(provider: string) {
  const selected = providers[provider];

  if (!selected) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  return selected;
}

