import { notFound } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/server';
import { addNote, changePlan, setArchived, updateMember } from '@/actions/members';
import { getAtRiskMembers } from '@/lib/insights';
import { dateFmt, money, timeFmt } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import AiButton from '@/components/ui/AiButton';
import Link from 'next/link';

export default async function MemberPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: m } = await supabase.from('members').select('*, plans(name, price)').eq('id', params.id).single();
  if (!m) notFound();
  const [{ data: plans }, { data: notes }, { data: pays }, { data: visits }, risk] = await Promise.all([
    supabase.from('plans').select('id, name, price').eq('active', true).order('price'),
    supabase.from('member_notes').select('*').eq('member_id', m.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('member_id', m.id).order('created_at', { ascending: false }),
    supabase.from('attendance').select('*').eq('member_id', m.id).order('checked_in_at', { ascending: false }).limit(30),
    getAtRiskMembers(),
  ]);
  const atRisk = risk.find((r) => r.id === m.id);

  return (
    <>
      <PageHeader title={m.full_name} sub={`Member code ${m.code}${m.archived ? ' (archived)' : ''}`}>
        <form action={setArchived}>
          <input type="hidden" name="id" value={m.id} /><input type="hidden" name="archived" value={String(!m.archived)} />
          <button className="btn-ghost">{m.archived ? 'Restore member' : 'Archive member'}</button>
        </form>
      </PageHeader>

      {atRisk && <p className="mb-4 rounded-lg bg-warn/15 px-4 py-3 text-sm text-warn">At risk: visits fell from {atRisk.previous} to {atRisk.recent} in the last two weeks.</p>}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <form action={updateMember} className="card grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={m.id} />
            <div className="flex items-center gap-4 sm:col-span-2"><Avatar name={m.full_name} src={m.photo_url} size={64} /><div><Badge value={m.status} /><p className="mt-1 text-sm text-muted">Joined {dateFmt(m.join_date)}</p></div></div>
            <div><label className="label" htmlFor="full_name">Full name</label><input id="full_name" name="full_name" defaultValue={m.full_name} required className="input" /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" defaultValue={m.email ?? ''} className="input" /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={m.phone ?? ''} className="input" /></div>
            <div><label className="label" htmlFor="photo_url">Photo URL</label><input id="photo_url" name="photo_url" defaultValue={m.photo_url ?? ''} className="input" /></div>
            <div><label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={m.status} className="input">{['active', 'expired', 'paused', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="label" htmlFor="renewal_date">Renewal date</label><input id="renewal_date" name="renewal_date" type="date" defaultValue={m.renewal_date ?? ''} className="input" /></div>
            <div className="sm:col-span-2"><button className="btn">Save changes</button></div>
          </form>

          <div className="card">
            <h2 className="card-title mb-3">Payment history</h2>
            <table className="w-full"><thead><tr><th className="th">Date</th><th className="th">Amount</th><th className="th">Method</th><th className="th">Status</th></tr></thead>
              <tbody>
                {(pays ?? []).map((p: any) => <tr key={p.id}><td className="td">{dateFmt(p.created_at)}</td><td className="td">{money(p.amount)}</td><td className="td capitalize">{p.method.replace('_', ' ')}</td><td className="td"><Badge value={p.status} /></td></tr>)}
                {(pays ?? []).length === 0 && <tr><td colSpan={4} className="td text-muted">No payments yet. <Link href="/payments/new" className="text-brand">Log one</Link>.</td></tr>}
              </tbody></table>
          </div>

          <div className="card">
            <h2 className="card-title mb-3">Attendance history</h2>
            <div className="flex flex-wrap gap-2">
              {(visits ?? []).map((v: any) => <span key={v.id} className="rounded-lg bg-raise px-3 py-1.5 text-xs">{dateFmt(v.checked_in_at)}, {timeFmt(v.checked_in_at)}</span>)}
              {(visits ?? []).length === 0 && <p className="text-sm text-muted">No check-ins yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card flex flex-col items-center gap-3 text-center">
            <div className="rounded-lg bg-white p-3"><QRCodeSVG value={m.code} size={140} /></div>
            <p className="text-sm text-muted">Scan at the front desk to check in.</p>
          </div>
          <form action={changePlan} className="card space-y-3">
            <h2 className="card-title">Plan</h2>
            <p className="text-sm text-muted">Current: {m.plans?.name ?? 'None'} {m.plans && `(${money(m.plans.price)})`}</p>
            <input type="hidden" name="id" value={m.id} />
            <select name="plan_id" defaultValue={m.plan_id ?? ''} className="input" aria-label="Plan">{(plans ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name} ({money(p.price)})</option>)}</select>
            <button className="btn-ghost w-full">Switch plan</button>
          </form>
          <div className="card space-y-3">
            <h2 className="card-title">Notes</h2>
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="id" value={m.id} />
              <textarea name="body" rows={3} required placeholder="Log a call, a complaint, a goal…" className="input" />
              <button className="btn-ghost w-full">Add note</button>
            </form>
            <ul className="space-y-3">
              {(notes ?? []).map((n: any) => <li key={n.id} className="rounded-lg bg-raise p-3 text-sm"><p>{n.body}</p><p className="mt-1 text-xs text-muted">{n.staff_name}, {dateFmt(n.created_at)}</p></li>)}
            </ul>
          </div>
          <div className="card space-y-3">
            <h2 className="card-title">Retention email</h2>
            <AiButton type="email" memberId={m.id} label="Draft with Claude" />
          </div>
        </div>
      </div>
    </>
  );
}
