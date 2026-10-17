import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendZap } from '@/lib/zapier';
import { addDays, iso } from '@/lib/format';

/**
 * Call daily (Zapier Schedule, Vercel Cron, or GitHub Actions):
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/reminders
 * Sends a Zapier event for every active member whose renewal is exactly 7 days away.
 */
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const target = iso(addDays(new Date(), 7));
  const { data } = await createAdminClient().from('members').select('full_name, email, code, renewal_date, plans(name, price)')
    .eq('status', 'active').eq('archived', false).eq('renewal_date', target);
  let sent = 0;
  for (const m of data ?? []) {
    if (!m.email) continue;
    if (await sendZap('renewal_reminder', { name: m.full_name, email: m.email, member_code: m.code, renewal_date: m.renewal_date, plan: (m as any).plans?.name, price: (m as any).plans?.price })) sent++;
  }
  return NextResponse.json({ date: target, found: data?.length ?? 0, sent });
}
