'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CreditCard, LayoutDashboard, LogOut, Layers, ScrollText, Sparkles, Users, UserCog, Zap } from 'lucide-react';
import { signOut } from '@/actions/auth';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/plans', label: 'Plans', icon: Layers },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/ai', label: 'AI insights', icon: Sparkles },
  { href: '/staff', label: 'Staff', icon: UserCog, admin: true },
  { href: '/activity', label: 'Activity log', icon: ScrollText, admin: true },
];

export default function Sidebar({ role }: { role: 'admin' | 'staff' }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-panel">
      <div className="flex items-center gap-2 px-6 py-7 text-2xl font-extrabold">
        <Zap className="text-brand" fill="#ff6a00" size={26} /> fitflow
      </div>
      <nav className="flex-1 space-y-1">
        {links.filter((l) => !l.admin || role === 'admin').map(({ href, label, icon: Icon }) => {
          const on = path === href || path.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-6 py-3 text-[15px] transition ${on ? 'bg-brand font-semibold text-white' : 'text-muted hover:text-white'}`}>
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>
      <form action={signOut} className="p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted hover:text-white"><LogOut size={18} /> Log out</button>
      </form>
    </aside>
  );
}
