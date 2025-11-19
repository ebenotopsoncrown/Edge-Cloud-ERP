import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Unlock, Search, Clock, User, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import ActiveUsersWidget from "../components/shared/ActiveUsersWidget";

export default function LockManagement() {
  const { currentCompany, user } = useCompany();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [lockToRelease, setLockToRelease] = useState(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

  const { data: allLocks = [], isLoading, refetch } = useQuery({
    queryKey: ['all-locks', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const locks = await base44.entities.RecordLock.filter({
        company_id: currentCompany.id
      }, '-locked_at', 200);

      return locks;
    },
    enabled: !!currentCompany,
    refetchInterval: 10000 // Auto-refresh every 10 seconds
  });

  const releaseLockMutation = useMutation({
    mutationFn: async (lockId) => {
      await base44.entities.RecordLock.update(lockId, {
        is_active: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-locks']);
      queryClient.invalidateQueries(['active-locks']);
      setReleaseDialogOpen(false);
      setLockToRelease(null);
    }
  });

  const releaseExpiredLocksMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const expiredLocks = allLocks.filter(lock => {
        const expiresAt = new Date(lock.lock_expires_at);
        return lock.is_active && expiresAt < now;
      });

      for (const lock of expiredLocks) {
        await base44.entities.RecordLock.update(lock.id, {
          is_active: false
        });
      }

      return expiredLocks.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['all-locks']);
      queryClient.invalidateQueries(['active-locks']);
      alert(`Released ${count} expired lock${count !== 1 ? 's' : ''}`);
    }
  });

  const handleReleaseLock = (lock) => {
    setLockToRelease(lock);
    setReleaseDialogOpen(true);
  };

  const confirmRelease = () => {
    if (lockToRelease) {
      releaseLockMutation.mutate(lockToRelease.id);
    }
  };

  const filteredLocks = allLocks.filter(lock =>
    lock.locked_by_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lock.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lock.record_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLocks = filteredLocks.filter(lock => {
    const now = new Date();
    const expiresAt = new Date(lock.lock_expires_at);
    return lock.is_active && expiresAt > now;
  });

  const expiredLocks = filteredLocks.filter(lock => {
    const now = new Date();
    const expiresAt = new Date(lock.lock_expires_at);
    return lock.is_active && expiresAt <= now;
  });

  const inactiveLocks = filteredLocks.filter(lock => !lock.is_active);

  const isExpired = (lock) => {
    const now = new Date();
    const expiresAt = new Date(lock.lock_expires_at);
    return expiresAt <= now;
  };

  if (!user?.is_super_admin) {
    return (
      <div className="p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Access Denied:</strong> This page is only accessible to Super Administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lock Management</h1>
        <p className="text-gray-500 mt-1">Monitor and manage record locks across the system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Locks</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{activeLocks.length}</p>
              </div>
              <Lock className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired Locks</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{expiredLocks.length}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Released Locks</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{inactiveLocks.length}</p>
              </div>
              <Unlock className="w-10 h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Record Locks</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  {expiredLocks.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => releaseExpiredLocksMutation.mutate()}
                      disabled={releaseExpiredLocksMutation.isPending}
                      className="text-orange-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clean Expired
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by user, entity, or record ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Locked At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Loading locks...
                        </TableCell>
                      </TableRow>
                    ) : filteredLocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Lock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No locks found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocks.map((lock) => (
                        <TableRow key={lock.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{lock.locked_by_user_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lock.entity_name}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {lock.record_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(lock.locked_at), 'MMM d, h:mm a')}
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(lock.locked_at), { addSuffix: true })}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(lock.lock_expires_at), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell>
                            {!lock.is_active ? (
                              <Badge className="bg-gray-100 text-gray-800">
                                Released
                              </Badge>
                            ) : isExpired(lock) ? (
                              <Badge className="bg-orange-100 text-orange-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Expired
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                <Lock className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {lock.is_active && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReleaseLock(lock)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Unlock className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <ActiveUsersWidget />
        </div>
      </div>

      <AlertDialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Lock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to forcefully release this lock? The user <strong>{lockToRelease?.locked_by_user_name}</strong> will lose their edit access and may lose unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRelease}
              className="bg-red-600 hover:bg-red-700"
            >
              Release Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}