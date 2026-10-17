import { Zap } from 'lucide-react';
import { signIn } from '@/actions/auth';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form action={signIn} className="card w-full max-w-sm space-y-4 p-8">
        <div className="mb-2 flex items-center gap-2 text-3xl font-extrabold"><Zap className="text-brand" fill="#ff6a00" /> fitflow</div>
        <p className="text-sm text-muted">Sign in with your staff account.</p>
        {searchParams.error && <p className="rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad">{searchParams.error}</p>}
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required className="input" /></div>
        <button className="btn w-full">Sign in</button>
      </form>
    </div>
  );
}
