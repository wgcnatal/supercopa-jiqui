import { Trophy } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface-dark border-t border-gray-700/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="text-sm text-gray-400">
              Supercopa Jiqui 2026
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
