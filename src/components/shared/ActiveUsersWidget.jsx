import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Edit, Clock, FileText, Receipt, Users as UsersIcon, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCompany } from '../auth/CompanyContext';

const entityIcons = {
  'Invoice': FileText,
  'Bill': Receipt,
  'Customer': UsersIcon,
  'Vendor': UsersIcon,
  'Product': Package
};

export default function ActiveUsersWidget({ compact = false }) {
  const { currentCompany } = useCompany();

  const { data: activeLocks = [], refetch } = useQuery({
    queryKey: ['active-locks', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const now = new Date();
      const locks = await base44.entities.RecordLock.filter({
        company_id: currentCompany.id,
        is_active: true
      }, '-locked_at');

      // Filter out expired locks
      return locks.filter(lock => {
        const expiresAt = new Date(lock.lock_expires_at);
        return expiresAt > now;
      });
    },
    enabled: !!currentCompany,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-blue-600" />
        <span className="font-semibold">{activeLocks.length}</span>
        <span className="text-gray-600">active edit{activeLocks.length !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-blue-600" />
          Active Users
          <Badge className="ml-auto">{activeLocks.length} editing</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeLocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Edit className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No active edits right now</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeLocks.map((lock) => {
              const Icon = entityIcons[lock.entity_name] || FileText;
              return (
                <div
                  key={lock.id}
                  className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {lock.locked_by_user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-blue-700" />
                      <p className="font-semibold text-blue-900 truncate">
                        {lock.locked_by_user_name}
                      </p>
                    </div>
                    <p className="text-sm text-blue-800">
                      Editing <strong>{lock.entity_name}</strong>
                    </p>
                    <div className="flex items-center gap-1 text-xs text-blue-700 mt-1">
                      <Clock className="w-3 h-3" />
                      Started {formatDistanceToNow(new Date(lock.locked_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}