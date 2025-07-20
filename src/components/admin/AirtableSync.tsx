'use client';

import { useState } from 'react';
import { useAirtableSync, useAirtableMetadata } from '@/hooks/useAirtableStories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Database,
  FileText,
  Tag,
  Users
} from 'lucide-react';

export function AirtableSync() {
  const [fullSync, setFullSync] = useState(false);
  const { sync, isSyncing, syncStatus, error } = useAirtableSync();
  const { data: metadata } = useAirtableMetadata();

  const handleSync = () => {
    sync({ fullSync });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'running':
        return <Badge variant="default">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const lastSync = syncStatus?.lastSync;
  const syncProgress = lastSync?.status === 'running' && lastSync?.recordsProcessed
    ? (lastSync.recordsProcessed / (metadata?.totalStories || 100)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Airtable Sync Status</span>
            {getStatusIcon(lastSync?.status)}
          </CardTitle>
          <CardDescription>
            Synchronize stories from your Airtable database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="full-sync" className="text-sm font-medium">
                  Sync Mode:
                </label>
                <select
                  id="full-sync"
                  value={fullSync ? 'full' : 'incremental'}
                  onChange={(e) => setFullSync(e.target.value === 'full')}
                  className="border rounded px-2 py-1 text-sm"
                  disabled={isSyncing}
                >
                  <option value="incremental">Incremental (New & Updated)</option>
                  <option value="full">Full (All Records)</option>
                </select>
              </div>
              {lastSync && (
                <p className="text-sm text-gray-500">
                  Last sync: {formatDate(lastSync.completedAt || lastSync.startedAt)}
                </p>
              )}
            </div>
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="min-w-[120px]"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Sync
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isSyncing && syncProgress > 0 && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-sm text-gray-500 text-center">
                Processing... {Math.round(syncProgress)}%
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sync Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'An error occurred during sync'}
              </AlertDescription>
            </Alert>
          )}

          {/* Last Sync Details */}
          {lastSync && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(lastSync.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Records Processed</p>
                  <p className="font-medium">{lastSync.recordsProcessed || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Records Updated</p>
                  <p className="font-medium">{lastSync.recordsUpdated || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Started</p>
                  <p className="font-medium">{formatDate(lastSync.startedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="font-medium">{formatDate(lastSync.completedAt)}</p>
                </div>
              </div>
              {lastSync.errors && lastSync.errors.length > 0 && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sync Errors</AlertTitle>
                  <AlertDescription>
                    {lastSync.errors.length} error(s) occurred during sync
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Airtable Metadata */}
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Airtable Database Overview</CardTitle>
            <CardDescription>
              Current statistics from your Airtable stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm">Total Stories</span>
                </div>
                <p className="text-2xl font-bold">{metadata.totalStories}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Published</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {metadata.publishedStories}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <Tag className="h-4 w-4 mr-2" />
                  <span className="text-sm">Unique Tags</span>
                </div>
                <p className="text-2xl font-bold">
                  {Object.keys(metadata.storiesByTag).length}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">Authors</span>
                </div>
                <p className="text-2xl font-bold">
                  {Object.keys(metadata.storiesByAuthor).length}
                </p>
              </div>
            </div>

            {/* Top Tags */}
            {metadata.insights?.topTags && metadata.insights.topTags.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Popular Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {metadata.insights.topTags.slice(0, 10).map((tag: any) => (
                    <Badge key={tag.tag} variant="secondary">
                      {tag.tag} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}