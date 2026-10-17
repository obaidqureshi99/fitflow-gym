const tone: Record<string, string> = {
  active: 'bg-good/15 text-good', paid: 'bg-good/15 text-good',
  expired: 'bg-bad/15 text-bad', failed: 'bg-bad/15 text-bad', overdue: 'bg-bad/15 text-bad', cancelled: 'bg-bad/15 text-bad',
  paused: 'bg-warn/15 text-warn', pending: 'bg-warn/15 text-warn',
  admin: 'bg-brand/15 text-brand', staff: 'bg-raise text-muted',
};
export default function Badge({ value }: { value: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone[value] ?? 'bg-raise text-muted'}`}>{value.replace('_', ' ')}</span>;
}
