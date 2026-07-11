'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Team } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

export function AdminTeamsClient({ teams }: { teams: Team[] }) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#065f46');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from('teams').insert({
      name,
      short_name: shortName || null,
      color,
    });

    if (!error) {
      setName('');
      setShortName('');
      setColor('#065f46');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(teamId: string) {
    if (!confirm('Tem certeza que deseja excluir este time?')) return;
    const supabase = createClient();
    await supabase.from('teams').delete().eq('id', teamId);
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Gerenciar Times</h2>

      {/* Create form */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-medium text-white mb-4">Criar novo time</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-300 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Nome do time"
              required
            />
          </div>
          <div className="w-40">
            <label className="block text-sm text-gray-300 mb-1">Abreviacao</label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="input-field"
              placeholder="Ex: TIM"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm text-gray-300 mb-1">Cor</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer bg-surface border border-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-gold flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Criando...' : 'Criar'}
          </button>
        </form>
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Nenhum time cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: team.color }}
                >
                  {(team.short_name || team.name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{team.name}</p>
                  {team.short_name && (
                    <p className="text-xs text-gray-400">{team.short_name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(team.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
