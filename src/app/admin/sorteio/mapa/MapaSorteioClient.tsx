'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Player } from '@/lib/types';
import { POT_NAMES, POSITION_LABELS } from '@/lib/draft-config';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

const POSITIONS_ORDER: Position[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];

export default function MapaSorteioClient() {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('players')
        .select('*')
        .in('payment', ['PAGO', 'FREE'])
        .order('nickname');
      setPlayers(data || []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generatePDF() {
    setGenerating(true);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Title
    doc.setFillColor(6, 95, 70);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPERCOPA JIQUI 2026 — MAPA DO SORTEIO', pageW / 2, 12, { align: 'center' });

    let startY = 24;

    // === POTES ===
    const potPlayers = POT_NAMES.map(potName => ({
      name: potName,
      players: players.filter(p => p.pot === potName),
    })).filter(pot => pot.players.length > 0);

    if (potPlayers.length > 0) {
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('POTES', margin, startY);
      startY += 2;

      // Build pot columns side by side
      const maxPlayersInPot = Math.max(...potPlayers.map(p => p.players.length));
      const potHeaders = potPlayers.map(p => p.name);
      const potRows: string[][] = [];

      for (let i = 0; i < maxPlayersInPot; i++) {
        const row = potPlayers.map(pot => {
          const player = pot.players[i];
          if (!player) return '';
          const name = player.nickname || player.full_name;
          return `${name} (${player.position})`;
        });
        potRows.push(row);
      }

      autoTable(doc, {
        startY,
        head: [potHeaders],
        body: potRows,
        theme: 'grid',
        headStyles: {
          fillColor: [6, 95, 70],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          cellPadding: 1.5,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 1.2,
          halign: 'center',
          textColor: [30, 30, 30],
        },
        alternateRowStyles: { fillColor: [240, 245, 240] },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 6;
    }

    // === LISTA GERAL POR POSIÇÃO ===
    const potPlayerIds = new Set(players.filter(p => p.pot).map(p => p.id));
    const generalPlayers = players.filter(p => !potPlayerIds.has(p.id));

    const playersByPos: Record<Position, Player[]> = {
      GOL: [], ZAG: [], LAT: [], MEI: [], ATA: [],
    };
    generalPlayers.forEach(p => {
      const pos = p.position as Position;
      if (playersByPos[pos]) playersByPos[pos].push(p);
    });

    // Find max rows across all positions
    const maxRows = Math.max(...POSITIONS_ORDER.map(pos => playersByPos[pos].length));

    if (maxRows > 0) {
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('LISTA GERAL POR POSIÇÃO', margin, startY);
      startY += 2;

      const posHeaders = POSITIONS_ORDER.map(pos => `${POSITION_LABELS[pos]} (${playersByPos[pos].length})`);
      const posRows: string[][] = [];

      for (let i = 0; i < maxRows; i++) {
        const row = POSITIONS_ORDER.map(pos => {
          const player = playersByPos[pos][i];
          if (!player) return '';
          return player.nickname || player.full_name;
        });
        posRows.push(row);
      }

      autoTable(doc, {
        startY,
        head: [posHeaders],
        body: posRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 95],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          cellPadding: 1.5,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 1.2,
          halign: 'center',
          textColor: [30, 30, 30],
        },
        alternateRowStyles: { fillColor: [235, 240, 250] },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 4;
    }

    // === RODAPÉ COM RESUMO ===
    const totalPotes = players.filter(p => p.pot).length;
    const totalGeral = generalPlayers.length;
    const total = totalPotes + totalGeral;

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Total: ${total} jogadores aptos | Potes: ${totalPotes} | Lista Geral: ${totalGeral} | Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      pageW / 2,
      pageH - 5,
      { align: 'center' }
    );

    doc.save('mapa-sorteio-supercopa-jiqui-2026.pdf');
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  // Preview data
  const potPlayers = POT_NAMES.map(potName => ({
    name: potName,
    players: players.filter(p => p.pot === potName),
  })).filter(pot => pot.players.length > 0);

  const potPlayerIds = new Set(players.filter(p => p.pot).map(p => p.id));
  const generalPlayers = players.filter(p => !potPlayerIds.has(p.id));
  const playersByPos: Record<string, Player[]> = {
    GOL: [], ZAG: [], LAT: [], MEI: [], ATA: [],
  };
  generalPlayers.forEach(p => {
    if (playersByPos[p.position]) playersByPos[p.position].push(p);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mapa do Sorteio</h2>
          <p className="text-gray-400 text-sm mt-1">
            Visualize e gere o PDF com potes e lista geral para os representantes
          </p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {generating ? 'Gerando...' : 'Gerar PDF'}
        </button>
      </div>

      {/* Preview: Potes */}
      {potPlayers.length > 0 && (
        <div className="card p-4">
          <h3 className="text-lg font-bold text-white mb-3">Potes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {potPlayers.map(pot => (
              <div key={pot.name} className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <h4 className="text-sm font-bold text-primary-light mb-2">{pot.name}</h4>
                <div className="space-y-1">
                  {pot.players.map(p => (
                    <p key={p.id} className="text-xs text-gray-300">
                      {p.nickname || p.full_name} <span className="text-gray-500">({p.position})</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview: Lista Geral */}
      <div className="card p-4">
        <h3 className="text-lg font-bold text-white mb-3">Lista Geral por Posição</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {POSITIONS_ORDER.map(pos => {
            const posPlayers = playersByPos[pos] || [];
            if (posPlayers.length === 0) return null;
            return (
              <div key={pos} className="p-3 rounded-lg border border-gray-700 bg-surface-dark">
                <h4 className="text-sm font-bold text-gray-300 mb-2">
                  {POSITION_LABELS[pos]} ({posPlayers.length})
                </h4>
                <div className="space-y-1">
                  {posPlayers.map(p => (
                    <p key={p.id} className="text-xs text-gray-400">
                      {p.nickname || p.full_name}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{players.length}</p>
            <p className="text-xs text-gray-400">Total de jogadores aptos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-light">{players.filter(p => p.pot).length}</p>
            <p className="text-xs text-gray-400">Nos potes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gold">{generalPlayers.length}</p>
            <p className="text-xs text-gray-400">Lista geral</p>
          </div>
        </div>
      </div>
    </div>
  );
}
