import { createClient } from '@/lib/supabase/server';
import { logPayment } from '@/actions/payments';
import PageHeader from '@/components/ui/PageHeader';
import { today } from '@/lib/format';

export default async function NewPayment() {
  const { data: members } = await createClient().from('members').select('id, full_name, code, plans(price)').eq('archived', false).order('full_name');
  return (
    <>
      <PageHeader title="Log payment" sub="Choose “failed” to send the member a payment-failure email." />
      <form action={logPayment} className="card grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="member_id">Member</label>
          <select id="member_id" name="member_id" required className="input">{(members ?? []).map((m: any) => <option key={m.id} value={m.id}>{m.full_name} ({m.code})</option>)}</select></div>
        <div><label className="label" htmlFor="amount">Amount</label><input id="amount" name="amount" type="number" step="0.01" min="0" required className="input" /></div>
        <div><label className="label" htmlFor="method">Method</label>
          <select id="method" name="method" className="input"><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></div>
        <div><label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" className="input"><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option></select></div>
        <div><label className="label" htmlFor="due_date">Due date</label><input id="due_date" name="due_date" type="date" defaultValue={today()} className="input" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="note">Note</label><input id="note" name="note" className="input" /></div>
        <div className="sm:col-span-2"><button className="btn">Save payment</button></div>
      </form>
    </>
  );
}
