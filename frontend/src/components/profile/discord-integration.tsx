'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  MessageSquare,
  Link2,
  Unlink,
  Bell,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

interface DiscordWebhook {
  id: string;
  channelName: string;
  guildName: string;
  notificationTypes: string[];
  isActive: boolean;
}

interface DiscordIntegrationProps {
  userId?: string;
}

export function DiscordIntegration({ userId }: DiscordIntegrationProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordUserId, setDiscordUserId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookChannel, setNewWebhookChannel] = useState('');
  const [newWebhookGuild, setNewWebhookGuild] = useState('');
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  // Notification preferences
  const [dmEnabled, setDmEnabled] = useState(true);
  const [bigWinAlerts, setBigWinAlerts] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState(true);
  const [hotSlotAlerts, setHotSlotAlerts] = useState(false);

  const handleLink = async () => {
    if (!discordUserId || !discordUsername) {
      setLinkError('Please enter your Discord user ID and username');
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const response = await fetch(`/api/v1/discord/link?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_user_id: discordUserId,
          discord_username: discordUsername,
        }),
      });

      if (response.ok) {
        setIsLinked(true);
      } else {
        const error = await response.json();
        setLinkError(error.detail || 'Failed to link Discord account');
      }
    } catch (error) {
      setLinkError('Network error. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    try {
      await fetch(`/api/v1/discord/link?user_id=${userId}`, {
        method: 'DELETE',
      });
      setIsLinked(false);
      setDiscordUsername('');
      setDiscordUserId('');
    } catch (error) {
      console.error('Failed to unlink Discord:', error);
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhookUrl || !newWebhookChannel || !newWebhookGuild) {
      return;
    }

    setIsAddingWebhook(true);

    try {
      const response = await fetch(`/api/v1/discord/webhooks?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: newWebhookUrl,
          channel_name: newWebhookChannel,
          guild_name: newWebhookGuild,
          notification_types: ['big_win', 'streamer_live'],
        }),
      });

      if (response.ok) {
        const webhook = await response.json();
        setWebhooks([...webhooks, {
          id: webhook.id,
          channelName: webhook.channel_name,
          guildName: webhook.guild_name,
          notificationTypes: webhook.notification_types,
          isActive: webhook.is_active,
        }]);
        setNewWebhookUrl('');
        setNewWebhookChannel('');
        setNewWebhookGuild('');
        setShowAddWebhook(false);
      }
    } catch (error) {
      console.error('Failed to add webhook:', error);
    } finally {
      setIsAddingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await fetch(`/api/v1/discord/webhooks/${webhookId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch(`/api/v1/discord/test?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_type: 'big_win' }),
      });

      if (response.ok) {
        alert('Test notification sent! Check your Discord DMs.');
      } else {
        const error = await response.json();
        alert(`Failed: ${error.detail}`);
      }
    } catch (error) {
      alert('Failed to send test notification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Discord Account Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#5865F2] flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Discord Integration</CardTitle>
              <CardDescription>
                Receive notifications directly in Discord
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLinked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{discordUsername}</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleUnlink}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink
                </Button>
              </div>

              {/* Test notification */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleTestNotification}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Link your Discord account to receive notifications via DM.
                You'll need your Discord User ID (enable Developer Mode in Discord settings).
              </p>

              {linkError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {linkError}
                </div>
              )}

              <div className="space-y-3">
                <Input
                  placeholder="Discord Username (e.g., user#1234)"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                />
                <Input
                  placeholder="Discord User ID (e.g., 123456789012345678)"
                  value={discordUserId}
                  onChange={(e) => setDiscordUserId(e.target.value)}
                />
                <Button
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4]"
                  onClick={handleLink}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Link Discord Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DM Notification Preferences */}
      {isLinked && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DM Notifications</CardTitle>
            <CardDescription>
              Choose which notifications to receive in Discord DMs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Enable DM Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all DM notifications
                  </p>
                </div>
              </div>
              <Switch checked={dmEnabled} onCheckedChange={setDmEnabled} />
            </div>

            {dmEnabled && (
              <>
                <div className="flex items-center justify-between pl-11">
                  <div>
                    <p className="font-medium">Big Win Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      100x+ multiplier wins
                    </p>
                  </div>
                  <Switch checked={bigWinAlerts} onCheckedChange={setBigWinAlerts} />
                </div>

                <div className="flex items-center justify-between pl-11">
                  <div>
                    <p className="font-medium">Streamer Live Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      When followed streamers go live
                    </p>
                  </div>
                  <Switch checked={liveAlerts} onCheckedChange={setLiveAlerts} />
                </div>

                <div className="flex items-center justify-between pl-11">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Hot Slot Alerts</p>
                    <Badge variant="secondary">Pro</Badge>
                  </div>
                  <Switch
                    checked={hotSlotAlerts}
                    onCheckedChange={setHotSlotAlerts}
                    disabled
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Channel Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Channel Webhooks</CardTitle>
              <CardDescription>
                Send notifications to Discord channels (great for communities)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddWebhook(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddWebhook && (
            <div className="mb-4 p-4 border rounded-lg space-y-3">
              <Input
                placeholder="Webhook URL"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Channel Name"
                  value={newWebhookChannel}
                  onChange={(e) => setNewWebhookChannel(e.target.value)}
                />
                <Input
                  placeholder="Server Name"
                  value={newWebhookGuild}
                  onChange={(e) => setNewWebhookGuild(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddWebhook} disabled={isAddingWebhook}>
                  {isAddingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Webhook
                </Button>
                <Button variant="outline" onClick={() => setShowAddWebhook(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No webhooks configured</p>
              <p className="text-sm">Add a webhook to send notifications to a channel</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">#{webhook.channelName}</p>
                    <p className="text-sm text-muted-foreground">{webhook.guildName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
