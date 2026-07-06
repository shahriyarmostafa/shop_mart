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
