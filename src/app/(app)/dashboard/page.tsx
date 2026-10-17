import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { getAtRiskMembers, getMonthStats } from '@/lib/insights';
import { addDays, dateFmt, iso, money, today } from '@/lib/format';
import StatCard from '@/components/ui/StatCard';
import TrafficChart from '@/components/charts/TrafficChart';

export default async function Dashboard() {
  const supabase = createClient();
  const profile = await getProfile();
  const stats = await getMonthStats();
  const atRisk = await getAtRiskMembers();
  const weekAgo = addDays(new Date(), -6); weekAgo.setHours(0, 0, 0, 0);

  const [{ data: visits }, { data: expiring }, { data: bad }] = await Promise.all([
    supabase.from('attendance').select('checked_in_at').gte('checked_in_at', weekAgo.toISOString()),
    supabase.from('members').select('id, full_name, renewal_date').eq('status', 'active').eq('archived', false)
      .gte('renewal_date', today()).lte('renewal_date', iso(addDays(new Date(), 7))).order('renewal_date'),
    supabase.from('payments').select('id, amount, status, due_date, members(id, full_name)').neq('status', 'paid').order('due_date').limit(5),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekAgo, i));
  const traffic = days.map((d) => ({
    label: d.toLocaleDateString('en-US', { weekday: 'short' }),
    visits: (visits ?? []).filter((v: any) => v.checked_in_at.slice(0, 10) === iso(d)).length,
  }));
  const todayVisits = traffic[6].visits;
  const mix = Object.entries(stats.mix);

  return (
    <div className="space-y-6">
      <section className="card flex flex-col justify-between gap-6 p-8 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
          <p className="mt-1 font-semibold">Welcome back, {profile.full_name.split(' ')[0] || 'coach'}</p>
          <h1 className="mt-3 max-w-md text-3xl font-bold leading-tight">{atRisk.length ? `${atRisk.length} members are visiting less than usual.` : 'Everyone is showing up. Nice.'}</h1>
          <Link href={atRisk.length ? '/ai' : '/attendance'} className="btn mt-6">{atRisk.length ? 'Review at-risk members' : 'Open check-in'}</Link>
        </div>
        <div className="min-w-[240px] space-y-3">
          <p className="text-lg font-semibold">Plan mix</p>
          {mix.length === 0 && <p className="text-sm text-muted">No members yet.</p>}
          {mix.map(([name, n]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-muted">{n}</span></div>
              <div className="h-2 rounded-full bg-raise"><div className="h-2 rounded-full bg-brand" style={{ width: `${(n / Math.max(stats.total, 1)) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active members" value={stats.active} hint={`${stats.total} total, ${stats.expired} expired, ${stats.paused} paused`} tone="muted" />
        <StatCard label="New this month" value={stats.newThisMonth} hint="Joined since the 1st" />
        <StatCard label="Today's visitors" value={todayVisits} hint={`${stats.visits} check-ins this month`} />
        <StatCard label="Revenue this month" value={money(stats.revenue)} hint={stats.failed ? `${stats.failed} failed payments` : 'No failed payments'} tone={stats.failed ? 'bad' : 'good'} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <h2 className="card-title mb-4">Gym traffic, last 7 days</h2>
          <TrafficChart data={traffic} />
        </div>
        <div className="card">
          <h2 className="card-title mb-3">Renewing in 7 days</h2>
          {(expiring ?? []).length === 0 && <p className="text-sm text-muted">No renewals due this week.</p>}
          <ul className="space-y-2">
            {(expiring ?? []).map((m: any) => (
              <li key={m.id} className="flex justify-between text-sm"><Link href={`/members/${m.id}`} className="hover:text-brand">{m.full_name}</Link><span className="text-muted">{dateFmt(m.renewal_date)}</span></li>
            ))}
          </ul>
          <h2 className="card-title mb-3 mt-6">Pending and failed payments</h2>
          {(bad ?? []).length === 0 && <p className="text-sm text-muted">Nothing to chase.</p>}
          <ul className="space-y-2">
            {(bad ?? []).map((p: any) => (
              <li key={p.id} className="flex justify-between text-sm"><Link href={`/members/${p.members?.id}`} className="hover:text-brand">{p.members?.full_name}</Link><span className="text-bad">{money(p.amount)}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
