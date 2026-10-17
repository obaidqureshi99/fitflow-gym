import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { savePlan, togglePlan } from '@/actions/plans';
import PageHeader from '@/components/ui/PageHeader';
import { money } from '@/lib/format';

export default async function Plans() {
  const profile = await getProfile();
  const supabase = createClient();
  const [{ data: plans }, { data: members }] = await Promise.all([
    supabase.from('plans').select('*').order('price'),
    supabase.from('members').select('plan_id').eq('archived', false).eq('status', 'active'),
  ]);
  const count = (id: string) => (members ?? []).filter((m: any) => m.plan_id === id).length;
  const isAdmin = profile.role === 'admin';

  return (
    <>
      <PageHeader title="Membership plans" sub={isAdmin ? 'Create tiers and set prices. Switch a member’s plan from their profile.' : 'Only admins can change plans.'} />
      <div className="grid gap-4 md:grid-cols-3">
        {(plans ?? []).map((p: any) => (
          <div key={p.id} className={`card space-y-3 ${p.active ? '' : 'opacity-60'}`}>
            <p className="text-sm capitalize text-muted">{p.interval} · {p.duration_days} days</p>
            <p className="text-2xl font-bold">{p.name}</p>
            <p className="text-4xl font-bold text-brand">{money(p.price)}</p>
            <p className="text-sm text-muted">{count(p.id)} active members</p>
            {isAdmin && (
              <>
                <form action={savePlan} className="space-y-2 border-t border-line pt-3">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.name} className="input" aria-label="Plan name" />
                  <div className="flex gap-2">
                    <input name="price" type="number" step="0.01" min="0" defaultValue={p.price} className="input" aria-label="Price" />
                    <select name="interval" defaultValue={p.interval} className="input" aria-label="Billing interval"><option>monthly</option><option>quarterly</option><option>annual</option></select>
                  </div>
                  <button className="btn-ghost w-full">Save plan</button>
                </form>
                <form action={togglePlan}>
                  <input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={String(!p.active)} />
                  <button className="text-sm text-muted hover:text-white">{p.active ? 'Deactivate plan' : 'Reactivate plan'}</button>
                </form>
              </>
            )}
          </div>
        ))}
        {isAdmin && (
          <form action={savePlan} className="card space-y-3 border border-dashed border-line">
            <p className="text-lg font-semibold">New plan</p>
            <input name="name" required placeholder="Plan name" className="input" aria-label="Plan name" />
            <input name="price" type="number" step="0.01" min="0" required placeholder="Price" className="input" aria-label="Price" />
            <select name="interval" className="input" aria-label="Billing interval"><option>monthly</option><option>quarterly</option><option>annual</option></select>
            <button className="btn w-full">Create plan</button>
          </form>
        )}
      </div>
    </>
  );
}
