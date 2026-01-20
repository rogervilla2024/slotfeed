/**
 * Dynamic OG Image Generator
 * Generates Open Graph images for different page types
 *
 * Usage:
 * /api/og?type=streamer&name=Roshtein&rtp=96.5
 * /api/og?type=slot&name=Sweet%20Bonanza&rtp=96.48&volatility=high
 * /api/og?type=session&streamer=Roshtein&pnl=5000&rtp=98.2
 * /api/og?type=bonushunt&streamer=ClassyBeef&bonuses=15&roi=150
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'default';
  const name = searchParams.get('name') || 'LiveSlotData';

  // Common styles
  const gradientBg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
  const accentColor = '#e94560';
  const textColor = '#ffffff';

  try {
    switch (type) {
      case 'streamer': {
        const rtp = searchParams.get('rtp') || '96.00';
        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradientBg,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                  }}
                >
                  Streamer Profile
                </div>
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: textColor,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    color: '#a0a0a0',
                  }}
                >
                  {rtp}% Lifetime RTP
                </div>
                <div
                  style={{
                    marginTop: '40px',
                    fontSize: '20px',
                    color: accentColor,
                  }}
                >
                  liveslotdata.com
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      }

      case 'slot': {
        const rtp = searchParams.get('rtp') || '96.00';
        const volatility = searchParams.get('volatility') || 'High';
        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradientBg,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                  }}
                >
                  Slot Game Stats
                </div>
                <div
                  style={{
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: textColor,
                    textAlign: 'center',
                    maxWidth: '900px',
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '60px',
                    marginTop: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: textColor }}>
                      {rtp}%
                    </div>
                    <div style={{ fontSize: '20px', color: '#a0a0a0' }}>RTP</div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: textColor }}>
                      {volatility}
                    </div>
                    <div style={{ fontSize: '20px', color: '#a0a0a0' }}>Volatility</div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '40px',
                    fontSize: '20px',
                    color: accentColor,
                  }}
                >
                  liveslotdata.com
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      }

      case 'session': {
        const streamer = searchParams.get('streamer') || 'Streamer';
        const pnl = searchParams.get('pnl') || '0';
        const rtp = searchParams.get('rtp') || '96.00';
        const pnlNum = parseFloat(pnl);
        const pnlColor = pnlNum >= 0 ? '#10b981' : '#ef4444';
        const pnlPrefix = pnlNum >= 0 ? '+' : '';

        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradientBg,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                  }}
                >
                  Session Results
                </div>
                <div
                  style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: textColor,
                  }}
                >
                  {streamer}
                </div>
                <div
                  style={{
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: pnlColor,
                  }}
                >
                  {pnlPrefix}${Math.abs(pnlNum).toLocaleString()}
                </div>
                <div style={{ fontSize: '28px', color: '#a0a0a0' }}>{rtp}% Session RTP</div>
                <div
                  style={{
                    marginTop: '30px',
                    fontSize: '20px',
                    color: accentColor,
                  }}
                >
                  liveslotdata.com
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      }

      case 'bonushunt': {
        const streamer = searchParams.get('streamer') || 'Streamer';
        const bonuses = searchParams.get('bonuses') || '0';
        const roi = searchParams.get('roi') || '0';
        const roiNum = parseFloat(roi);
        const roiColor = roiNum >= 100 ? '#10b981' : '#ef4444';

        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradientBg,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                  }}
                >
                  Bonus Hunt
                </div>
                <div
                  style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: textColor,
                  }}
                >
                  {streamer}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '60px',
                    marginTop: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: textColor }}>
                      {bonuses}
                    </div>
                    <div style={{ fontSize: '20px', color: '#a0a0a0' }}>Bonuses</div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: roiColor }}>
                      {roi}%
                    </div>
                    <div style={{ fontSize: '20px', color: '#a0a0a0' }}>ROI</div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '40px',
                    fontSize: '20px',
                    color: accentColor,
                  }}
                >
                  liveslotdata.com
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      }

      default: {
        // Default OG image
        const title = searchParams.get('title') || 'Real-Time Slot Streaming Analytics';
        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradientBg,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '30px',
                }}
              >
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: textColor,
                  }}
                >
                  LiveSlotData
                </div>
                <div
                  style={{
                    fontSize: '32px',
                    color: '#a0a0a0',
                    textAlign: 'center',
                    maxWidth: '800px',
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '40px',
                    marginTop: '20px',
                  }}
                >
                  <div style={{ fontSize: '20px', color: accentColor }}>Live Streams</div>
                  <div style={{ fontSize: '20px', color: accentColor }}>RTP Analytics</div>
                  <div style={{ fontSize: '20px', color: accentColor }}>Big Wins</div>
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      }
    }
  } catch (error) {
    console.error('OG image generation error:', error);
    // Return a fallback text-based image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#ffffff' }}>
            LiveSlotData
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
