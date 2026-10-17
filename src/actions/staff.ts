'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';

export async function createStaff(f: FormData) {
  await requireAdmin();
  const email = String(f.get('email')).trim();
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email, password: String(f.get('password')), email_confirm: true, user_metadata: { full_name: String(f.get('full_name')).trim() },
  });
  if (error) redirect('/staff?err=' + encodeURIComponent(error.message));
  if (f.get('role') === 'admin' && data.user) await createAdminClient().from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
  await logActivity('created staff account', 'staff', data.user?.id, email);
  revalidatePath('/staff');
}

export async function setRole(f: FormData) {
  const me = await requireAdmin();
  const id = String(f.get('id'));
  if (id === me.id) return; // never demote yourself
  await createClient().from('profiles').update({ role: String(f.get('role')) }).eq('id', id);
  await logActivity('changed role', 'staff', id, String(f.get('role')));
  revalidatePath('/staff');
}
