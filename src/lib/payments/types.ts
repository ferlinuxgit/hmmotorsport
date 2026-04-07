export interface CheckoutInput {
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  provider: "stripe" | "paypal";
  sessionId: string;
  checkoutUrl: string;
}

export interface PaymentProvider {
  key: "stripe" | "paypal";
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>;
}

