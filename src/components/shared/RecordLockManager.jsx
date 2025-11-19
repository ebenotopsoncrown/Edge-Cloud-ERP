import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCompany } from '../auth/CompanyContext';

/**
 * Hook to manage record locking for concurrent access control
 * @param {string} entityName - Name of entity (e.g., 'Invoice', 'Customer')
 * @param {string} recordId - ID of the record being edited
 * @param {boolean} enabled - Whether locking is enabled for this form
 */
export function useRecordLock(entityName, recordId, enabled = true) {
  const { currentCompany, user } = useCompany();
  const [lockStatus, setLockStatus] = useState({
    isLocked: false,
    lockedBy: null,
    canEdit: true,
    loading: true
  });
  const [sessionId] = useState(() => `${Date.now()}-${Math.random()}`);

  // Check for existing locks
  const checkLock = useCallback(async () => {
    if (!enabled || !recordId || !currentCompany || !user) {
      setLockStatus({ isLocked: false, lockedBy: null, canEdit: true, loading: false });
      return;
    }

    try {
      const locks = await base44.entities.RecordLock.filter({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId,
        is_active: true
      });

      // Remove expired locks
      const now = new Date();
      const activeLocks = [];
      
      for (const lock of locks) {
        const expiresAt = new Date(lock.lock_expires_at);
        if (expiresAt > now && lock.session_id !== sessionId) {
          activeLocks.push(lock);
        } else if (expiresAt <= now || lock.session_id === sessionId) {
          // Clean up expired or own session locks
          await base44.entities.RecordLock.update(lock.id, { is_active: false });
        }
      }

      if (activeLocks.length > 0) {
        const lock = activeLocks[0];
        setLockStatus({
          isLocked: true,
          lockedBy: {
            name: lock.locked_by_user_name,
            userId: lock.locked_by_user_id
          },
          canEdit: false,
          loading: false
        });
      } else {
        setLockStatus({
          isLocked: false,
          lockedBy: null,
          canEdit: true,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error checking lock:', error);
      setLockStatus({ isLocked: false, lockedBy: null, canEdit: true, loading: false });
    }
  }, [entityName, recordId, currentCompany, user, sessionId, enabled]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (!enabled || !recordId || !currentCompany || !user) return null;

    try {
      // Check if someone else has the lock
      await checkLock();
      
      if (lockStatus.isLocked && !lockStatus.canEdit) {
        return null; // Someone else has the lock
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15-minute lock

      const lock = await base44.entities.RecordLock.create({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId,
        locked_by_user_id: user.id,
        locked_by_user_name: user.full_name,
        locked_at: new Date().toISOString(),
        lock_expires_at: expiresAt.toISOString(),
        session_id: sessionId,
        is_active: true
      });

      setLockStatus({
        isLocked: true,
        lockedBy: { name: user.full_name, userId: user.id },
        canEdit: true,
        loading: false
      });

      return lock;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return null;
    }
  }, [entityName, recordId, currentCompany, user, sessionId, checkLock, lockStatus, enabled]);

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!enabled || !recordId || !currentCompany) return;

    try {
      const locks = await base44.entities.RecordLock.filter({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId,
        session_id: sessionId,
        is_active: true
      });

      for (const lock of locks) {
        await base44.entities.RecordLock.update(lock.id, { is_active: false });
      }

      setLockStatus({
        isLocked: false,
        lockedBy: null,
        canEdit: true,
        loading: false
      });
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }, [entityName, recordId, currentCompany, sessionId, enabled]);

  // Refresh lock (extend expiry)
  const refreshLock = useCallback(async () => {
    if (!enabled || !recordId || !currentCompany) return;

    try {
      const locks = await base44.entities.RecordLock.filter({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId,
        session_id: sessionId,
        is_active: true
      });

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      for (const lock of locks) {
        await base44.entities.RecordLock.update(lock.id, {
          lock_expires_at: expiresAt.toISOString()
        });
      }
    } catch (error) {
      console.error('Error refreshing lock:', error);
    }
  }, [entityName, recordId, currentCompany, sessionId, enabled]);

  // Auto-check locks on mount and periodically
  useEffect(() => {
    if (enabled && recordId) {
      checkLock();
      const interval = setInterval(checkLock, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [checkLock, recordId, enabled]);

  // Auto-refresh lock every 5 minutes if we have it
  useEffect(() => {
    if (enabled && lockStatus.canEdit && lockStatus.isLocked && recordId) {
      const interval = setInterval(refreshLock, 5 * 60 * 1000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [refreshLock, lockStatus, recordId, enabled]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (enabled && recordId) {
        releaseLock();
      }
    };
  }, [recordId, enabled]); // Intentionally not including releaseLock to avoid re-creating effect

  return {
    lockStatus,
    acquireLock,
    releaseLock,
    refreshLock,
    checkLock
  };
}

/**
 * Hook to create audit log entries
 */
export function useAuditLog() {
  const { currentCompany, user } = useCompany();

  const logAction = useCallback(async (entityName, recordId, action, changes = null) => {
    if (!currentCompany || !user) return;

    try {
      await base44.entities.AuditLog.create({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId,
        action,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        timestamp: new Date().toISOString(),
        changes: changes || {}
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }, [currentCompany, user]);

  return { logAction };
}

/**
 * Hook to manage record versions
 */
export function useRecordVersion() {
  const { currentCompany, user } = useCompany();

  const saveVersion = useCallback(async (entityName, recordId, recordData, changeDescription = '') => {
    if (!currentCompany || !user) return;

    try {
      // Get existing versions to determine version number
      const versions = await base44.entities.RecordVersion.filter({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId
      }, '-version_number');

      const versionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

      await base44.entities.RecordVersion.create({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId,
        version_number: versionNumber,
        record_data: recordData,
        changed_by_user_id: user.id,
        changed_by_user_name: user.full_name,
        change_description: changeDescription,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }, [currentCompany, user]);

  const getVersions = useCallback(async (entityName, recordId) => {
    if (!currentCompany) return [];

    try {
      return await base44.entities.RecordVersion.filter({
        company_id: currentCompany.id,
        entity_name: entityName,
        record_id: recordId
      }, '-version_number');
    } catch (error) {
      console.error('Error getting versions:', error);
      return [];
    }
  }, [currentCompany]);

  return { saveVersion, getVersions };
}