'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { sendZap } from '@/lib/zapier';
import { addDays, iso } from '@/lib/format';

const s = (f: FormData, k: string) => (String(f.get(k) ?? '').trim() || null);

async function planDays(planId: string | null) {
  if (!planId) return 30;
  const { data } = await createClient().from('plans').select('duration_days').eq('id', planId).single();
  return data?.duration_days ?? 30;
}

export async function createMember(f: FormData) {
  const supabase = createClient();
  const planId = s(f, 'plan_id');
  const join = s(f, 'join_date') ?? iso(new Date());
  const renewal = iso(addDays(join, await planDays(planId)));
  const { data, error } = await supabase.from('members').insert({
    full_name: s(f, 'full_name'), email: s(f, 'email'), phone: s(f, 'phone'), photo_url: s(f, 'photo_url'),
    plan_id: planId, join_date: join, renewal_date: renewal, status: 'active',
  }).select('id, full_name, email, phone, code').single();
  if (error || !data) redirect('/members?msg=' + encodeURIComponent('Could not add member: ' + error?.message));
  await logActivity('added member', 'member', data.id, data.full_name);

  // Look up plan details
  let planName = 'Standard';
  let planPrice = 0;
  if (planId) {
    const { data: p } = await supabase.from('plans').select('name, price').eq('id', planId).single();
    if (p) {
      planName = p.name;
      planPrice = Number(p.price) || 0;
    }
  }

  const initialPayment = s(f, 'initial_payment') || 'paid';
  const paymentMethod = s(f, 'payment_method') || 'cash';
  const dueDate = s(f, 'payment_due_date') || iso(addDays(join, 7));
  const note = s(f, 'payment_note') || null;
  const rawAmountPaid = f.get('amount_paid');
  const amountPaid = rawAmountPaid !== null && rawAmountPaid !== '' ? Number(rawAmountPaid) : (initialPayment === 'paid' ? planPrice : 0);

  if (initialPayment === 'pending') {
    // Full membership fee is remaining / pending
    const remainingAmount = planPrice;
    await supabase.from('payments').insert({
      member_id: data.id,
      plan_id: planId,
      amount: remainingAmount,
      method: paymentMethod,
      status: 'pending',
      due_date: dueDate,
      note: note || 'Initial membership fee pending',
    });

    await sendZap('payment_remaining', {
      member_name: data.full_name,
      name: data.full_name,
      email: data.email,
      phone: data.phone,
      member_code: data.code,
      plan_name: planName,
      plan_price: planPrice,
      amount_paid: 0,
      amount_remaining: remainingAmount,
      due_date: dueDate,
      payment_status: 'pending',
      note: note || 'Payment remaining on registration',
      whatsapp_message: `Hello ${data.full_name}, welcome to FitFlow! Your registration for the ${planName} membership is complete. You have a remaining payment of $${remainingAmount} due on ${dueDate}. Please settle your balance at the desk or online. Thank you!`,
      email_subject: `Payment Reminder: Remaining Balance for ${planName} Membership`,
      email_body: `Hi ${data.full_name},\n\nWelcome to FitFlow! Your registration for the ${planName} plan ($${planPrice}) has been confirmed.\n\nYou have an outstanding payment of $${remainingAmount} due on ${dueDate}.\n\nPlease clear your balance at the reception or through online payment.\n\nMember Code: ${data.code}\nThank you,\nFitFlow Team`,
    });
  } else if (initialPayment === 'partial') {
    // Partial payment made, remaining balance pending
    const remainingAmount = Math.max(0, planPrice - amountPaid);
    if (amountPaid > 0) {
      await supabase.from('payments').insert({
        member_id: data.id,
        plan_id: planId,
        amount: amountPaid,
        method: paymentMethod,
        status: 'paid',
        due_date: join,
        paid_at: new Date().toISOString(),
        note: note ? `${note} (Partial upfront)` : 'Partial upfront payment',
      });
    }
    if (remainingAmount > 0) {
      await supabase.from('payments').insert({
        member_id: data.id,
        plan_id: planId,
        amount: remainingAmount,
        method: paymentMethod,
        status: 'pending',
        due_date: dueDate,
        note: note ? `${note} (Remaining balance)` : 'Remaining balance for membership',
      });

      await sendZap('payment_remaining', {
        member_name: data.full_name,
        name: data.full_name,
        email: data.email,
        phone: data.phone,
        member_code: data.code,
        plan_name: planName,
        plan_price: planPrice,
        amount_paid: amountPaid,
        amount_remaining: remainingAmount,
        due_date: dueDate,
        payment_status: 'partial',
        note: note || 'Partial payment received; remaining balance pending',
        whatsapp_message: `Hello ${data.full_name}, welcome to FitFlow! We received your initial payment of $${amountPaid} for the ${planName} membership. You have a remaining balance of $${remainingAmount} due on ${dueDate}. Thank you!`,
        email_subject: `Payment Receipt & Balance Reminder for ${planName} Membership`,
        email_body: `Hi ${data.full_name},\n\nWelcome to FitFlow! We have received your payment of $${amountPaid} towards the ${planName} membership ($${planPrice}).\n\nYour remaining balance is $${remainingAmount}, due on ${dueDate}.\n\nMember Code: ${data.code}\nThank you,\nFitFlow Team`,
      });
    } else {
      await sendZap('welcome', {
        name: data.full_name,
        email: data.email,
        phone: data.phone,
        member_code: data.code,
        renewal_date: renewal,
        plan_name: planName,
        amount_paid: amountPaid,
      });
    }
  } else if (initialPayment === 'paid') {
    // Paid in full
    if (planPrice > 0) {
      await supabase.from('payments').insert({
        member_id: data.id,
        plan_id: planId,
        amount: planPrice,
        method: paymentMethod,
        status: 'paid',
        due_date: join,
        paid_at: new Date().toISOString(),
        note: note || 'Paid in full at registration',
      });
    }
    await sendZap('welcome', {
      name: data.full_name,
      email: data.email,
      phone: data.phone,
      member_code: data.code,
      renewal_date: renewal,
      plan_name: planName,
      amount_paid: planPrice,
    });
  } else {
    // initialPayment === 'none'
    await sendZap('welcome', {
      name: data.full_name,
      email: data.email,
      phone: data.phone,
      member_code: data.code,
      renewal_date: renewal,
      plan_name: planName,
    });
  }

  revalidatePath('/members');
  revalidatePath('/payments');
  redirect('/members/' + data.id);
}

export async function updateMember(f: FormData) {
  const id = String(f.get('id'));
  const status = String(f.get('status'));
  await createClient().from('members').update({
    full_name: s(f, 'full_name'), email: s(f, 'email'), phone: s(f, 'phone'), photo_url: s(f, 'photo_url'),
    status, renewal_date: s(f, 'renewal_date'),
  }).eq('id', id);
  await logActivity('edited member', 'member', id, `${s(f, 'full_name')} (${status})`);
  revalidatePath('/members/' + id);
}

export async function changePlan(f: FormData) {
  const id = String(f.get('id'));
  const planId = String(f.get('plan_id'));
  const days = await planDays(planId);
  await createClient().from('members').update({ plan_id: planId, renewal_date: iso(addDays(new Date(), days)), status: 'active' }).eq('id', id);
  await logActivity('switched plan', 'member', id, `plan ${planId}`);
  revalidatePath('/members/' + id);
}

export async function setArchived(f: FormData) {
  const id = String(f.get('id'));
  const archived = f.get('archived') === 'true';
  await createClient().from('members').update({ archived }).eq('id', id);
  await logActivity(archived ? 'archived member' : 'restored member', 'member', id);
  revalidatePath('/members');
  if (archived) redirect('/members');
  revalidatePath('/members/' + id);
}

export async function addNote(f: FormData) {
  const id = String(f.get('id'));
  const body = s(f, 'body');
  if (!body) return;
  const p = await getProfile();
  await createClient().from('member_notes').insert({ member_id: id, staff_id: p.id, staff_name: p.full_name || p.email, body });
  await logActivity('added note', 'member', id, body.slice(0, 80));
  revalidatePath('/members/' + id);
}
