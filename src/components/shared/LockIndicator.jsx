import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LockIndicator({ lockStatus }) {
  if (lockStatus.loading) {
    return (
      <Alert className="bg-gray-50 border-gray-200">
        <Clock className="h-4 w-4 animate-spin text-gray-500" />
        <AlertDescription className="text-gray-700">
          Checking edit status...
        </AlertDescription>
      </Alert>
    );
  }

  if (lockStatus.isLocked && !lockStatus.canEdit) {
    return (
      <Alert className="bg-red-50 border-2 border-red-500 animate-pulse">
        <Lock className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-900">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <strong>Currently Being Edited</strong>
          </div>
          <p className="mt-2">
            <strong>{lockStatus.lockedBy?.name}</strong> is currently editing this record.
          </p>
          <p className="mt-1 text-sm">
            You cannot make changes until they finish or their session expires (15 minutes of inactivity).
            The page will refresh automatically when available.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (lockStatus.isLocked && lockStatus.canEdit) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Lock className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>You have exclusive edit access</strong> - Others will see a read-only view while you're editing.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}