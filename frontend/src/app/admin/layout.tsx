'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const adminNavItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Content',
    href: '/admin/content',
    icon: FileText,
  },
  {
    label: 'Monitoring',
    href: '/admin/monitoring',
    icon: Activity,
  },
  {
    label: 'Streaming',
    href: '/admin/streaming',
    icon: BarChart3,
  },
  {
    label: 'API Docs',
    href: '/admin/api',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r bg-slate-50 transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'opacity-0'}`}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600" />
            <span className="font-semibold">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-foreground hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={`text-sm font-medium ${!sidebarOpen && 'hidden'}`}
                  >
                    {item.label}
                  </span>
                  {isActive && sidebarOpen && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-4 space-y-2">
          <Link href="/">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              {sidebarOpen ? 'Back to App' : '←'}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
