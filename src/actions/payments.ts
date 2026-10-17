'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { sendZap } from '@/lib/zapier';
import { addDays, iso } from '@/lib/format';

/** Extends renewal from the later of today / current renewal date, and reactivates the member. */
async function applyPaid(memberId: string, planId: string | null) {
  const supabase = createClient();
  const [{ data: m }, { data: p }] = await Promise.all([
    supabase.from('members').select('renewal_date').eq('id', memberId).single(),
    planId ? supabase.from('plans').select('duration_days').eq('id', planId).single() : Promise.resolve({ data: null }),
  ]);
  const base = m?.renewal_date && new Date(m.renewal_date) > new Date() ? new Date(m.renewal_date) : new Date();
  await supabase.from('members').update({ renewal_date: iso(addDays(base, p?.duration_days ?? 30)), status: 'active' }).eq('id', memberId);
}

export async function logPayment(f: FormData) {
  const supabase = createClient();
  const memberId = String(f.get('member_id'));
  const status = String(f.get('status'));
  const { data: member } = await supabase.from('members').select('full_name, email, phone, code, plan_id, plans(name, price)').eq('id', memberId).single();
  const planId = member?.plan_id ?? null;
  const amount = Number(f.get('amount'));
  const dueDate = String(f.get('due_date') || iso(new Date()));
  const note = String(f.get('note') ?? '') || null;

  const { data: pay } = await supabase.from('payments').insert({
    member_id: memberId, plan_id: planId, amount, method: String(f.get('method')), status,
    due_date: dueDate, paid_at: status === 'paid' ? new Date().toISOString() : null,
    note,
  }).select('id').single();

  if (status === 'paid') await applyPaid(memberId, planId);
  if (status === 'failed') await sendZap('payment_failed', { name: member?.full_name, email: member?.email, phone: member?.phone, member_code: member?.code, amount });
  if (status === 'pending') {
    const planName = (member as any)?.plans?.name || 'Membership';
    await sendZap('payment_remaining', {
      member_name: member?.full_name,
      name: member?.full_name,
      email: member?.email,
      phone: member?.phone,
      member_code: member?.code,
      plan_name: planName,
      amount_remaining: amount,
      due_date: dueDate,
      payment_status: 'pending',
      note,
      whatsapp_message: `Hello ${member?.full_name}, you have a pending payment of $${amount} for ${planName} at FitFlow due by ${dueDate}. Please clear your balance at the desk or online. Thank you!`,
      email_subject: `Payment Reminder: Pending Balance of $${amount}`,
      email_body: `Hi ${member?.full_name},\n\nThis is a friendly reminder that you have a pending payment of $${amount} due on ${dueDate}.\n\nPlease clear your balance at the gym reception or via online transfer.\n\nThank you,\nFitFlow Team`,
    });
  }
  await logActivity(`logged ${status} payment`, 'payment', pay?.id, `${member?.full_name} $${f.get('amount')}`);
  revalidatePath('/payments');
  revalidatePath('/members/' + memberId);
  redirect('/payments');
}

export async function markPaid(f: FormData) {
  const supabase = createClient();
  const id = String(f.get('id'));
  const { data: pay } = await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id).select('member_id, plan_id').single();
  if (pay) await applyPaid(pay.member_id, pay.plan_id);
  await logActivity('marked payment paid', 'payment', id);
  revalidatePath('/payments');
}
