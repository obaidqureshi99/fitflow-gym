import { createClient } from '@/lib/supabase/server';
import { addDays, iso } from '@/lib/format';

export type AtRisk = { id: string; full_name: string; email: string | null; recent: number; previous: number; lastVisit: string | null; drop: number };

/** At-risk = active member whose visits in the last 14 days dropped by 50%+ vs the 14 days before (or went to zero). */
export async function getAtRiskMembers(): Promise<AtRisk[]> {
  const supabase = createClient();
  const now = new Date();
  const since = addDays(now, -28).toISOString();
  const [{ data: members }, { data: visits }] = await Promise.all([
    supabase.from('members').select('id, full_name, email').eq('status', 'active').eq('archived', false),
    supabase.from('attendance').select('member_id, checked_in_at').gte('checked_in_at', since),
  ]);
  const cut = addDays(now, -14).getTime();
  const map = new Map<string, { recent: number; previous: number; last: string | null }>();
  (visits ?? []).forEach((v: any) => {
    const m = map.get(v.member_id) ?? { recent: 0, previous: 0, last: null };
    if (new Date(v.checked_in_at).getTime() >= cut) m.recent++; else m.previous++;
    if (!m.last || v.checked_in_at > m.last) m.last = v.checked_in_at;
    map.set(v.member_id, m);
  });
  return (members ?? [])
    .map((m: any) => {
      const s = map.get(m.id) ?? { recent: 0, previous: 0, last: null };
      const drop = s.previous === 0 ? 0 : Math.round(((s.previous - s.recent) / s.previous) * 100);
      return { ...m, recent: s.recent, previous: s.previous, lastVisit: s.last, drop };
    })
    .filter((m: AtRisk) => m.previous >= 3 && m.drop >= 50)
    .sort((a: AtRisk, b: AtRisk) => b.drop - a.drop);
}

export async function getMonthStats() {
  const supabase = createClient();
  const start = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [m, a, p, pl] = await Promise.all([
    supabase.from('members').select('status, join_date, plan_id').eq('archived', false),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).gte('checked_in_at', start),
    supabase.from('payments').select('amount, status').gte('created_at', start),
    supabase.from('plans').select('id, name'),
  ]);
  const members = m.data ?? [];
  const planName = new Map((pl.data ?? []).map((x: any) => [x.id, x.name]));
  const mix: Record<string, number> = {};
  members.forEach((x: any) => { const n = planName.get(x.plan_id) ?? 'No plan'; mix[n] = (mix[n] ?? 0) + 1; });
  return {
    total: members.length,
    active: members.filter((x: any) => x.status === 'active').length,
    expired: members.filter((x: any) => x.status === 'expired').length,
    paused: members.filter((x: any) => x.status === 'paused').length,
    cancelled: members.filter((x: any) => x.status === 'cancelled').length,
    newThisMonth: members.filter((x: any) => x.join_date >= start).length,
    visits: a.count ?? 0,
    revenue: (p.data ?? []).filter((x: any) => x.status === 'paid').reduce((s: number, x: any) => s + Number(x.amount), 0),
    failed: (p.data ?? []).filter((x: any) => x.status === 'failed').length,
    mix,
  };
}
