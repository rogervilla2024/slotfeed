import { Leaderboards } from '@/components/leaderboard';

export default function LeaderboardsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-muted-foreground mt-2">
          Top performers across all categories
        </p>
      </div>

      <Leaderboards />
    </main>
  );
}
