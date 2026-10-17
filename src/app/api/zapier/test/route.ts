import { NextResponse } from 'next/server';
import { sendZap } from '@/lib/zapier';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sampleEmail = url.searchParams.get('email') || 'alex.johnson@example.com';
  const samplePhone = url.searchParams.get('phone') || '+1234567890';
  const webhookConfigured = Boolean(process.env.ZAPIER_WEBHOOK_URL);

  const payload = {
    event: 'payment_remaining',
    member_name: 'Alex Johnson',
    name: 'Alex Johnson',
    email: sampleEmail,
    phone: samplePhone,
    member_code: 'GF-DEMO01',
    plan_name: 'Monthly Membership',
    plan_price: 30,
    amount_paid: 10,
    amount_remaining: 20,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    payment_status: 'partial',
    note: 'Sample test payment reminder',
    whatsapp_message: `Hello Alex Johnson, welcome to FitFlow! We received your partial payment of $10 for the Monthly Membership ($30). Your remaining balance is $20, due by next week. Please clear your balance at the desk or online. Thank you!`,
    email_subject: `Payment Reminder: Remaining Balance for Monthly Membership`,
    email_body: `Hi Alex Johnson,\n\nWelcome to FitFlow! Your registration for the Monthly Membership ($30) has been confirmed.\n\nYou have an outstanding payment of $20 due by next week.\n\nPlease clear your balance at the reception or through online payment.\n\nMember Code: GF-DEMO01\nThank you,\nFitFlow Team`,
  };

  const sent = await sendZap('payment_remaining', payload);

  return NextResponse.json({
    webhook_url_configured: webhookConfigured,
    sent_to_zapier: sent,
    webhook_url: process.env.ZAPIER_WEBHOOK_URL ? `${process.env.ZAPIER_WEBHOOK_URL.slice(0, 30)}...` : null,
    message: sent
      ? 'Test webhook successfully sent to Zapier! Check your Zapier editor to view the test data.'
      : webhookConfigured
        ? 'Failed to send to Zapier webhook URL. Please check the URL in .env.local.'
        : 'ZAPIER_WEBHOOK_URL is not set in .env.local. Please add your Zapier Catch Hook URL first.',
    test_payload: payload,
  });
}

export async function POST(req: Request) {
  return GET(req);
}

