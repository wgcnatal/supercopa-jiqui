'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Trophy, Shield, LogIn, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const publicLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/classificacao', label: 'Classificacao' },
  { href: '/jogos', label: 'Jogos' },
  { href: '/times', label: 'Times' },
  { href: '/sorteio', label: 'Sorteio' },
  { href: '/estatisticas', label: 'Estatisticas' },
];

const adminLinks = [
  { href: '/jogadores', label: 'Jogadores' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="bg-surface-dark/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Trophy className="w-7 h-7 text-gold" />
            <span className="text-lg font-bold text-white group-hover:text-gold transition-colors">
              SUPERCOPA JIQUI <span className="text-gold">2026</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[...publicLinks, ...(isLoggedIn ? adminLinks : [])].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/20 text-primary-light'
                    : 'text-gray-300 hover:text-white hover:bg-surface-light'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    pathname.startsWith('/admin')
                      ? 'bg-gold/20 text-gold'
                      : 'text-gold/70 hover:text-gold hover:bg-surface-light'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 text-gray-400 hover:text-red-400 hover:bg-surface-light"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 text-gray-400 hover:text-gold hover:bg-surface-light"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {[...publicLinks, ...(isLoggedIn ? adminLinks : [])].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/20 text-primary-light'
                    : 'text-gray-300 hover:text-white hover:bg-surface-light'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-gold/20 text-gold'
                      : 'text-gold/70 hover:text-gold hover:bg-surface-light'
                  }`}
                >
                  Admin
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    setMobileOpen(false);
                    window.location.href = '/';
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-surface-light transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-surface-light transition-colors"
              >
                Login Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
