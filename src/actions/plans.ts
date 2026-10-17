'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const DAYS: Record<string, number> = { monthly: 30, quarterly: 90, annual: 365 };

export async function savePlan(f: FormData) {
  await requireAdmin();
  const id = String(f.get('id') ?? '');
  const interval = String(f.get('interval'));
  const row = { name: String(f.get('name')).trim(), interval, price: Number(f.get('price')), duration_days: DAYS[interval] ?? 30 };
  const supabase = createClient();
  if (id) await supabase.from('plans').update(row).eq('id', id);
  else await supabase.from('plans').insert(row);
  await logActivity(id ? 'edited plan' : 'created plan', 'plan', id || undefined, `${row.name} $${row.price}`);
  revalidatePath('/plans');
}

export async function togglePlan(f: FormData) {
  await requireAdmin();
  const id = String(f.get('id'));
  await createClient().from('plans').update({ active: f.get('active') === 'true' }).eq('id', id);
  await logActivity('toggled plan', 'plan', id);
  revalidatePath('/plans');
}
