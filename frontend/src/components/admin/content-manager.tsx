'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Edit, Eye, Trash2, Copy, CheckCircle, Clock } from 'lucide-react';

interface GameContent {
  game_id: string;
  game_name: string;
  provider: string;
  is_published: boolean;
  overview?: string;
  rtp_explanation?: string;
  volatility_analysis?: string;
  bonus_features?: string;
  strategies?: string;
  streamer_insights?: string;
  meta_description?: string;
  focus_keywords?: string[];
  generated_at?: string;
  updated_at?: string;
  generator_model?: string;
  content_length?: number;
  readability_score?: number;
  keyword_density?: number;
}

interface GenerationJob {
  id: string;
  game_id: string;
  game_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  retry_count: number;
}

export function ContentManager() {
  const [gameContents, setGameContents] = useState<GameContent[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameContent | null>(null);
  const [editingContent, setEditingContent] = useState<Partial<GameContent> | null>(null);
  const [generatingGameIds, setGeneratingGameIds] = useState<Set<string>>(new Set());
  const [savingGameIds, setSavingGameIds] = useState<Set<string>>(new Set());

  // Fetch game content list
  const fetchGameContents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/game-contents?limit=100');
      if (response.ok) {
        const data = await response.json();
        setGameContents(data.contents || []);
      }
    } catch (error) {
      console.error('Failed to fetch game contents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch generation jobs
  const fetchGenerationJobs = async () => {
    try {
      const response = await fetch('/api/v1/admin/generation-jobs?status=pending,processing');
      if (response.ok) {
        const data = await response.json();
        setGenerationJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch generation jobs:', error);
    }
  };

  useEffect(() => {
    fetchGameContents();
    fetchGenerationJobs();

    // Refresh jobs every 10 seconds
    const interval = setInterval(fetchGenerationJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Trigger content generation
  const handleGenerateContent = async (gameId: string) => {
    setGeneratingGameIds((prev) => new Set([...prev, gameId]));
    try {
      const response = await fetch('/api/v1/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId }),
      });

      if (response.ok) {
        await fetchGenerationJobs();
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setGeneratingGameIds((prev) => {
        const next = new Set(prev);
        next.delete(gameId);
        return next;
      });
    }
  };

  // Save edited content
  const handleSaveContent = async (gameId: string) => {
    if (!editingContent) return;

    setSavingGameIds((prev) => new Set([...prev, gameId]));
    try {
      const response = await fetch(`/api/v1/admin/game-contents/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContent),
      });

      if (response.ok) {
        await fetchGameContents();
        setEditingContent(null);
        setSelectedGame(null);
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setSavingGameIds((prev) => {
        const next = new Set(prev);
        next.delete(gameId);
        return next;
      });
    }
  };

  // Publish/unpublish content
  const handleTogglePublish = async (gameId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/v1/admin/game-contents/${gameId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !isPublished }),
      });

      if (response.ok) {
        await fetchGameContents();
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  // Delete content
  const handleDeleteContent = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/game-contents/${gameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGameContents();
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="contents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contents">Game Contents</TabsTrigger>
          <TabsTrigger value="generation">Generation Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Game Contents Tab */}
        <TabsContent value="contents" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">SEO Content Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage AI-generated educational content for slot games
              </p>
            </div>
            <Button onClick={fetchGameContents} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameContents.map((content) => (
                    <TableRow key={content.game_id}>
                      <TableCell className="font-medium">{content.game_name}</TableCell>
                      <TableCell>{content.provider}</TableCell>
                      <TableCell>
                        {content.is_published ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {content.generated_at
                          ? new Date(content.generated_at).toLocaleDateString()
                          : 'Not generated'}
                      </TableCell>
                      <TableCell>
                        {content.readability_score ? (
                          <div className="text-sm">
                            <span className="font-medium">{content.readability_score.toFixed(1)}</span>
                            <span className="text-muted-foreground"> | </span>
                            <span className="text-muted-foreground">
                              {content.content_length} chars
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={selectedGame?.game_id === content.game_id}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedGame(content);
                                  setEditingContent(null);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{selectedGame?.game_name} - Content Preview</DialogTitle>
                                <DialogDescription>
                                  Generated with {selectedGame?.generator_model}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedGame && (
                                <div className="space-y-6">
                                  {editingContent ? (
                                    // Edit Mode
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Overview</Label>
                                        <Textarea
                                          value={editingContent.overview || ''}
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              overview: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>RTP Explanation</Label>
                                        <Textarea
                                          value={editingContent.rtp_explanation || ''}
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              rtp_explanation: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>Volatility Analysis</Label>
                                        <Textarea
                                          value={editingContent.volatility_analysis || ''}
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              volatility_analysis: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>Bonus Features</Label>
                                        <Textarea
                                          value={editingContent.bonus_features || ''}
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              bonus_features: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>Strategies</Label>
                                        <Textarea
                                          value={editingContent.strategies || ''}
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              strategies: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>Meta Description</Label>
                                        <Textarea
                                          value={editingContent.meta_description || ''}
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              meta_description: e.target.value,
                                            }))
                                          }
                                          rows={2}
                                          maxLength={160}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {(editingContent.meta_description || '').length}/160 characters
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Focus Keywords (comma-separated)</Label>
                                        <Input
                                          value={
                                            editingContent.focus_keywords?.join(', ') || ''
                                          }
                                          onChange={(e) =>
                                            setEditingContent((prev) => ({
                                              ...prev,
                                              focus_keywords: e.target.value
                                                .split(',')
                                                .map((k) => k.trim())
                                                .filter(Boolean),
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    // View Mode
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Overview</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                          {selectedGame.overview || 'Not available'}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">RTP Explanation</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                          {selectedGame.rtp_explanation || 'Not available'}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Volatility Analysis</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                          {selectedGame.volatility_analysis || 'Not available'}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Bonus Features</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                          {selectedGame.bonus_features || 'Not available'}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Strategies</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                          {selectedGame.strategies || 'Not available'}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Meta Description</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedGame.meta_description || 'Not available'}
                                        </p>
                                      </div>
                                      {selectedGame.focus_keywords && selectedGame.focus_keywords.length > 0 && (
                                        <div>
                                          <h4 className="font-semibold text-sm mb-2">Focus Keywords</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {selectedGame.focus_keywords.map((kw, idx) => (
                                              <Badge key={idx} variant="secondary">
                                                {kw}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              <DialogFooter>
                                {editingContent ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingContent(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleSaveContent(selectedGame?.game_id || '')}
                                      disabled={savingGameIds.has(selectedGame?.game_id || '')}
                                    >
                                      Save Changes
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingContent({ ...selectedGame })}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublish(content.game_id, content.is_published)}
                          >
                            {content.is_published ? 'Unpublish' : 'Publish'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateContent(content.game_id)}
                            disabled={generatingGameIds.has(content.game_id)}
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${
                                generatingGameIds.has(content.game_id) ? 'animate-spin' : ''
                              }`}
                            />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContent(content.game_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Generation Queue Tab */}
        <TabsContent value="generation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Queue</CardTitle>
              <CardDescription>Active and pending content generation jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {generationJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active generation jobs
                </p>
              ) : (
                <div className="space-y-3">
                  {generationJobs.map((job) => (
                    <Card key={job.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.game_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Started: {job.started_at ? new Date(job.started_at).toLocaleString() : 'Pending'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              job.status === 'completed'
                                ? 'default'
                                : job.status === 'failed'
                                  ? 'destructive'
                                  : job.status === 'processing'
                                    ? 'secondary'
                                    : 'outline'
                            }
                          >
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </Badge>
                          {job.status === 'failed' && job.error_message && (
                            <p className="text-xs text-destructive mt-2">{job.error_message}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Games</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{gameContents.length}</p>
                <p className="text-xs text-muted-foreground mt-2">Total tracked games</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {gameContents.filter((c) => c.is_published).length}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Live content</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {gameContents.length > 0
                    ? (
                        gameContents.reduce((sum, c) => sum + (c.readability_score || 0), 0) /
                        gameContents.filter((c) => c.readability_score).length
                      ).toFixed(1)
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Readability score</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
