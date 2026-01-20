'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, BookOpen, Percent, Zap, Brain, Shield, TrendingUp } from 'lucide-react';
import {
  FAQStructuredData,
  generateRTPFAQs,
  BankrollManagementHowTo,
  ReadingStatsHowTo,
  UnderstandingVolatilityHowTo,
  UsingLiveSlotDataHowTo,
  WebPageStructuredData,
} from '@/components/seo';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  content: string;
  readTime: string;
}

export default function GuidesPage() {
  const [expandedGuide, setExpandedGuide] = useState<string | null>('what-is-rtp');

  const guides: GuideSection[] = [
    {
      id: 'what-is-rtp',
      title: 'What is RTP? Understanding Return to Player',
      icon: <Percent className="h-5 w-5" />,
      summary: 'Learn how RTP works, why it matters, and how it affects your gameplay',
      readTime: '8 min read',
      content: `Return to Player (RTP) is a theoretical percentage that indicates how much of all wagered money a slot machine will pay back to players over a very long period of time, usually expressed as a percentage.

## Key Points About RTP:

**Definition**: RTP is the percentage of all wagered money that a slot game will theoretically return to players over the long term. For example, a slot with 96.5% RTP means that for every $100 wagered, the game returns approximately $96.50 to players (and keeps $3.50 as house edge).

**Important Context**: RTP is calculated over millions of spins - it doesn't guarantee individual results. In the short term (like a single session), results can vary dramatically from the theoretical RTP.

**Jurisdictional Variations**: RTP percentages can vary by region. Some jurisdictions require minimum RTP levels:
- European slots: Often 94-98% RTP
- North American slots: Often 85-95% RTP
- Online slots: Typically 95-99% RTP

**RTP vs House Edge**:
- RTP = percentage returned to players
- House Edge = 100% - RTP = what the casino keeps

**Why Higher RTP is Better**: A game with 97% RTP is theoretically "better" for players than one with 94% RTP, as it returns more money over time.

**RTP Doesn't Guarantee Wins**: High RTP doesn't mean you'll win - it just means the mathematical advantage is smaller over the long run.

**Variance Matters Too**: Two games with identical RTP can behave very differently. One might be volatile (big wins but long dry spells), while another is steady (frequent smaller wins). Your bankroll tolerance should match the game's volatility.`,
    },
    {
      id: 'volatility-explained',
      title: 'Volatility & Risk: Playing Within Your Bankroll',
      icon: <Zap className="h-5 w-5" />,
      summary: 'Master volatility levels and choose games that match your bankroll strategy',
      readTime: '7 min read',
      content: `Volatility (also called "variance") describes how much a slot game's payouts fluctuate. Understanding volatility is crucial for bankroll management.

## Volatility Levels:

**Low Volatility (Low Risk)**
- Frequent small wins
- Smaller individual payouts
- Steady, predictable gameplay
- Better for: Small budgets, long play sessions, risk-averse players
- Example: Sweet Bonanza tends toward lower volatility
- House edge feels softer due to regular wins

**Medium Volatility (Moderate Risk)**
- Balanced wins and losses
- Mix of small and medium payouts
- Moderate session length requirement
- Better for: Average bankroll, balanced play style
- Most popular games fall here

**High Volatility (High Risk)**
- Rare big wins, long losing streaks
- Large individual payouts when they hit
- Requires substantial bankroll
- Better for: Large budgets, short play sessions, risk-tolerant players
- Example: Gates of Olympus is high volatility with massive potential wins
- Can deplete your bankroll quickly if unlucky

**Very High Volatility (Extreme Risk)**
- Extreme swings between wins and losses
- Potential for massive multipliers (1000x+)
- Very long dry spells
- Better for: Experienced players with large bankrolls
- Requires strong emotional control

## Matching Volatility to Your Bankroll:

**$100 Budget**: Low-medium volatility (Sweet Bonanza, Fruit Party)
**$500 Budget**: Medium-high volatility (Gates of Olympus, Big Bass Bonanza)
**$1000+ Budget**: High-very high volatility (Wanted Dead or a Wild, high-risk games)

## The Volatility-RTP Relationship:

Two games might have the same 96.5% RTP, but:
- Low volatility game: Steady payback, predictable experience
- High volatility game: Thrilling but potentially frustrating losses

Higher RTP can sometimes compensate for higher volatility.`,
    },
    {
      id: 'bankroll-management',
      title: 'Bankroll Management: The Foundation of Smart Play',
      icon: <Shield className="h-5 w-5" />,
      summary: 'Proven strategies to protect your money and play responsibly',
      readTime: '10 min read',
      content: `Smart bankroll management is the difference between sustainable play and losing everything quickly.

## The Golden Rules:

**1. Set a Budget**
- Decide how much you can afford to lose (not need, but can afford to lose)
- This is your total session/monthly bankroll
- Treat it like any other entertainment expense
- Never borrow money to gamble

**2. The 1% Rule**
- Each bet should be 1-2% of your total bankroll
- Example: $500 bankroll → $5-10 bets
- This lets you survive variance and keep playing longer
- Protects you from catastrophic loss on a single bad streak

**3. Session Limits**
- Set time limits (e.g., 1-2 hours per session)
- Set loss limits (stop when you lose 25-50% of session budget)
- Set win limits (cash out 50% of winnings, keep playing with the rest)
- Never chase losses - accept and move on

**4. Volatility Matching**
- Low volatility: Can use higher bet percentage since wins are frequent
- High volatility: Lower bet percentage needed due to long losing streaks
- Match your bet size to game volatility AND bankroll

**5. The Kelly Criterion (Advanced)**
- Mathematical formula for optimal bet sizing
- Bet size = (Edge × Probability) / Odds
- Too aggressive and you bust, too conservative and you miss opportunities
- Most players use simplified version: 1-2% is safe

## Common Bankroll Mistakes:

❌ **Increasing bets after losses** - "Due for a win" is a myth
❌ **Ignoring volatility** - Playing high-vol games with small bankroll
❌ **No session limits** - Playing until broke instead of setting limits upfront
❌ **Chasing losses** - Adding more money to recover from losses
❌ **Emotional decisions** - Betting more when frustrated or excited

## Bankroll Growth Strategy:

If you're consistently profitable:
1. Keep your base bet size the same
2. Reinvest profits into your bankroll
3. Once bankroll grows 50%, you can increase bet size by 10-20%
4. Always maintain the 1% rule

## Expected Losses:

With 96.5% RTP and $100 bet per spin:
- Theoretical loss: $3.50 per spin
- Expected monthly cost (100 spins/month): ~$350
- Entertainment value should exceed this cost to justify playing`,
    },
    {
      id: 'reading-statistics',
      title: 'Reading Statistics: What the Numbers Really Mean',
      icon: <TrendingUp className="h-5 w-5" />,
      summary: 'Interpret game statistics and streamer performance data correctly',
      readTime: '9 min read',
      content: `Numbers can be deceiving. Learn to read statistics critically and understand what sample sizes really mean.

## Sample Size is Everything:

**The Law of Large Numbers**
- Small sample (100 spins): Results wildly deviate from RTP
- Medium sample (10,000 spins): Results get closer to theoretical RTP
- Large sample (1,000,000 spins): Results very close to RTP
- Massive sample (100,000,000 spins): Results essentially equal to RTP

A streamer with a "hot slot" from 500 spins might just be lucky. Same game could perform poorly over 100,000 spins.

**Confidence Intervals**
- With 1,000 spins: RTP accuracy ±5%
- With 10,000 spins: RTP accuracy ±1.5%
- With 100,000 spins: RTP accuracy ±0.5%

## Understanding "Hot" and "Cold" Slots:

**What "Hot" Really Means**
- Game has returned more than theoretical RTP recently
- Doesn't mean it will continue being hot
- Regression to the mean is likely (it will normalize)
- "Hot" is just normal variance within a reasonable range

**What "Cold" Really Means**
- Game has returned less than theoretical RTP recently
- Doesn't mean it's "due" for a big win
- No "memory" - previous results don't affect future spins
- Waiting for a cold game to hit is a losing strategy

**Gambler's Fallacy Warning**
- After 10 reds in roulette, black is NOT more likely
- After 100 losing spins, a win is NOT guaranteed next
- Each spin is independent - past results don't influence future ones

## Streak Analysis:

**Winning Streaks**
- Real but extremely rare in proper variance
- Streaks of 3-5+ wins from low-volatility games: Normal
- Streaks of 10+ wins: Either variance or something's unusual
- Don't bet more because you're "on a streak" - it'll end

**Losing Streaks**
- Expected with high-volatility games
- 20-50 losing spins in a row: Normal for high-volatility slots
- Much longer streaks: Verify RTP and game integrity

## Reading Streamer Data on SlotFeed:

**Session RTP**
- Highly variable (short-term noise)
- Not predictive of future performance
- Use for entertainment, not strategy

**Observed RTP Over 30 Days**
- More reliable indicator
- Still subject to variance
- Compare against theoretical RTP ±2%

**Bonus Frequency**
- Shows if game's bonus feature is triggering normally
- Low frequency: Game performing cold
- High frequency: Game performing hot (temporary)

**Biggest Wins**
- Shows potential, not probability
- Frequency of massive wins (500x+) indicates volatility
- Max multiplier is theoretical - not all are achievable`,
    },
    {
      id: 'responsible-play',
      title: 'Responsible Gaming: Play Smart, Play Safe',
      icon: <Brain className="h-5 w-5" />,
      summary: 'Protect yourself and maintain a healthy relationship with gaming',
      readTime: '8 min read',
      content: `Slot play should be entertainment, not a solution to financial problems or emotional distress.

## Signs of Healthy Play:

✅ You view losses as entertainment cost
✅ You have strict time and money limits
✅ You never chase losses
✅ Your gambling doesn't affect relationships, work, or finances
✅ You can go days/weeks without gambling
✅ You keep gambling separate from other financial goals
✅ You can discuss your play openly with others

## Warning Signs of Problem Gambling:

⚠️ Gambling to escape problems or emotions
⚠️ Spending more time/money than intended
⚠️ Lying about gambling activities
⚠️ Chasing losses or going "all in"
⚠️ Neglecting relationships, work, or health
⚠️ Feeling anxiety when not able to gamble
⚠️ Using borrowed money to gamble

## Self-Control Tools:

**Loss Limits**: Set maximum loss per session/month
- Stop immediately when limit reached
- No exceptions, no "one more spin"

**Time Limits**: Set maximum play time
- Use a timer
- Strictly stop when time expires
- Don't extend "just one more minute"

**Deposit Limits**: Cap how much money you can add
- Many platforms support this
- Prevents impulsive overspending

**Self-Exclusion**: Voluntary ban from platforms
- If you need a break, request temporary/permanent ban
- Some platforms offer 6-month cooling off periods

## If You're Struggling:

**Support Resources**:
- National Council on Problem Gambling: 1-800-GAMBLER (1-800-426-2537)
- Gamblers Anonymous: www.gamblersanonymous.org
- NCPG Chat: Available online for immediate support
- Most jurisdictions have local helplines

**Tell Someone**: Speak to a trusted friend, family member, or counselor

**Get Help**: Cognitive behavioral therapy is effective for problem gambling

## Remember:

- No strategy can overcome RTP and house edge long-term
- Winning is luck, not skill (in slot games)
- Taking a break is a sign of strength, not weakness
- You're never "just one spin" away from recovery - that's a trap`,
    },
  ];

  // Get RTP FAQs for SEO
  const rtpFAQs = generateRTPFAQs();

  return (
    <main className="min-h-screen bg-background">
      {/* SEO Structured Data */}
      <WebPageStructuredData
        name="Slot Strategy Guides - SlotFeed"
        description="Master the fundamentals of slot play. Learn about RTP, volatility, bankroll management, and responsible gaming strategies."
        url="https://slotfeed.com/guides"
        type="CollectionPage"
        breadcrumbs={[
          { name: 'Home', url: 'https://slotfeed.com' },
          { name: 'Guides', url: 'https://slotfeed.com/guides' },
        ]}
      />
      <FAQStructuredData faqs={rtpFAQs} />
      <BankrollManagementHowTo />
      <ReadingStatsHowTo />
      <UnderstandingVolatilityHowTo />
      <UsingLiveSlotDataHowTo />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Strategy Guides</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Master the fundamentals of slot play. Learn about RTP, volatility, bankroll management, and responsible gaming strategies.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Educational</Badge>
              <Badge variant="secondary">Beginner-Friendly</Badge>
              <Badge variant="secondary">Expert Tips</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="space-y-4">
          {guides.map((guide) => (
            <Card
              key={guide.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                      {guide.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{guide.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-3">{guide.summary}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {guide.readTime}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {expandedGuide === guide.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {expandedGuide === guide.id && (
                <CardContent className="border-t pt-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {guide.content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('**') || paragraph.startsWith('##')) {
                        if (paragraph.startsWith('##')) {
                          return (
                            <h3 key={idx} className="text-lg font-semibold mt-6 mb-3">
                              {paragraph.replace(/^##\s*/, '').replace(/\*\*/g, '')}
                            </h3>
                          );
                        }
                        return null;
                      }
                      if (paragraph.startsWith('✅') || paragraph.startsWith('❌') || paragraph.startsWith('⚠️')) {
                        return (
                          <div key={idx} className="text-sm py-1">
                            {paragraph}
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-sm leading-relaxed text-foreground mb-3">
                          {paragraph.replace(/\*\*/g, '')}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Related Links */}
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-xl font-semibold mb-6">Continue Learning</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/rtp-insights">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardContent className="p-6">
                  <TrendingUp className="h-6 w-6 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">RTP Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Deep dive into RTP analysis across all games and providers
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/compare">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardContent className="p-6">
                  <Zap className="h-6 w-6 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Compare Slots</h4>
                  <p className="text-sm text-muted-foreground">
                    Side-by-side comparison of games to find your perfect match
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/slots">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardContent className="p-6">
                  <Percent className="h-6 w-6 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Explore Games</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse all slot games with real-time stats and insights
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Responsible Gaming Notice */}
        <div className="mt-12 p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Responsible Gaming:</strong> This guide is educational only. Gambling should be for entertainment, not income.
            Never gamble more than you can afford to lose. If you're struggling with gambling, please seek help at
            <Link href="https://www.ncpg.org" target="_blank" className="text-primary hover:underline ml-1">
              ncpg.org
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
