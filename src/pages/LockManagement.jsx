import React, { useState } from "react";
import { RecordLock } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Lock, Unlock, Clock, User, AlertTriangle, Trash2, RefreshCw, Shield } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import ActiveUsersWidget from "../components/shared/ActiveUsersWidget";
import PageShell, { PageHeader, StatBar, SearchBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn } from "../components/shared/PageShell";

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
      return RecordLock.list({ filters: { company_id: currentCompany.id }, orderBy: 'locked_at', ascending: false, limit: 200 });
    },
    enabled: !!currentCompany,
    refetchInterval: 10000
  });

  const releaseLockMutation = useMutation({
    mutationFn: (lockId) => RecordLock.update(lockId, { is_active: false }),
    onSuccess: () => { queryClient.invalidateQueries(['all-locks']); queryClient.invalidateQueries(['active-locks']); setReleaseDialogOpen(false); setLockToRelease(null); }
  });

  const releaseExpiredMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const expired = allLocks.filter(l => l.is_active && new Date(l.lock_expires_at) < now);
      for (const lock of expired) await RecordLock.update(lock.id, { is_active: false });
      return expired.length;
    },
    onSuccess: (count) => { queryClient.invalidateQueries(['all-locks']); alert(`Released ${count} expired lock${count !== 1 ? 's' : ''}`); }
  });

  if (!user?.is_super_admin) {
    return (
      <PageShell>
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '24px', display: 'flex', gap: 14 }}>
          <Shield style={{ width: 24, height: 24, color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>Access Denied</p>
            <p style={{ fontSize: 13.5, color: '#7F1D1D' }}>This page is only accessible to Super Administrators.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const now = new Date();
  const isExpired = (lock) => new Date(lock.lock_expires_at) <= now;

  const filtered    = allLocks.filter(l =>
    l.locked_by_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.record_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeLocks   = filtered.filter(l => l.is_active && !isExpired(l));
  const expiredLocks  = filtered.filter(l => l.is_active && isExpired(l));
  const inactiveLocks = filtered.filter(l => !l.is_active);

  const lockStatus = (lock) => {
    if (!lock.is_active) return 'released';
    if (isExpired(lock)) return 'expired';
    return 'active';
  };

  const TABLE_HEADERS = [{ label: 'User' }, { label: 'Entity' }, { label: 'Record ID' }, { label: 'Locked At' }, { label: 'Expires' }, { label: 'Status' }, { label: '' }];

  return (
    <PageShell>
      <PageHeader
        title="Lock Management"
        subtitle="Monitor and manage record locks across the system"
        icon={Lock}
        accentColor="#8B5CF6"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionBtn onClick={() => refetch()} icon={RefreshCw} label="Refresh" variant="outline" />
            {expiredLocks.length > 0 && (
              <ActionBtn
                onClick={() => releaseExpiredMutation.mutate()}
                icon={Trash2}
                label={`Clean ${expiredLocks.length} Expired`}
                variant="outline"
                style={{ color: '#F59E0B' }}
              />
            )}
          </div>
        }
      />

      <StatBar stats={[
        { label: 'Active Locks',   value: activeLocks.length,   icon: Lock,   color: '#00A86B' },
        { label: 'Expired Locks',  value: expiredLocks.length,  icon: Clock,  color: '#F59E0B' },
        { label: 'Released',       value: inactiveLocks.length, icon: Unlock, color: '#64748B' },
        { label: 'Total',          value: allLocks.length,      color: '#1B4F8A' },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by user, entity, or record ID…" />

          <ERPTable headers={TABLE_HEADERS} isLoading={isLoading} emptyIcon={Lock} emptyTitle="No locks found" emptyDesc="No record locks in the system.">
            {filtered.map(lock => (
              <ERPTableRow key={lock.id}>
                <ERPTableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EBF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User style={{ width: 13, height: 13, color: '#1B4F8A' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{lock.locked_by_user_name}</span>
                  </div>
                </ERPTableCell>
                <ERPTableCell>
                  <span style={{ padding: '3px 9px', background: '#F3E8FF', color: '#7C3AED', borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>{lock.entity_name}</span>
                </ERPTableCell>
                <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#94A3B8' }}>{lock.record_id?.substring(0, 8)}…</ERPTableCell>
                <ERPTableCell>
                  <div style={{ fontSize: 12.5, color: '#475569' }}>{format(new Date(lock.locked_at), 'MMM d, h:mm a')}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{formatDistanceToNow(new Date(lock.locked_at), { addSuffix: true })}</div>
                </ERPTableCell>
                <ERPTableCell muted style={{ fontSize: 12.5 }}>{format(new Date(lock.lock_expires_at), 'MMM d, h:mm a')}</ERPTableCell>
                <ERPTableCell><StatusBadge status={lockStatus(lock)} /></ERPTableCell>
                <ERPTableCell>
                  {lock.is_active && (
                    <button
                      onClick={() => { setLockToRelease(lock); setReleaseDialogOpen(true); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1.5px solid #FECACA', borderRadius: 7, background: 'white', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      <Unlock style={{ width: 12, height: 12 }} />
                      Release
                    </button>
                  )}
                </ERPTableCell>
              </ERPTableRow>
            ))}
          </ERPTable>
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
              Are you sure you want to forcefully release this lock? <strong>{lockToRelease?.locked_by_user_name}</strong> will lose edit access and may lose unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => releaseLockMutation.mutate(lockToRelease?.id)} className="bg-red-600 hover:bg-red-700">Release Lock</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
