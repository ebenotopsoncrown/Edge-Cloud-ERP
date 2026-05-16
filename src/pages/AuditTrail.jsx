import React, { useState } from "react";
import { AuditLog } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, User, Eye, RefreshCw, Edit, Trash2, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn } from "../components/shared/PageShell";

const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy HH:mm'); } catch { return '—'; } };

const ACTION_COLORS = {
  create: { bg: '#E6F9F2', color: '#00875A' },
  update: { bg: '#EBF4FB', color: '#1B4F8A' },
  delete: { bg: '#FEF2F2', color: '#DC2626' },
  view:   { bg: '#F8FAFC', color: '#64748B' },
};

function ActionBadge({ action }) {
  const cfg = ACTION_COLORS[action] || ACTION_COLORS.view;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {action}
    </span>
  );
}

export default function AuditTrail() {
  const { currentCompany, user } = useCompany();
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [search, setSearch]           = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const logs = await AuditLog.list({ filters: { company_id: currentCompany.id }, orderBy: 'created_date', ascending: false });
      return logs;
    },
    enabled: !!currentCompany,
  });

  const filtered = auditLogs.filter(log => {
    const matchSearch = !search ||
      log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchEntity && matchAction;
  });

  const entityTypes = [...new Set(auditLogs.map(l => l.entity_type).filter(Boolean))];
  const createCount = auditLogs.filter(l => l.action === 'create').length;
  const updateCount = auditLogs.filter(l => l.action === 'update').length;
  const deleteCount = auditLogs.filter(l => l.action === 'delete').length;

  const TABLE_HEADERS = [
    { label: 'Action' }, { label: 'Entity Type' }, { label: 'Entity ID' },
    { label: 'User' }, { label: 'Date / Time' }, { label: 'Details' },
  ];

  return (
    <PageShell>
      {selectedLog && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent style={{ maxWidth: 600 }}>
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            <div style={{ fontSize: 13, color: '#475569' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px', marginBottom: 16 }}>
                {[
                  ['Action',      <ActionBadge action={selectedLog.action} />],
                  ['Entity Type', selectedLog.entity_type],
                  ['Entity ID',   <span style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{selectedLog.entity_id}</span>],
                  ['User',        selectedLog.user_email || selectedLog.user_name || '—'],
                  ['Date',        fmtDate(selectedLog.created_date)],
                  ['IP Address',  selectedLog.ip_address || '—'],
                ].map(([k, v]) => (
                  <React.Fragment key={k}>
                    <span style={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>{k}</span>
                    <span>{v}</span>
                  </React.Fragment>
                ))}
              </div>
              {selectedLog.changes && (
                <div>
                  <p style={{ fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Changes</p>
                  <pre style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 11.5, overflowX: 'auto', border: '1px solid #E2E8F0' }}>
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PageHeader
        title="Audit Trail"
        subtitle="Complete record of all system actions and changes"
        icon={FileText}
        accentColor="#8B5CF6"
        actions={
          <ActionBtn onClick={() => refetch()} icon={RefreshCw} label="Refresh" variant="outline" />
        }
      />

      <StatBar stats={[
        { label: 'Total Events', value: auditLogs.length, icon: Clock,   color: '#1B4F8A' },
        { label: 'Created',      value: createCount,      icon: Plus,    color: '#00A86B' },
        { label: 'Updated',      value: updateCount,      icon: Edit,    color: '#1B4F8A' },
        { label: 'Deleted',      value: deleteCount,      icon: Trash2,  color: '#EF4444' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search entity type, action, or user…">
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger style={{ width: 160, borderRadius: 9, fontSize: 13, border: '1.5px solid #E2E8F0' }}>
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger style={{ width: 140, borderRadius: 9, fontSize: 13, border: '1.5px solid #E2E8F0' }}>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="view">View</SelectItem>
          </SelectContent>
        </Select>
      </SearchBar>

      <ERPTable headers={TABLE_HEADERS} emptyIcon={FileText} emptyTitle="No audit logs yet" emptyDesc="Actions will appear here as users interact with the system.">
        {filtered.map((log, i) => (
          <ERPTableRow key={log.id || i}>
            <ERPTableCell><ActionBadge action={log.action} /></ERPTableCell>
            <ERPTableCell bold>{log.entity_type?.replace(/_/g, ' ')}</ERPTableCell>
            <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#94A3B8' }}>{log.entity_id?.slice(0, 12)}…</ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EBF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User style={{ width: 13, height: 13, color: '#1B4F8A' }} />
                </div>
                <span style={{ fontSize: 13, color: '#475569' }}>{log.user_email || log.user_name || '—'}</span>
              </div>
            </ERPTableCell>
            <ERPTableCell muted style={{ fontSize: 12.5 }}>{fmtDate(log.created_date)}</ERPTableCell>
            <ERPTableCell>
              <ActionBtn
                onClick={() => { setSelectedLog(log); setDetailsOpen(true); }}
                icon={Eye} variant="ghost"
              />
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}
