import { logger } from "./logger";

const BUSINESS_EMAIL =
  process.env.QUOTE_NOTIFICATION_EMAIL ||
  "info@carolinaexteriorlandscapes.com";

type QuotePayload = Record<string, unknown> & { id: number };

/**
 * Sends a lead notification to the business.
 *
 * Email delivery requires an email integration (e.g. SendGrid) to be
 * connected by the business owner. Until that exists, this function logs the
 * lead and returns without throwing, so quote submissions ALWAYS persist to
 * the database regardless of email availability.
 */
export async function sendQuoteNotification(
  kind: "residential" | "commercial",
  payload: QuotePayload,
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    logger.info(
      { leadId: payload.id, kind, to: BUSINESS_EMAIL },
      "New quote lead saved. Email not sent (no email integration configured yet).",
    );
    return;
  }

  try {
    const subject =
      kind === "residential"
        ? `New residential quote request (#${payload.id})`
        : `New commercial quote request (#${payload.id})`;

    const lines = Object.entries(payload)
      .filter(([k]) => k !== "id")
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v ?? ""}`)
      .join("\n");

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: BUSINESS_EMAIL }] }],
        from: { email: BUSINESS_EMAIL },
        subject,
        content: [
          {
            type: "text/plain",
            value: `A new ${kind} quote request was submitted.\n\n${lines}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(
        { leadId: payload.id, status: res.status, body },
        "Failed to send quote notification email (lead is saved).",
      );
      return;
    }

    logger.info({ leadId: payload.id, kind }, "Quote notification email sent.");
  } catch (err) {
    logger.error(
      { err, leadId: payload.id },
      "Error sending quote notification email (lead is saved).",
    );
  }
}
