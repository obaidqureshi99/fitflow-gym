import Avatar from '@/components/ui/Avatar';
import type { Profile } from '@/lib/auth';

export default function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="mb-6 flex items-center justify-between rounded-xl bg-panel px-5 py-3">
      <form action="/members" className="w-full max-w-sm">
        <input name="q" placeholder="Find a member by name, email or code" className="w-full rounded-full border border-line bg-raise px-4 py-2 text-sm placeholder:text-muted focus:border-brand focus:outline-none" />
      </form>
      <div className="flex items-center gap-3">
        <Avatar name={profile.full_name || profile.email} size={40} />
        <div className="leading-tight">
          <p className="text-sm font-semibold">{profile.full_name || profile.email}</p>
          <p className="text-xs text-muted">{profile.role === 'admin' ? 'Admin' : 'Staff'}</p>
        </div>
      </div>
    </header>
  );
}
