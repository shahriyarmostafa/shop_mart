'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">Create your account</h1>
      <p className="text-ink-400 mb-6">Join ShopMart to start shopping and track your orders.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-card space-y-4">
        {error && <div className="bg-spice/10 text-spice text-sm rounded-lg px-4 py-2.5">{error}</div>}
        <div>
          <label className="text-sm text-ink-500 mb-1 block">Full Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>
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
            minLength={6}
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-400 mt-5">
        Already have an account?{' '}
        <Link href="/login" className="text-marigold-600 font-medium">
          Sign in
        </Link>
      </p>
    </main>
  );
}
