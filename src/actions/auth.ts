'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const { error } = await createClient().auth.signInWithPassword({
    email: String(formData.get('email')), password: String(formData.get('password')),
  });
  if (error) redirect('/login?error=' + encodeURIComponent('Wrong email or password.'));
  redirect('/dashboard');
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/login');
}
