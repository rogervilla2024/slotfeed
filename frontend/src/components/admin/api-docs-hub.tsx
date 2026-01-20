'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Book, Code2, Terminal } from 'lucide-react';

const apiEndpoints = [
  {
    category: 'Dashboard',
    endpoints: [
      { method: 'GET', path: '/api/v1/dashboard/state', description: 'Get dashboard state' },
      { method: 'GET', path: '/api/v1/dashboard/metrics', description: 'Get dashboard metrics' },
      { method: 'GET', path: '/api/v1/dashboard/alerts', description: 'Get alert list' },
      { method: 'WS', path: '/api/v1/ws/dashboard', description: 'WebSocket dashboard updates' },
    ],
  },
  {
    category: 'Games',
    endpoints: [
      { method: 'GET', path: '/api/v1/games', description: 'List all games' },
      { method: 'GET', path: '/api/v1/games/{id}', description: 'Get game details' },
      { method: 'GET', path: '/api/v1/games/{id}/stats', description: 'Get game statistics' },
      { method: 'GET', path: '/api/v1/games/{id}/content', description: 'Get game content' },
    ],
  },
  {
    category: 'Streamers',
    endpoints: [
      { method: 'GET', path: '/api/v1/streamers', description: 'List streamers' },
      { method: 'GET', path: '/api/v1/streamers/{id}', description: 'Get streamer profile' },
      { method: 'GET', path: '/api/v1/streamers/{id}/sessions', description: 'Get sessions' },
      { method: 'GET', path: '/api/v1/streamers/{id}/stats', description: 'Get statistics' },
    ],
  },
  {
    category: 'Admin',
    endpoints: [
      { method: 'GET', path: '/api/v1/admin/game-contents', description: 'List game content' },
      { method: 'POST', path: '/api/v1/admin/generate-content', description: 'Trigger generation' },
      { method: 'GET', path: '/api/v1/admin/generation-stats', description: 'Get generation stats' },
      { method: 'GET', path: '/api/v1/admin/system-metrics', description: 'Get system metrics' },
    ],
  },
];

const integrationGuides = [
  {
    title: 'Getting Started',
    description: 'Quick start guide for API integration',
    icon: Book,
    url: '/docs/getting-started',
  },
  {
    title: 'Authentication',
    description: 'API key and OAuth authentication',
    icon: Code2,
    url: '/docs/authentication',
  },
  {
    title: 'WebSocket Real-time',
    description: 'Setting up real-time data updates',
    icon: Terminal,
    url: '/docs/websocket',
  },
  {
    title: 'Error Handling',
    description: 'Understanding error responses',
    icon: Book,
    url: '/docs/errors',
  },
];

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'POST':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'PUT':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'DELETE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'WS':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export function APIDocsHub() {
  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto flex flex-col items-center justify-center py-6"
          asChild
        >
          <a href="/api/v1/docs" target="_blank" rel="noopener noreferrer">
            <Book className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Interactive Docs</span>
            <span className="text-xs text-muted-foreground">Swagger UI</span>
          </a>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex flex-col items-center justify-center py-6"
          asChild
        >
          <a href="/api/v1/redoc" target="_blank" rel="noopener noreferrer">
            <Code2 className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">ReDoc</span>
            <span className="text-xs text-muted-foreground">Detailed Docs</span>
          </a>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex flex-col items-center justify-center py-6"
          asChild
        >
          <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
            <Terminal className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">OpenAPI Spec</span>
            <span className="text-xs text-muted-foreground">JSON Format</span>
          </a>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex flex-col items-center justify-center py-6"
          asChild
        >
          <a href="/api/v1/health" target="_blank" rel="noopener noreferrer">
            <Book className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Health Check</span>
            <span className="text-xs text-muted-foreground">Status</span>
          </a>
        </Button>
      </div>

      {/* Integration Guides */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guides</CardTitle>
          <CardDescription>Step-by-step guides for common integration scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrationGuides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <a
                  key={index}
                  href={guide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {guide.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {guide.description}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Browse all available endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={apiEndpoints[0].category} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              {apiEndpoints.map((category) => (
                <TabsTrigger
                  key={category.category}
                  value={category.category}
                  className="text-xs"
                >
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>

            {apiEndpoints.map((category) => (
              <TabsContent key={category.category} value={category.category} className="space-y-3">
                {category.endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                    </div>
                    <code className="text-sm font-mono text-muted-foreground block mb-2">
                      {endpoint.path}
                    </code>
                    <p className="text-sm">{endpoint.description}</p>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Quick examples for different languages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript" className="space-y-4">
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>

            <TabsContent value="javascript" className="space-y-3">
              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`const response = await fetch('/api/v1/dashboard/metrics');
const data = await response.json();
console.log(data);`}</pre>
              </div>
            </TabsContent>

            <TabsContent value="python" className="space-y-3">
              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`import requests

response = requests.get('/api/v1/dashboard/metrics')
data = response.json()
print(data)`}</pre>
              </div>
            </TabsContent>

            <TabsContent value="curl" className="space-y-3">
              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`curl -X GET \\
  http://localhost:8000/api/v1/dashboard/metrics \\
  -H 'Content-Type: application/json'`}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact our support team or check the documentation</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" asChild>
            <a href="mailto:support@slotfeed.com">Email Support</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/slotfeed/docs" target="_blank" rel="noopener noreferrer">
              GitHub Issues
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
