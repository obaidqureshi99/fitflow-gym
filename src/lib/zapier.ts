export type ZapEvent = 'welcome' | 'renewal_reminder' | 'payment_failed' | 'payment_remaining';

/** One Zapier "Catch Hook" handles all automations; Zap paths filter on `event`. */
export async function sendZap(event: ZapEvent, payload: Record<string, unknown>) {
  const url = process.env.ZAPIER_WEBHOOK_URL;
  if (!url) {
    console.log(`[zapier:skipped] ${event} (ZAPIER_WEBHOOK_URL is not set)`, payload);
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }),
    });
    if (!res.ok) {
      console.error(`[zapier:error] ${event} returned status ${res.status}`);
      return false;
    }
    console.log(`[zapier:success] Sent ${event} to Zapier`);
    return true;
  } catch (err) {
    console.error(`[zapier:error] Failed to send ${event} to Zapier:`, err);
    return false;
  }
}
