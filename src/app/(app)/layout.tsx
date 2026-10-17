import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { getProfile } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile.role} />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Topbar profile={profile} />
        {children}
      </main>
    </div>
  );
}
