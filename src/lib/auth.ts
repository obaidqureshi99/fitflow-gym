import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Profile = { id: string; full_name: string; email: string; role: 'admin' | 'staff' };

export async function getProfile(): Promise<Profile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (data ?? { id: user.id, full_name: user.email!, email: user.email!, role: 'staff' }) as Profile;
}

export async function requireAdmin(): Promise<Profile> {
  const p = await getProfile();
  if (p.role !== 'admin') redirect('/dashboard');
  return p;
}
