'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';

/** `code` comes from typing the member code or from a QR scanner (scanners type the code + Enter). */
export async function checkIn(f: FormData) {
  const supabase = createClient();
  const code = String(f.get('code') ?? '').trim().toUpperCase();
  const method = String(f.get('method') || 'manual');
  const { data: m } = await supabase.from('members').select('id, full_name, status, archived').eq('code', code).maybeSingle();
  const go = (msg: string, ok = false) => redirect(`/attendance?${ok ? 'ok' : 'err'}=${encodeURIComponent(msg)}`);
  if (!m || m.archived) return go('No member found for that code.');
  if (m.status !== 'active') return go(`${m.full_name} is ${m.status}. Renew their plan before check-in.`);
  const since = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const { count } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('member_id', m.id).gte('checked_in_at', since);
  if (count) return go(`${m.full_name} already checked in within the last 2 hours.`);
  await supabase.from('attendance').insert({ member_id: m.id, method });
  await logActivity('checked in member', 'attendance', m.id, m.full_name);
  revalidatePath('/attendance');
  return go(`${m.full_name} checked in.`, true);
}
