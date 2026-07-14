export interface CheckoutInput {
  orderId: string;
  amount: string;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
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
