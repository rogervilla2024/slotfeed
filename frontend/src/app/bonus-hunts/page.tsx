import { BonusHuntList } from '@/components/bonus-hunt';

export const metadata = {
  title: 'Bonus Hunts | SLOTFEED',
  description: 'Track live bonus hunts from top slot streamers',
};

export default function BonusHuntsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bonus Hunts</h1>
          <p className="text-slate-400">
            Track live bonus hunts from your favorite streamers. See collected bonuses, opening progress, and final results.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase">Active Hunts</p>
            <p className="text-2xl font-bold text-white">3</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase">Total Today</p>
            <p className="text-2xl font-bold text-white">8</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase">Avg ROI Today</p>
            <p className="text-2xl font-bold text-green-400">+24.5%</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase">Best Hunt</p>
            <p className="text-2xl font-bold text-yellow-400">+312%</p>
          </div>
        </div>

        {/* Bonus Hunt List */}
        <BonusHuntList />
      </div>
    </div>
  );
}
