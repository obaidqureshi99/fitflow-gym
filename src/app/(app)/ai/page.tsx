import Link from 'next/link';
import { getAtRiskMembers } from '@/lib/insights';
import PageHeader from '@/components/ui/PageHeader';
import AiButton from '@/components/ui/AiButton';
import { dateFmt } from '@/lib/format';

export default async function AiInsights() {
  const atRisk = await getAtRiskMembers();
  return (
    <>
      <PageHeader title="AI insights" sub="Claude drafts. You review before anything is sent." />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card xl:col-span-2">
          <h2 className="card-title">At-risk members</h2>
          <p className="mb-3 text-sm text-muted">Active members whose visits in the last 14 days fell by half or more compared with the 14 days before.</p>
          <table className="w-full">
            <thead><tr><th className="th">Member</th><th className="th">Before</th><th className="th">Now</th><th className="th">Drop</th><th className="th">Last visit</th><th className="th" /></tr></thead>
            <tbody>
              {atRisk.map((m) => (
                <tr key={m.id}><td className="td font-medium">{m.full_name}</td><td className="td">{m.previous}</td><td className="td">{m.recent}</td><td className="td text-bad">-{m.drop}%</td><td className="td text-muted">{dateFmt(m.lastVisit)}</td>
                  <td className="td text-right"><Link href={`/members/${m.id}`} className="btn-ghost">Draft email</Link></td></tr>
              ))}
              {atRisk.length === 0 && <tr><td colSpan={6} className="td text-muted">No at-risk members right now.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card space-y-3"><h2 className="card-title">Monthly engagement report</h2><AiButton type="report" label="Write this month’s report" /></div>
        <div className="card space-y-3"><h2 className="card-title">Promotion ideas</h2><AiButton type="promos" label="Suggest promotions" /></div>
      </div>
    </>
  );
}
