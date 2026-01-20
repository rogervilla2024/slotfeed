import dynamic from 'next/dynamic';

const LiveDashboard = dynamic(
  () => import('@/components/dashboard/live-dashboard').then(mod => mod.LiveDashboard),
  { ssr: false }
);

const BigWinTicker = dynamic(
  () => import('@/components/live/big-win-ticker').then(mod => mod.BigWinTicker),
  { ssr: false }
);

const LiveRTPWidget = dynamic(
  () => import('@/components/live/live-rtp-widget').then(mod => mod.LiveRTPWidget),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-4 md:py-6 space-y-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">LiveSlotData</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
          Real-time slot streaming analytics from Kick, Twitch & YouTube
        </p>
      </div>

      {/* Live Dashboard */}
      <LiveDashboard />

      {/* Recent Big Wins Ticker */}
      <section className="space-y-4">
        <BigWinTicker limit={10} autoScroll={true} scrollInterval={5000} />
      </section>

      {/* Live RTP Tracker */}
      <section className="space-y-4">
        <LiveRTPWidget limit={8} refreshInterval={30000} />
      </section>
    </div>
  );
}
