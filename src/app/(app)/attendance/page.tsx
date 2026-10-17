import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { checkIn } from '@/actions/attendance';
import PageHeader from '@/components/ui/PageHeader';
import TrafficChart from '@/components/charts/TrafficChart';
import { addDays, iso, timeFmt } from '@/lib/format';

export default async function Attendance({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const supabase = createClient();
  const start = addDays(new Date(), -6); start.setHours(0, 0, 0, 0);
  const { data: visits } = await supabase.from('attendance').select('id, checked_in_at, method, members(id, full_name)').gte('checked_in_at', start.toISOString()).order('checked_in_at', { ascending: false });
  const all = visits ?? [];
  const todayKey = iso(new Date());
  const todays = all.filter((v: any) => v.checked_in_at.slice(0, 10) === todayKey);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), visits: all.filter((v: any) => v.checked_in_at.slice(0, 10) === iso(d)).length };
  });
  const hours = Array.from({ length: 18 }, (_, i) => ({ label: `${i + 5}h`, visits: all.filter((v: any) => new Date(v.checked_in_at).getHours() === i + 5).length }));
  const peak = [...hours].sort((a, b) => b.visits - a.visits)[0];

  return (
    <>
      <PageHeader title="Attendance" sub={`${todays.length} check-ins today, ${all.length} this week`} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <form action={checkIn} className="card space-y-3">
            <h2 className="card-title">Check in</h2>
            {searchParams.ok && <p className="rounded-lg bg-good/15 px-3 py-2 text-sm text-good">{searchParams.ok}</p>}
            {searchParams.err && <p className="rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad">{searchParams.err}</p>}
            <label className="label" htmlFor="code">Member code or QR scan</label>
            <input id="code" name="code" required autoFocus placeholder="GF-A1B2C3" className="input uppercase" autoComplete="off" />
            <p className="text-xs text-muted">A USB or phone QR scanner types the code and presses Enter, so keep this field focused at the desk.</p>
            <button className="btn w-full">Check in</button>
          </form>
          <div className="card">
            <h2 className="card-title mb-3">Today</h2>
            <ul className="space-y-2 text-sm">
              {todays.map((v: any) => <li key={v.id} className="flex justify-between"><Link href={`/members/${v.members?.id}`} className="hover:text-brand">{v.members?.full_name}</Link><span className="text-muted">{timeFmt(v.checked_in_at)}</span></li>)}
              {todays.length === 0 && <li className="text-muted">No one has checked in yet.</li>}
            </ul>
          </div>
        </div>
        <div className="space-y-4 xl:col-span-2">
          <div className="card"><h2 className="card-title mb-4">Weekly traffic</h2><TrafficChart data={week} /></div>
          <div className="card"><h2 className="card-title mb-1">Busiest hours this week</h2>
            <p className="mb-4 text-sm text-muted">{peak?.visits ? `Peak is around ${peak.label} with ${peak.visits} check-ins.` : 'Not enough data yet.'}</p>
            <TrafficChart data={hours} /></div>
        </div>
      </div>
    </>
  );
}
