'use client';
import { useState } from 'react';
import { createMember } from '@/actions/members';
import { today, addDays, iso } from '@/lib/format';
import { MessageSquare, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function NewMemberForm({ plans }: { plans: Plan[] }) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial' | 'none'>('paid');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [joinDate, setJoinDate] = useState<string>(today());

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const planPrice = Number(selectedPlan?.price || 0);

  const defaultDueDate = iso(addDays(joinDate || new Date(), 7));
  const remainingBalance = paymentStatus === 'pending'
    ? planPrice
    : paymentStatus === 'partial'
      ? Math.max(0, planPrice - (Number(amountPaid) || 0))
      : 0;

  return (
    <form action={createMember} className="card max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="full_name">Full name *</label>
          <input id="full_name" name="full_name" required placeholder="e.g. John Doe" className="input" />
        </div>

        <div>
          <label className="label" htmlFor="email">Email address</label>
          <div className="relative">
            <input id="email" name="email" type="email" placeholder="john@example.com" className="input pr-8" />
            <Mail size={16} className="absolute right-3 top-2.5 text-muted pointer-events-none" />
          </div>
          <span className="mt-1 block text-[11px] text-muted">Used for email reminders via Zapier</span>
        </div>

        <div>
          <label className="label" htmlFor="phone">Phone / WhatsApp</label>
          <div className="relative">
            <input id="phone" name="phone" placeholder="+1234567890" className="input pr-8" />
            <MessageSquare size={16} className="absolute right-3 top-2.5 text-muted pointer-events-none" />
          </div>
          <span className="mt-1 block text-[11px] text-muted">Include country code (e.g. +1, +44, +92) for WhatsApp</span>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="photo_url">Photo URL (optional)</label>
          <input id="photo_url" name="photo_url" type="url" placeholder="https://..." className="input" />
        </div>

        <div>
          <label className="label" htmlFor="plan_id">Membership plan</label>
          <select
            id="plan_id"
            name="plan_id"
            required
            className="input"
            value={selectedPlanId}
            onChange={(e) => {
              setSelectedPlanId(e.target.value);
            }}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${Number(p.price).toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="join_date">Join date</label>
          <input
            id="join_date"
            name="join_date"
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Payment details */}
      <div className="rounded-xl border border-line bg-raise/40 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Initial Payment & Balance
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Set whether this new member has any remaining balance to pay.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className={`flex cursor-pointer flex-col rounded-lg border p-3 text-xs transition ${paymentStatus === 'paid' ? 'border-brand bg-brand/10 text-white' : 'border-line bg-panel text-muted hover:text-white'}`}>
            <input
              type="radio"
              name="initial_payment"
              value="paid"
              checked={paymentStatus === 'paid'}
              onChange={() => setPaymentStatus('paid')}
              className="sr-only"
            />
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              <CheckCircle size={15} className={paymentStatus === 'paid' ? 'text-brand' : 'text-muted'} /> Paid in Full
            </div>
            <span className="mt-1 text-[11px] text-muted">Received ${planPrice.toFixed(2)}</span>
          </label>

          <label className={`flex cursor-pointer flex-col rounded-lg border p-3 text-xs transition ${paymentStatus === 'partial' ? 'border-warn bg-warn/10 text-white' : 'border-line bg-panel text-muted hover:text-white'}`}>
            <input
              type="radio"
              name="initial_payment"
              value="partial"
              checked={paymentStatus === 'partial'}
              onChange={() => setPaymentStatus('partial')}
              className="sr-only"
            />
            <div className="flex items-center gap-1.5 font-semibold text-sm text-warn">
              <AlertCircle size={15} /> Partial Payment
            </div>
            <span className="mt-1 text-[11px] text-muted">Part paid, balance due</span>
          </label>

          <label className={`flex cursor-pointer flex-col rounded-lg border p-3 text-xs transition ${paymentStatus === 'pending' ? 'border-bad bg-bad/10 text-white' : 'border-line bg-panel text-muted hover:text-white'}`}>
            <input
              type="radio"
              name="initial_payment"
              value="pending"
              checked={paymentStatus === 'pending'}
              onChange={() => setPaymentStatus('pending')}
              className="sr-only"
            />
            <div className="flex items-center gap-1.5 font-semibold text-sm text-bad">
              <AlertCircle size={15} /> Payment Pending
            </div>
            <span className="mt-1 text-[11px] text-muted">Full ${planPrice.toFixed(2)} due</span>
          </label>
        </div>

        {paymentStatus !== 'none' && (
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line/60">
            {paymentStatus === 'partial' && (
              <div>
                <label className="label" htmlFor="amount_paid">Amount paid upfront ($)</label>
                <input
                  id="amount_paid"
                  name="amount_paid"
                  type="number"
                  step="0.01"
                  min="0"
                  max={planPrice}
                  placeholder="0.00"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="input"
                  required
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="payment_method">Payment method</label>
              <select id="payment_method" name="payment_method" className="input">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {(paymentStatus === 'pending' || paymentStatus === 'partial') && (
              <div>
                <label className="label" htmlFor="payment_due_date">Remaining balance due date</label>
                <input
                  id="payment_due_date"
                  name="payment_due_date"
                  type="date"
                  defaultValue={defaultDueDate}
                  className="input"
                  required
                />
              </div>
            )}

            <div className={paymentStatus === 'paid' ? 'sm:col-span-2' : ''}>
              <label className="label" htmlFor="payment_note">Note (optional)</label>
              <input id="payment_note" name="payment_note" placeholder="e.g. Deposit paid at desk" className="input" />
            </div>
          </div>
        )}

        {/* Zapier notice */}
        {(paymentStatus === 'pending' || paymentStatus === 'partial') && (
          <div className="flex items-start gap-2.5 rounded-lg bg-brand/10 border border-brand/30 p-3 text-xs text-brand">
            <MessageSquare size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Automated Notification via Zapier:</strong>
              <p className="text-white/80 mt-0.5">
                Remaining balance of <strong>${remainingBalance.toFixed(2)}</strong> will trigger the Zapier webhook (`payment_remaining`). Zapier will automatically send an email and WhatsApp message to the member.
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <button type="submit" className="btn w-full sm:w-auto">
          Save member & trigger automation
        </button>
      </div>
    </form>
  );
}

