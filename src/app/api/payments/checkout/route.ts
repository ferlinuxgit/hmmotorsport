import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppEnv } from "@/lib/config/env";
import { getPaymentProvider } from "@/lib/payments";

const checkoutSchema = z.object({
  provider: z.enum(["stripe", "paypal"]),
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().min(3),
  successPath: z.string().startsWith("/").default("/dashboard"),
  cancelPath: z.string().startsWith("/").default("/")
});

export async function POST(request: Request) {
  const body = checkoutSchema.parse(await request.json());
  const env = getAppEnv();
  const paymentProvider = getPaymentProvider(body.provider);
  const session = await paymentProvider.createCheckoutSession({
    amount: body.amount,
    currency: body.currency,
    description: body.description,
    successUrl: new URL(body.successPath, env.APP_URL).toString(),
    cancelUrl: new URL(body.cancelPath, env.APP_URL).toString()
  });

  return NextResponse.json(session);
}
