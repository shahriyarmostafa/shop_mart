'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  useEffect(() => setMounted(true), []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : '/');
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-ink text-white shadow-card">
      <div className="bg-ink-800 text-ink-100 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between">
          <span>Free delivery on orders over ৳1,500</span>
          <span className="hidden sm:inline">Cash on Delivery available nationwide</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="font-display text-2xl font-semibold tracking-tight whitespace-nowrap">
          Shop<span className="text-marigold-400">Mart</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 hidden md:flex">
          <div className="flex w-full rounded-full overflow-hidden bg-white">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search for products, brands and categories..."
              className="flex-1 px-4 py-2 text-ink text-sm focus:outline-none"
            />
            <button type="submit" className="bg-marigold-400 hover:bg-marigold-500 px-4 flex items-center justify-center transition-colors">
              <Search size={18} className="text-ink" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 ml-auto">
          {mounted && session?.user ? (
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-1.5 text-sm hover:text-marigold-300 transition-colors">
                <User size={20} />
                <span className="max-w-[100px] truncate">{session.user.name}</span>
              </button>
              <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block">
                <div className="bg-white text-ink rounded-lg shadow-lg overflow-hidden text-sm">
                  <Link href="/account/orders" className="flex items-center gap-2 px-4 py-2.5 hover:bg-paper transition-colors">
                    <LayoutDashboard size={16} /> My Orders
                  </Link>
                  {(session.user as any).role === 'ADMIN' && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 hover:bg-paper transition-colors">
                      <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-paper transition-colors text-left"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:flex items-center gap-1.5 text-sm hover:text-marigold-300 transition-colors">
              <User size={20} />
              <span>Sign in</span>
            </Link>
          )}

          <Link href="/cart" className="relative flex items-center hover:text-marigold-300 transition-colors">
            <ShoppingCart size={22} />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-spice text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-3 space-y-3">
          <form onSubmit={handleSearch} className="flex rounded-full overflow-hidden bg-white">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2 text-ink text-sm focus:outline-none"
            />
            <button type="submit" className="bg-marigold-400 px-4 flex items-center justify-center">
              <Search size={18} className="text-ink" />
            </button>
          </form>
          {mounted && session?.user ? (
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/account/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
              {(session.user as any).role === 'ADMIN' && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
              )}
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left">Sign out</button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm">Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}
