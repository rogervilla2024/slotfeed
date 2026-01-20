/**
 * FAQ Structured Data Component
 * Generates FAQPage JSON-LD markup for Google Rich Results
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQStructuredDataProps {
  faqs: FAQItem[];
  /** Optional: Page URL for mainEntity reference */
  pageUrl?: string;
}

export function FAQStructuredData({ faqs, pageUrl }: FAQStructuredDataProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema),
      }}
    />
  );
}

/**
 * Generate slot-specific FAQs based on game data
 */
export function generateSlotFAQs(
  gameName: string,
  rtp: number,
  volatility: string,
  provider?: string,
  maxMultiplier?: number
): FAQItem[] {
  const faqs: FAQItem[] = [
    {
      question: `What is the RTP of ${gameName}?`,
      answer: `${gameName} has a theoretical Return to Player (RTP) of ${rtp}%. This means that over millions of spins, the game is designed to return ${rtp}% of all wagered money to players. However, individual session results can vary significantly due to volatility.`,
    },
    {
      question: `What is the volatility of ${gameName}?`,
      answer: `${gameName} is a ${volatility} volatility slot. ${
        volatility === 'high' || volatility === 'very high'
          ? 'This means you can expect longer dry spells between wins, but when wins do occur, they tend to be larger. A bigger bankroll is recommended for extended play sessions.'
          : volatility === 'medium'
          ? 'This offers a balanced experience with a mix of frequent smaller wins and occasional larger payouts. Suitable for most bankroll sizes.'
          : 'This means you can expect more frequent wins, though they tend to be smaller. Great for players who prefer steady gameplay and smaller bankrolls.'
      }`,
    },
  ];

  if (provider) {
    faqs.push({
      question: `Who made ${gameName}?`,
      answer: `${gameName} was developed by ${provider}, a leading game provider in the online casino industry. ${provider} is known for creating high-quality slot games with engaging features and fair gameplay.`,
    });
  }

  if (maxMultiplier) {
    faqs.push({
      question: `What is the maximum win on ${gameName}?`,
      answer: `The maximum win potential on ${gameName} is ${maxMultiplier.toLocaleString()}x your bet. This means if you bet $1, the theoretical maximum you could win is $${maxMultiplier.toLocaleString()}. However, max wins are extremely rare and require perfect bonus round conditions.`,
    });
  }

  faqs.push({
    question: `Is ${gameName} a good slot to play?`,
    answer: `${gameName} with its ${rtp}% RTP and ${volatility} volatility appeals to players who ${
      volatility === 'high' || volatility === 'very high'
        ? 'enjoy high-risk, high-reward gameplay and have the bankroll to handle variance'
        : volatility === 'medium'
        ? 'want balanced gameplay with decent win frequency and payout potential'
        : 'prefer consistent, lower-risk gameplay with frequent smaller wins'
    }. Always gamble responsibly and within your means.`,
  });

  return faqs;
}

/**
 * Generate RTP-related FAQs for guides page
 */
export function generateRTPFAQs(): FAQItem[] {
  return [
    {
      question: 'What is RTP in slot machines?',
      answer: 'RTP (Return to Player) is a percentage that indicates how much of all wagered money a slot machine will theoretically pay back to players over time. For example, a slot with 96% RTP will return $96 for every $100 wagered on average. The remaining 4% is the house edge.',
    },
    {
      question: 'Does higher RTP mean more wins?',
      answer: 'Higher RTP means better long-term returns, but it does not guarantee more frequent wins in the short term. RTP is calculated over millions of spins. Your individual session can vary dramatically from the theoretical RTP due to variance.',
    },
    {
      question: 'What is a good RTP for a slot machine?',
      answer: 'Generally, slots with RTP above 96% are considered good. RTP between 94-96% is average, and below 94% is on the lower end. Online slots typically offer higher RTPs (95-99%) compared to land-based casino slots (85-95%).',
    },
    {
      question: 'What is slot volatility?',
      answer: 'Volatility (or variance) describes how a slot pays out. High volatility slots have bigger but less frequent wins. Low volatility slots have smaller but more frequent wins. Your choice should match your bankroll and risk tolerance.',
    },
    {
      question: 'Can you beat slot machines in the long run?',
      answer: 'No, slot machines are designed with a house edge (100% minus RTP). Over the long term, the casino will always have a mathematical advantage. Slots should be viewed as entertainment, not a way to make money. Always gamble responsibly.',
    },
  ];
}
