/**
 * HowTo Structured Data Component
 * Generates HowTo JSON-LD markup for step-by-step guides
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/how-to
 *
 * This enables step-by-step rich snippets in search results
 */

export interface HowToStep {
  /** Step name/title */
  name: string;
  /** Step instructions */
  text: string;
  /** Optional image URL for this step */
  image?: string;
  /** Optional URL for more info */
  url?: string;
}

interface HowToStructuredDataProps {
  /** Guide title */
  name: string;
  /** Guide description */
  description: string;
  /** Steps to complete */
  steps: HowToStep[];
  /** Total time to complete (ISO 8601 duration, e.g., "PT30M") */
  totalTime?: string;
  /** Estimated cost (optional) */
  estimatedCost?: {
    currency: string;
    value: string;
  };
  /** Main image for the guide */
  image?: string;
  /** Supply items needed (optional) */
  supply?: string[];
  /** Tools needed (optional) */
  tool?: string[];
}

export function HowToStructuredData({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
  image,
  supply,
  tool,
}: HowToStructuredDataProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  const howToSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  };

  if (totalTime) {
    howToSchema.totalTime = totalTime;
  }

  if (image) {
    howToSchema.image = {
      '@type': 'ImageObject',
      url: image,
    };
  }

  if (estimatedCost) {
    howToSchema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: estimatedCost.currency,
      value: estimatedCost.value,
    };
  }

  if (supply && supply.length > 0) {
    howToSchema.supply = supply.map((item) => ({
      '@type': 'HowToSupply',
      name: item,
    }));
  }

  if (tool && tool.length > 0) {
    howToSchema.tool = tool.map((item) => ({
      '@type': 'HowToTool',
      name: item,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(howToSchema),
      }}
    />
  );
}

/**
 * Pre-built guide: Bankroll Management
 */
export function BankrollManagementHowTo() {
  const steps: HowToStep[] = [
    {
      name: 'Set Your Entertainment Budget',
      text: 'Determine how much money you can afford to lose without affecting your financial obligations. This is your total gambling bankroll - treat it as an entertainment expense, not an investment.',
    },
    {
      name: 'Apply the 1% Rule',
      text: 'Each individual bet should be 1-2% of your total bankroll. For example, with a $500 bankroll, your bets should be $5-10. This protects you from variance and extends your playtime.',
    },
    {
      name: 'Set Session Limits',
      text: 'Before each session, decide on time limits (1-2 hours) and loss limits (25-50% of session budget). When you hit either limit, stop playing immediately.',
    },
    {
      name: 'Match Volatility to Bankroll',
      text: 'Play low volatility slots with smaller bankrolls and high volatility slots only with larger bankrolls. High volatility games can have long losing streaks that require more funds to survive.',
    },
    {
      name: 'Take Winnings Off the Table',
      text: 'When you win significantly (50%+ of your session budget), cash out at least half. Continue playing with only a portion of your winnings to lock in profits.',
    },
    {
      name: 'Never Chase Losses',
      text: 'If you hit your loss limit, walk away. Adding more money to recover losses is a dangerous pattern. Accept the loss as part of the entertainment cost and try again another day.',
    },
  ];

  return (
    <HowToStructuredData
      name="How to Manage Your Slot Bankroll"
      description="Learn proven bankroll management strategies to protect your money and play slots responsibly. These techniques help you play longer and reduce the risk of significant losses."
      steps={steps}
      totalTime="PT10M"
    />
  );
}

/**
 * Pre-built guide: Reading Slot Statistics
 */
export function ReadingStatsHowTo() {
  const steps: HowToStep[] = [
    {
      name: 'Understand RTP Basics',
      text: 'RTP (Return to Player) is the theoretical percentage a slot returns over millions of spins. A 96% RTP means $96 returned per $100 wagered on average. This is a long-term statistical measure, not a session guarantee.',
    },
    {
      name: 'Check Sample Size',
      text: 'Look at how many spins or sessions the statistics are based on. Small samples (under 1,000 spins) are unreliable. Larger samples (10,000+ spins) give more accurate pictures of actual performance.',
    },
    {
      name: 'Compare Observed vs Theoretical RTP',
      text: 'Compare the observed RTP from stream data against the theoretical RTP. Differences within 2-3% are normal variance. Larger differences suggest either luck (short-term) or data anomalies.',
    },
    {
      name: 'Evaluate Volatility Impact',
      text: "Consider the slot's volatility when interpreting statistics. High volatility slots naturally show more variation in short-term results. Don't confuse normal variance with 'hot' or 'cold' patterns.",
    },
    {
      name: 'Recognize Statistical Fallacies',
      text: "Remember that past results don't influence future spins. A 'cold' slot isn't 'due' for a win. Each spin is independent. Use statistics for entertainment context, not prediction.",
    },
  ];

  return (
    <HowToStructuredData
      name="How to Read Slot Statistics on LiveSlotData"
      description="Learn how to correctly interpret slot machine statistics, understand sample sizes, and avoid common statistical fallacies when analyzing game performance data."
      steps={steps}
      totalTime="PT8M"
    />
  );
}

/**
 * Pre-built guide: Understanding Volatility
 */
export function UnderstandingVolatilityHowTo() {
  const steps: HowToStep[] = [
    {
      name: 'Learn Volatility Levels',
      text: 'Slots come in low, medium, high, and very high volatility. Low volatility means frequent small wins. High volatility means rare but larger wins. This affects your bankroll requirements.',
    },
    {
      name: 'Match Volatility to Your Goals',
      text: 'Choose low volatility for longer play sessions with smaller bankrolls. Choose high volatility if you want big win potential and have funds to survive dry spells.',
    },
    {
      name: 'Adjust Bet Sizing',
      text: 'Use smaller bets on high volatility slots (0.5-1% of bankroll) and slightly larger bets on low volatility slots (1-2% of bankroll) to balance risk.',
    },
    {
      name: 'Set Realistic Expectations',
      text: 'High volatility slots can have 50-100+ losing spins in a row - this is normal. Low volatility slots rarely have such long losing streaks. Prepare mentally for the volatility you choose.',
    },
  ];

  return (
    <HowToStructuredData
      name="How to Choose Slots Based on Volatility"
      description="Understand slot volatility levels and learn how to choose games that match your bankroll, play style, and risk tolerance for a better gaming experience."
      steps={steps}
      totalTime="PT5M"
    />
  );
}

/**
 * Pre-built guide: Using LiveSlotData
 */
export function UsingLiveSlotDataHowTo() {
  const steps: HowToStep[] = [
    {
      name: 'Check Live Streams',
      text: "Visit the homepage to see which streamers are currently live. Click on any live streamer to see their real-time balance, current game, and session statistics.",
    },
    {
      name: 'Explore Slot Statistics',
      text: "Navigate to the Slots page to browse all tracked games. Click on any slot to see its RTP, volatility, streamer performance comparisons, and hot/cold status.",
    },
    {
      name: 'View Streamer Profiles',
      text: "Check the Streamers page to see performance rankings. Click on any streamer to view their lifetime stats, favorite games, session history, and current profit/loss.",
    },
    {
      name: 'Monitor Hot and Cold Slots',
      text: "Use the Hot/Cold page to see which slots are currently performing above or below their theoretical RTP based on recent stream data.",
    },
    {
      name: 'Set Up Alerts',
      text: 'Create a free account to set up personalized alerts for big wins, specific streamers going live, or slots hitting certain performance thresholds.',
    },
  ];

  return (
    <HowToStructuredData
      name="How to Use LiveSlotData for Slot Analytics"
      description="Learn how to navigate LiveSlotData to find live streams, analyze slot statistics, compare streamers, and set up alerts for real-time slot streaming insights."
      steps={steps}
      totalTime="PT5M"
      tool={['Web browser', 'LiveSlotData account (optional)']}
    />
  );
}
