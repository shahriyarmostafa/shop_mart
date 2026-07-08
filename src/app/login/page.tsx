'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { ...form, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">Welcome back</h1>
      <p className="text-ink-400 mb-6">Sign in to continue shopping.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-card space-y-4">
        {error && <div className="bg-spice/10 text-spice text-sm rounded-lg px-4 py-2.5">{error}</div>}
        <div>
          <label className="text-sm text-ink-500 mb-1 block">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>
        <div>
          <label className="text-sm text-ink-500 mb-1 block">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-marigold-400 hover:bg-marigold-500 disabled:opacity-60 text-ink font-semibold py-3 rounded-full transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs uppercase tracking-wide text-ink-400">Or</span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <button
        type="button"
        onClick={() => signIn('google')}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-ink-50 border border-ink-100 text-ink font-semibold py-3 rounded-full transition-colors shadow-sm"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.68 9c0-.593.102-1.17.284-1.706V4.962H.96A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.96 4.038l3.004-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .96 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-ink-400 mt-5">
        New here?{' '}
        <Link href="/register" className="text-marigold-600 font-medium">
          Create an account
        </Link>
      </p>

      <div className="mt-8 bg-ink-50 rounded-lg p-4 text-xs text-ink-400">
        <p className="font-medium text-ink-500 mb-1">Demo accounts</p>
        <p>Admin: admin@shopmart.test / admin123</p>
        <p>Customer: demo@shopmart.test / demo1234</p>
      </div>
    </main>
  );
}
