import nodemailer from "nodemailer";

import { getNotificationsEnv } from "@/lib/config/env";
import { logger } from "@/lib/observability/logger";

export async function sendEmail(input: { to: string; subject: string; text: string; html: string }) {
  const env = getNotificationsEnv();
  if (env.EMAIL_PROVIDER === "console") {
    logger.info("Development email", { to: input.to, subject: input.subject, text: input.text });
    return { provider: "console", externalId: null };
  }
  if (!env.SMTP_URL) throw new Error("SMTP_URL is required for the smtp email provider");
  const transport = nodemailer.createTransport(env.SMTP_URL);
  const result = await transport.sendMail({ from: env.EMAIL_FROM, ...input });
  return { provider: "smtp", externalId: result.messageId };
}
