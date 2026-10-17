export default function StatCard({ label, value, hint, tone = 'good' }: { label: string; value: string | number; hint?: string; tone?: 'good' | 'bad' | 'muted' }) {
  const c = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-muted';
  return (
    <div className="card">
      <p className="text-lg font-semibold">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight">{value}</p>
      {hint && <p className={`mt-3 text-sm ${c}`}>{hint}</p>}
    </div>
  );
}
