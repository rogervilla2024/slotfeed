'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameContent {
  game_id: string;
  overview?: string;
  rtp_explanation?: string;
  volatility_analysis?: string;
  bonus_features?: string;
  strategies?: string;
  streamer_insights?: string;
  meta_description?: string;
  focus_keywords?: string[];
  is_published: boolean;
  generated_at?: string;
  updated_at?: string;
}

interface SlotGuideProps {
  gameId: string;
  gameName: string;
}

const GUIDE_SECTIONS = [
  { key: 'overview', title: 'Game Overview', icon: '🎮' },
  { key: 'rtp_explanation', title: 'RTP & Payout Mechanics', icon: '💰' },
  { key: 'volatility_analysis', title: 'Volatility Analysis', icon: '📊' },
  { key: 'bonus_features', title: 'Bonus Features Guide', icon: '🎁' },
  { key: 'strategies', title: 'Winning Strategies', icon: '🎯' },
  { key: 'streamer_insights', title: 'Streamer Insights', icon: '📡' },
];

export function SlotGuide({ gameId, gameName }: SlotGuideProps) {
  const [content, setContent] = useState<GameContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'bonus_features'])
  );

  useEffect(() => {
    fetchContent();
  }, [gameId]);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/games/${gameId}/content`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        setError('Content not available for this game yet');
      }
    } catch (err) {
      console.error('Failed to fetch game content:', err);
      setError('Failed to load game guide');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !content) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">{error || 'Guide Not Available'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive guide for {gameName} coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* SEO Meta Description */}
      {content.meta_description && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground italic">
              {content.meta_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Guide Sections */}
      <div className="space-y-3">
        {GUIDE_SECTIONS.map(({ key, title, icon }) => {
          const sectionKey = key as keyof GameContent;
          const sectionContent = content[sectionKey];

          if (!sectionContent) return null;

          const isExpanded = expandedSections.has(key);

          return (
            <Card key={key} className="overflow-hidden">
              <button
                onClick={() => toggleSection(key)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <CardContent className="px-4 pb-4 pt-0 border-t border-border">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {sectionContent}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Keywords */}
      {content.focus_keywords && content.focus_keywords.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Related Topics:</h4>
              <div className="flex flex-wrap gap-2">
                {content.focus_keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsible Gaming Notice */}
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">⚠️ Responsible Gaming:</span> Slot games are games of
            chance with no guaranteed outcomes. Play only with money you can afford to lose. If you
            experience problem gambling, please seek help from{' '}
            <a href="https://www.ncpg.org/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              the National Council on Problem Gambling
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading}>
          Refresh Guide
        </Button>
      </div>
    </div>
  );
}
