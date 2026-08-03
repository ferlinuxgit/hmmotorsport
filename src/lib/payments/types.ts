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

export type ReconciledPaymentStatus = "checkout_pending" | "paid" | "cancelled" | "failed";
export interface RefundInput { externalId: string; amount: string; currency: string; idempotencyKey: string; }
export interface RefundResult { id: string; status: "succeeded" | "pending"; }

export interface PaymentProvider {
  key: "stripe" | "paypal";
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>;
  getPaymentStatus(externalId: string): Promise<ReconciledPaymentStatus>;
  refundPayment(input: RefundInput): Promise<RefundResult>;
}
