import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { markPaid } from '@/actions/payments';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { dateFmt, money, today } from '@/lib/format';

export default async function Payments() {
  const { data: pays } = await createClient().from('payments').select('*, members(id, full_name), plans(name)').order('created_at', { ascending: false }).limit(100);
  const rows = (pays ?? []).map((p: any) => ({ ...p, shown: p.status === 'pending' && p.due_date < today() ? 'overdue' : p.status }));
  const flagged = rows.filter((p: any) => p.shown === 'overdue' || p.shown === 'failed');

  return (
    <>
      <PageHeader title="Payments" sub="Manual payment log. Paid payments extend the member’s renewal date automatically."><Link href="/payments/new" className="btn">Log payment</Link></PageHeader>
      {flagged.length > 0 && <p className="mb-4 rounded-lg bg-bad/15 px-4 py-3 text-sm text-bad">{flagged.length} payments are overdue or failed. Mark them paid once collected.</p>}
      <div className="card overflow-x-auto p-2">
        <table className="w-full">
          <thead><tr><th className="th">Member</th><th className="th">Plan</th><th className="th">Amount</th><th className="th">Method</th><th className="th">Due</th><th className="th">Status</th><th className="th" /></tr></thead>
          <tbody>
            {rows.map((p: any) => (
              <tr key={p.id}>
                <td className="td"><Link href={`/members/${p.members?.id}`} className="font-medium hover:text-brand">{p.members?.full_name}</Link></td>
                <td className="td">{p.plans?.name ?? '—'}</td><td className="td">{money(p.amount)}</td>
                <td className="td capitalize">{p.method.replace('_', ' ')}</td><td className="td text-muted">{dateFmt(p.due_date)}</td>
                <td className="td"><Badge value={p.shown} /></td>
                <td className="td text-right">{p.status !== 'paid' && <form action={markPaid}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost">Mark paid</button></form>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="td text-center text-muted">No payments logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
