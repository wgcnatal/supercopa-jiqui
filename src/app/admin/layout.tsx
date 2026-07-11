import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Gamepad2, Users, UserCircle, LogOut, Shuffle } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="btn-outline text-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </form>
      </div>

      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white hover:bg-surface transition-colors text-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/admin/jogos"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white hover:bg-surface transition-colors text-sm"
        >
          <Gamepad2 className="w-4 h-4" />
          Jogos
        </Link>
        <Link
          href="/admin/times"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white hover:bg-surface transition-colors text-sm"
        >
          <Users className="w-4 h-4" />
          Times
        </Link>
        <Link
          href="/admin/jogadores"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white hover:bg-surface transition-colors text-sm"
        >
          <UserCircle className="w-4 h-4" />
          Jogadores
        </Link>
        <Link
          href="/admin/sorteio"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white hover:bg-surface transition-colors text-sm"
        >
          <Shuffle className="w-4 h-4" />
          Sorteio
        </Link>
      </nav>

      {children}
    </div>
  );
}
