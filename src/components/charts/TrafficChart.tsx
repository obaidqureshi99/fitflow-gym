'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function TrafficChart({ data }: { data: { label: string; visits: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a00" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#ff6a00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#353743" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" stroke="#8b8d9a" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8b8d9a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#2a2c36', border: '1px solid #353743', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="visits" stroke="#ff6a00" strokeWidth={2.5} fill="url(#g)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
