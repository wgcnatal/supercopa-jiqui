import { createClient } from '@/lib/supabase/server';
import { Gamepad2, Users, UserCircle, Trophy } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Admin - Supercopa Jiqui 2026',
};

export default async function AdminDashboard() {
  const supabase = createClient();

  const [
    { count: teamsCount },
    { count: playersCount },
    { count: matchesCount },
    { count: finishedCount },
  ] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finished'),
  ]);

  const cards = [
    {
      title: 'Jogos',
      count: matchesCount || 0,
      subtitle: `${finishedCount || 0} encerrados`,
      icon: Gamepad2,
      href: '/admin/jogos',
      color: 'text-primary-light',
    },
    {
      title: 'Times',
      count: teamsCount || 0,
      subtitle: 'cadastrados',
      icon: Users,
      href: '/admin/times',
      color: 'text-gold',
    },
    {
      title: 'Jogadores',
      count: playersCount || 0,
      subtitle: 'registrados',
      icon: UserCircle,
      href: '/admin/jogadores',
      color: 'text-blue-400',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <Trophy className="w-5 h-5 text-gray-700" />
            </div>
            <p className="text-3xl font-bold text-white">{card.count}</p>
            <p className="text-sm text-gray-400">
              {card.title} - {card.subtitle}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
