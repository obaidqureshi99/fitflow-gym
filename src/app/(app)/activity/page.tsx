import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import PageHeader from '@/components/ui/PageHeader';
import { dateFmt, timeFmt } from '@/lib/format';

export default async function Activity() {
  await requireAdmin();
  const { data: log } = await createClient().from('activity_log').select('*').order('created_at', { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="Activity log" sub="The last 200 actions by staff." />
      <div className="card overflow-x-auto p-2">
        <table className="w-full"><thead><tr><th className="th">When</th><th className="th">Who</th><th className="th">Action</th><th className="th">Detail</th></tr></thead>
          <tbody>{(log ?? []).map((l: any) => (
            <tr key={l.id}><td className="td whitespace-nowrap text-muted">{dateFmt(l.created_at)}, {timeFmt(l.created_at)}</td><td className="td font-medium">{l.staff_name}</td><td className="td">{l.action}</td><td className="td text-muted">{l.detail}</td></tr>))}
            {(log ?? []).length === 0 && <tr><td colSpan={4} className="td text-center text-muted">No activity yet.</td></tr>}</tbody></table>
      </div>
    </>
  );
}
