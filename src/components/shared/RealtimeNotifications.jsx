import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, X, Edit, FileText, Receipt, Users, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCompany } from '../auth/CompanyContext';

const entityIcons = {
  'Invoice': FileText,
  'Bill': Receipt,
  'Customer': Users,
  'Vendor': Users,
  'Product': Package
};

export default function RealtimeNotifications() {
  const { currentCompany, user } = useCompany();
  const [notifications, setNotifications] = useState([]);
  const [lastCheckTime, setLastCheckTime] = useState(new Date());

  const { data: recentLocks = [] } = useQuery({
    queryKey: ['recent-locks', currentCompany?.id, lastCheckTime],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const locks = await base44.entities.RecordLock.filter({
        company_id: currentCompany.id,
        is_active: true
      }, '-locked_at', 50);

      // Filter locks created after last check and not by current user
      return locks.filter(lock => 
        new Date(lock.locked_at) > lastCheckTime && 
        lock.locked_by_user_id !== user?.id
      );
    },
    enabled: !!currentCompany && !!user,
    refetchInterval: 10000 // Check every 10 seconds
  });

  useEffect(() => {
    if (recentLocks.length > 0) {
      const newNotifications = recentLocks.map(lock => ({
        id: lock.id,
        message: `${lock.locked_by_user_name} started editing ${lock.entity_name}`,
        icon: entityIcons[lock.entity_name] || Edit,
        timestamp: lock.locked_at,
        entityName: lock.entity_name,
        userName: lock.locked_by_user_name
      }));

      setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Keep last 10
      setLastCheckTime(new Date());
    }
  }, [recentLocks]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 w-96 space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">
            {notifications.length} new notification{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismissAll}
          className="text-xs"
        >
          Dismiss All
        </Button>
      </div>

      {notifications.map((notification) => {
        const Icon = notification.icon;
        return (
          <Alert
            key={notification.id}
            className="bg-blue-50 border-blue-300 shadow-lg animate-slide-in"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <AlertDescription>
                  <p className="font-semibold text-blue-900">{notification.message}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </p>
                </AlertDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => dismissNotification(notification.id)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        );
      })}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}