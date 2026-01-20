import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatMultiplier(multiplier: number): string {
  return multiplier.toFixed(2) + 'x';
}

export function calculateProfitLoss(startBalance: number, currentBalance: number): {
  amount: number;
  percentage: number;
  isProfit: boolean;
} {
  const amount = currentBalance - startBalance;
  const percentage = startBalance > 0 ? (amount / startBalance) * 100 : 0;
  return {
    amount,
    percentage,
    isProfit: amount >= 0,
  };
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getPlatformColor(platform: 'kick' | 'twitch' | 'youtube'): string {
  const colors = {
    kick: 'text-kick',
    twitch: 'text-twitch',
    youtube: 'text-youtube',
  };
  return colors[platform] || 'text-foreground';
}
