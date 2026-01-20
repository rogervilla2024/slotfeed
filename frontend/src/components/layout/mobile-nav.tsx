'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mobileNavItems = [
  { href: '/', label: 'Live', icon: '📺' },
  { href: '/big-wins', label: 'Wins', icon: '🏆' },
  { href: '/hot-cold', label: 'Hot/Cold', icon: '🔥' },
  { href: '/leaderboard', label: 'Leaders', icon: '📊' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border/40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 px-1 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
