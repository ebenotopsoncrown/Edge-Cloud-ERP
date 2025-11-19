import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  Calendar,
  User,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye
};

const actionColors = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  view: "bg-gray-100 text-gray-800"
};

export default function AuditTrail() {
  const { currentCompany, user } = useCompany();
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const logs = await base44.entities.AuditLog.filter({
        company_id: currentCompany.id
      }, '-timestamp', 500);

      return logs;
    },
    enabled: !!currentCompany,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get unique entities and users for filters
  const uniqueEntities = [...new Set(auditLogs.map(log => log.entity_name))];
  const uniqueUsers = [...new Set(auditLogs.map(log => log.user_name))];

  // Apply filters
  const filteredLogs = auditLogs.filter(log => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.user_email?.toLowerCase().includes(searchLower) ||
        log.entity_name?.toLowerCase().includes(searchLower) ||
        log.record_id?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Entity filter
    if (entityFilter !== "all" && log.entity_name !== entityFilter) {
      return false;
    }

    // Action filter
    if (actionFilter !== "all" && log.action !== actionFilter) {
      return false;
    }

    // User filter
    if (userFilter !== "all" && log.user_name !== userFilter) {
      return false;
    }

    // Date range filter
    if (dateFrom) {
      const logDate = new Date(log.timestamp);
      const fromDate = new Date(dateFrom);
      if (logDate < fromDate) return false;
    }

    if (dateTo) {
      const logDate = new Date(log.timestamp);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (logDate > toDate) return false;
    }

    return true;
  });

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Entity', 'Record ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.user_name,
        log.user_email,
        log.action,
        log.entity_name,
        log.record_id,
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setEntityFilter("all");
    setActionFilter("all");
    setUserFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Statistics
  const stats = {
    total: filteredLogs.length,
    creates: filteredLogs.filter(l => l.action === 'create').length,
    updates: filteredLogs.filter(l => l.action === 'update').length,
    deletes: filteredLogs.filter(l => l.action === 'delete').length,
    views: filteredLogs.filter(l => l.action === 'view').length
  };

  if (!user?.is_super_admin) {
    return (
      <div className="p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Access Denied:</strong> Audit Trail is only accessible to Super Administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 mt-1">Complete history of all system actions and changes</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Creates</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.creates}</p>
              </div>
              <Plus className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Updates</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.updates}</p>
              </div>
              <Edit className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Deletes</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.deletes}</p>
              </div>
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Views</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.views}</p>
              </div>
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="User, entity, record..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Entity</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {uniqueEntities.map(entity => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(userName => (
                    <SelectItem key={userName} value={userName}>{userName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Reset
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-end md:col-span-3 justify-end">
              <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-gray-500">Loading audit logs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No audit logs found</p>
                      {(searchTerm || entityFilter !== 'all' || actionFilter !== 'all' || userFilter !== 'all') && (
                        <Button variant="link" onClick={resetFilters} className="mt-2">
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || FileText;
                    return (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium">
                                {format(new Date(log.timestamp), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(log.timestamp), 'h:mm:ss a')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-xs">
                                {log.user_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{log.user_name}</p>
                              <p className="text-xs text-gray-500">{log.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action]}>
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {log.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.entity_name}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.record_id?.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">User</p>
                    <p className="font-semibold">{selectedLog.user_name}</p>
                    <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timestamp</p>
                    <p className="font-semibold">
                      {format(new Date(selectedLog.timestamp), 'MMM d, yyyy h:mm:ss a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Action</p>
                    <Badge className={actionColors[selectedLog.action]}>
                      {selectedLog.action.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Entity</p>
                    <Badge variant="outline">{selectedLog.entity_name}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Record ID</p>
                    <p className="font-mono text-xs">{selectedLog.record_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Changes */}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </div>

                    {selectedLog.action === 'update' && selectedLog.changes.before && selectedLog.changes.after && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-red-700">Before</h4>
                          <div className="bg-red-50 rounded p-3 max-h-64 overflow-auto">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.changes.before, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700">After</h4>
                          <div className="bg-green-50 rounded p-3 max-h-64 overflow-auto">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.changes.after, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Browser Info */}
              {selectedLog.user_agent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Browser Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 font-mono">{selectedLog.user_agent}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}