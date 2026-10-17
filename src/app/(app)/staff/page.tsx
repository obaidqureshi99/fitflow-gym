import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { createStaff, setRole } from '@/actions/staff';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { dateFmt } from '@/lib/format';

export default async function Staff({ searchParams }: { searchParams: { err?: string } }) {
  const me = await requireAdmin();
  const { data: team } = await createClient().from('profiles').select('*').order('created_at');
  return (
    <>
      <PageHeader title="Staff and access" sub="Admins manage plans, staff and the activity log. Staff handle members, payments and check-ins." />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card overflow-x-auto p-2 xl:col-span-2">
          <table className="w-full"><thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Added</th></tr></thead>
            <tbody>{(team ?? []).map((t: any) => (
              <tr key={t.id}><td className="td font-medium">{t.full_name}</td><td className="td text-muted">{t.email}</td>
                <td className="td">{t.id === me.id ? <Badge value={t.role} /> : (
                  <form action={setRole} className="flex gap-2"><input type="hidden" name="id" value={t.id} />
                    <select name="role" defaultValue={t.role} className="input w-28 py-1" aria-label="Role"><option>staff</option><option>admin</option></select><button className="btn-ghost py-1">Save</button></form>)}</td>
                <td className="td text-muted">{dateFmt(t.created_at)}</td></tr>))}</tbody></table>
        </div>
        <form action={createStaff} className="card space-y-3">
          <h2 className="card-title">Add staff account</h2>
          {searchParams.err && <p className="rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad">{searchParams.err}</p>}
          <input name="full_name" required placeholder="Full name" className="input" aria-label="Full name" />
          <input name="email" type="email" required placeholder="Email" className="input" aria-label="Email" />
          <input name="password" type="password" minLength={8} required placeholder="Temporary password (8+ characters)" className="input" aria-label="Password" />
          <select name="role" className="input" aria-label="Role"><option value="staff">Staff</option><option value="admin">Admin</option></select>
          <button className="btn w-full">Create account</button>
        </form>
      </div>
    </>
  );
}
