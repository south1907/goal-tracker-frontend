'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import type { Goal } from '@/lib/types/api';

interface ShareGoalDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareGoalDialog({ goal, open, onOpenChange }: ShareGoalDialogProps) {
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal && open) {
      generateShareLink();
    }
  }, [goal, open]);

  const generateShareLink = async () => {
    if (!goal) return;

    // Check if goal has share_token
    if (goal.share_token) {
      const link = `${window.location.origin}/share/${goal.share_token}`;
      setShareLink(link);
      return;
    }

    // Generate share token if not exists
    setLoading(true);
    try {
      const result = await apiClient.generateShareToken(goal.id);
      const link = `${window.location.origin}/share/${result.share_token}`;
      setShareLink(link);
    } catch (error) {
      console.error('Error generating share token:', error);
      toast.error('Failed to generate share link', {
        description: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!', {
        description: 'Share this link with anyone to view your goal.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link', {
        description: 'Please try again.',
      });
    }
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-sky-500" />
            Share Goal
          </DialogTitle>
          <DialogDescription>
            Share this goal with anyone using the link below. They can view your goal without logging in.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={shareLink}
                  readOnly
                  className="pl-9 pr-4"
                  placeholder={loading ? 'Generating link...' : 'Share link will appear here'}
                />
              </div>
              <Button
                onClick={handleCopy}
                disabled={!shareLink || loading}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Only goals with "Public" or "Unlisted" privacy settings can be shared. 
              Private goals cannot be shared.
            </p>
          </div>

          {goal.privacy === 'private' && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Warning:</strong> This goal is currently private. Change the privacy setting to "Public" 
                or "Unlisted" to enable sharing.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

