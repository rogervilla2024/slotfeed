import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { WebSiteStructuredData, OrganizationStructuredData } from '@/components/seo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://liveslotdata.com'),
  title: {
    default: 'LiveSlotData - Real-Time Slot Streaming Analytics',
    template: '%s | LiveSlotData',
  },
  description:
    'Track live slot streamers, analyze RTP, discover hot slots, and get big win alerts. Real-time data from Kick, Twitch & YouTube streams.',
  keywords: [
    'slot streaming',
    'casino analytics',
    'RTP tracker',
    'big wins',
    'kick streaming',
    'roshtein',
    'trainwreckstv',
    'slot data',
    'live slots',
    'slot streamer stats',
    'bonus hunt',
    'slot RTP',
  ],
  authors: [{ name: 'LiveSlotData' }],
  creator: 'LiveSlotData',
  publisher: 'LiveSlotData',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LiveSlotData',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://liveslotdata.com',
    siteName: 'LiveSlotData',
    title: 'LiveSlotData - Real-Time Slot Streaming Analytics',
    description:
      'Track live slot streamers, analyze RTP, discover hot slots in real-time. Data from top streamers like Roshtein, Trainwreckstv, ClassyBeef.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LiveSlotData - Slot Streaming Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@liveslotdata',
    creator: '@liveslotdata',
    title: 'LiveSlotData - Real-Time Slot Streaming Analytics',
    description:
      'Track live slot streamers, analyze RTP, discover hot slots in real-time.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://liveslotdata.com',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  category: 'entertainment',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Global Structured Data for SEO */}
        <WebSiteStructuredData enableSearch={true} />
        <OrganizationStructuredData />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className="flex-1 pb-20 md:pb-0">
              {children}
            </main>
            <MobileNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
