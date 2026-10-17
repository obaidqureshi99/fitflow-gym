import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askClaude } from '@/lib/claude';
import { getAtRiskMembers, getMonthStats } from '@/lib/insights';
import { logActivity } from '@/lib/activity';

const SYSTEM = 'You are the retention assistant for FitFlow, a friendly independent gym. Write plainly, warmly and specifically. No hype, no emojis.';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, memberId } = await req.json();

  if (type === 'email') {
    const { data: m } = await supabase.from('members').select('full_name, join_date, plans(name)').eq('id', memberId).single();
    const risk = (await getAtRiskMembers()).find((x) => x.id === memberId);
    const first = (m?.full_name ?? 'there').split(' ')[0];
    const prompt = `Write a short retention email (under 120 words, with a subject line) to ${m?.full_name}, on the ${(m as any)?.plans?.name ?? 'standard'} plan since ${m?.join_date}. Their visits dropped from ${risk?.previous ?? 'several'} to ${risk?.recent ?? 'few'} in the last two weeks. Be encouraging, ask if anything is in the way, offer a free session with a trainer. Sign off as "The FitFlow team".`;
    const text = (await askClaude(SYSTEM, prompt)) ??
      `Subject: We've missed you at FitFlow\n\nHi ${first},\n\nWe noticed we haven't seen you as often lately and wanted to check in. If something is getting in the way (schedule, goals, equipment), tell us and we'll help sort it.\n\nCome in this week and we'll book you a free session with one of our trainers.\n\nThe FitFlow team`;
    await logActivity('generated retention email', 'member', memberId, m?.full_name);
    return NextResponse.json({ text });
  }

  const stats = await getMonthStats();
  const risk = await getAtRiskMembers();
  const facts = JSON.stringify({ ...stats, atRiskCount: risk.length });

  if (type === 'report') {
    const text = (await askClaude(SYSTEM, `Write a monthly engagement summary for the gym owner (about 200 words: what happened, what worries you, 3 actions). Data: ${facts}`, 900)) ??
      `Monthly engagement summary\n\n${stats.active} of ${stats.total} members are active, ${stats.newThisMonth} joined this month, and the gym logged ${stats.visits} check-ins. Revenue collected: $${stats.revenue}. ${stats.failed} payments failed. ${risk.length} active members have cut their visits by half or more.\n\nActions: 1) Contact the at-risk members this week. 2) Chase failed payments. 3) Follow up with the ${stats.expired} expired members.\n\n(Add ANTHROPIC_API_KEY for a fuller written analysis.)`;
    await logActivity('generated monthly report', 'ai');
    return NextResponse.json({ text });
  }

  if (type === 'promos') {
    const text = (await askClaude(SYSTEM, `Suggest 3 promotions the gym could run next month, each with: the offer, who it targets, and the reason from the data. Data (mix = members per plan): ${facts}`, 700)) ??
      `1) "Bring-back week": 7 free days for expired members (${stats.expired} people).\n2) "Upgrade to quarterly": 10% off for monthly members to improve retention.\n3) "Buddy month": free month when an active member refers a friend.\n\n(Add ANTHROPIC_API_KEY for data-specific suggestions.)`;
    await logActivity('generated promo ideas', 'ai');
    return NextResponse.json({ text });
  }
  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
