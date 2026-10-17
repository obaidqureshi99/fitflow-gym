export const money = (n: number | string) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
export const dateFmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const timeFmt = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
export const addDays = (d: Date | string, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const today = () => iso(new Date());
