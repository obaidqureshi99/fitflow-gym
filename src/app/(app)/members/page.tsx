import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { dateFmt } from '@/lib/format';

export default async function Members({ searchParams }: { searchParams: { q?: string; status?: string; archived?: string; msg?: string } }) {
  const supabase = createClient();
  const archived = searchParams.archived === '1';
  let query = supabase.from('members').select('*, plans(name)').eq('archived', archived).order('created_at', { ascending: false });
  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.q) { const q = searchParams.q.replace(/[,()]/g, ' '); query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,code.ilike.%${q}%`); }
  const { data: members } = await query;
  const tabs = ['', 'active', 'expired', 'paused', 'cancelled'];

  return (
    <>
      <PageHeader title="Members" sub={archived ? 'Archived members' : `${members?.length ?? 0} members`}>
        <div className="flex gap-2">
          <Link href={archived ? '/members' : '/members?archived=1'} className="btn-ghost">{archived ? 'Show current' : 'Show archived'}</Link>
          <Link href="/members/new" className="btn">Add member</Link>
        </div>
      </PageHeader>
      {searchParams.msg && <p className="mb-4 rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad">{searchParams.msg}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t} href={`/members?status=${t}${searchParams.q ? '&q=' + searchParams.q : ''}`}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${(searchParams.status ?? '') === t ? 'bg-brand font-semibold' : 'bg-panel text-muted hover:text-white'}`}>{t || 'All'}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto p-2">
        <table className="w-full">
          <thead><tr><th className="th">Member</th><th className="th">Code</th><th className="th">Plan</th><th className="th">Status</th><th className="th">Joined</th><th className="th">Renews</th></tr></thead>
          <tbody>
            {(members ?? []).map((m: any) => (
              <tr key={m.id} className="hover:bg-raise/50">
                <td className="td"><Link href={`/members/${m.id}`} className="flex items-center gap-3 font-medium hover:text-brand"><Avatar name={m.full_name} src={m.photo_url} /><span>{m.full_name}<span className="block text-xs font-normal text-muted">{m.email ?? m.phone ?? ''}</span></span></Link></td>
                <td className="td text-muted">{m.code}</td>
                <td className="td">{m.plans?.name ?? '—'}</td>
                <td className="td"><Badge value={m.status} /></td>
                <td className="td text-muted">{dateFmt(m.join_date)}</td>
                <td className="td text-muted">{dateFmt(m.renewal_date)}</td>
              </tr>
            ))}
            {(members ?? []).length === 0 && <tr><td colSpan={6} className="td text-center text-muted">No members found. Add your first member to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
