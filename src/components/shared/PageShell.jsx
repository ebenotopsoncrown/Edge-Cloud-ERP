/**
 * PageShell — standard ERP page wrapper with consistent header, search, and layout.
 * Used by every list/detail page for visual consistency.
 */
import React from "react";
import { Search, Plus, Filter } from "lucide-react";

const PRIMARY = '#2E7DE8';
const ACCENT  = '#00A86B';

// ── Page header ───────────────────────────────────────────────

export function PageHeader({ title, subtitle, icon: Icon, accentColor = PRIMARY, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px ${accentColor}40`,
          }}>
            <Icon style={{ width: 22, height: 22, color: 'white' }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: 400 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ── Stat bar ──────────────────────────────────────────────────

export function StatBar({ stats }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      {stats.map((stat, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, padding: '12px 18px',
          border: '1px solid #E8EDF5',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: 10, minWidth: 150,
          flex: '1 1 150px',
        }}>
          {stat.icon && (
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `${stat.color || PRIMARY}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <stat.icon style={{ width: 16, height: 16, color: stat.color || PRIMARY }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>{stat.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginTop: 1 }}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────

export function SearchBar({ value, onChange, placeholder = "Search…", children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
        <Search style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          width: 15, height: 15, color: '#94A3B8', pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '9px 12px 9px 34px',
            border: '1px solid #D1D9E6', borderRadius: 8,
            fontSize: 13.5, color: '#0F172A', background: 'white',
            outline: 'none', transition: 'border-color 150ms, box-shadow 150ms',
            fontFamily: 'inherit', height: 38,
          }}
          onFocus={e => {
            e.target.style.borderColor = PRIMARY;
            e.target.style.boxShadow = '0 0 0 3px rgba(46,125,232,0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#D1D9E6';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      {children}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────

export function ERPTable({ headers, children, emptyIcon: EmptyIcon, emptyTitle = "No records found", emptyDesc = "" }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12,
      border: '1px solid #E8EDF5',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E8EDF5' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '11px 16px', textAlign: h.right ? 'right' : 'left',
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: '#64748B', whiteSpace: 'nowrap',
              }}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {React.Children.count(children) === 0
            ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  {EmptyIcon && <EmptyIcon style={{ width: 38, height: 38, color: '#CBD5E1', margin: '0 auto 12px', display: 'block' }} />}
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{emptyTitle}</p>
                  {emptyDesc && <p style={{ fontSize: 12.5, color: '#CBD5E1', marginTop: 5 }}>{emptyDesc}</p>}
                </td>
              </tr>
            )
            : children
          }
        </tbody>
      </table>
    </div>
  );
}

export function ERPTableRow({ children, onClick, highlight }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid #E8EDF5',
        background: hovered ? '#F0F7FF' : (highlight ? '#FFFBEB' : 'white'),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 120ms',
      }}
    >
      {children}
    </tr>
  );
}

export function ERPTableCell({ children, right, muted, bold, style: extra = {} }) {
  return (
    <td style={{
      padding: '12px 16px',
      textAlign: right ? 'right' : 'left',
      color: muted ? '#94A3B8' : (bold ? '#0F172A' : '#374151'),
      fontWeight: bold ? 600 : 400,
      fontSize: 13.5,
      ...extra,
    }}>
      {children}
    </td>
  );
}

// ── Status badge ──────────────────────────────────────────────

export function StatusBadge({ status }) {
  const cfg = {
    paid:       { bg: '#DCFCE7', color: '#16A34A' },
    sent:       { bg: '#DBEAFE', color: '#2563EB' },
    viewed:     { bg: '#F3E8FF', color: '#7C3AED' },
    overdue:    { bg: '#FEE2E2', color: '#DC2626' },
    draft:      { bg: '#F1F5F9', color: '#64748B' },
    partial:    { bg: '#FEF3C7', color: '#D97706' },
    cancelled:  { bg: '#F1F5F9', color: '#94A3B8' },
    active:     { bg: '#DCFCE7', color: '#16A34A' },
    inactive:   { bg: '#F1F5F9', color: '#94A3B8' },
    pending:    { bg: '#FEF3C7', color: '#D97706' },
    posted:     { bg: '#DCFCE7', color: '#16A34A' },
    void:       { bg: '#FEE2E2', color: '#DC2626' },
    approved:   { bg: '#DCFCE7', color: '#16A34A' },
    rejected:   { bg: '#FEE2E2', color: '#DC2626' },
    open:       { bg: '#DBEAFE', color: '#2563EB' },
    closed:     { bg: '#F1F5F9', color: '#64748B' },
    received:   { bg: '#DCFCE7', color: '#16A34A' },
    partial_received: { bg: '#FEF3C7', color: '#D97706' },
    in_progress: { bg: '#DBEAFE', color: '#2563EB' },
    completed:  { bg: '#DCFCE7', color: '#16A34A' },
    on_hold:    { bg: '#FEF3C7', color: '#D97706' },
    depreciated:{ bg: '#F1F5F9', color: '#94A3B8' },
    disposed:   { bg: '#FEE2E2', color: '#DC2626' },
  }[status?.toLowerCase()] || { bg: '#F1F5F9', color: '#64748B' };

  const label = status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── Buttons ───────────────────────────────────────────────────

export function ActionBtn({ onClick, icon: Icon, label, variant = 'ghost', danger }) {
  const [hov, setHov] = React.useState(false);
  const styles = {
    primary: { bg: PRIMARY,       hover: '#1B6FD8', color: 'white',    border: 'none' },
    accent:  { bg: ACCENT,        hover: '#00875A', color: 'white',    border: 'none' },
    outline: { bg: 'white',       hover: '#EFF6FF', color: PRIMARY,    border: `1px solid #BFDBFE` },
    ghost:   { bg: 'transparent', hover: '#F1F5F9', color: '#64748B',  border: 'none' },
  }[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: label ? '8px 14px' : '8px', borderRadius: 8,
        background: danger ? (hov ? '#DC2626' : '#EF4444') : (hov ? styles.hover : styles.bg),
        color: danger ? 'white' : styles.color,
        border: danger ? 'none' : styles.border,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        transition: 'all 150ms', whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {Icon && <Icon style={{ width: 14, height: 14 }} />}
      {label}
    </button>
  );
}

export function NewBtn({ onClick, label = 'New', icon: Icon = Plus }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 18px', borderRadius: 8,
        background: hov ? '#1B6FD8' : PRIMARY,
        color: 'white', border: 'none',
        fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
        transition: 'background 150ms', fontFamily: 'inherit',
        boxShadow: '0 2px 8px rgba(46,125,232,0.3)',
      }}
    >
      <Icon style={{ width: 15, height: 15 }} />
      {label}
    </button>
  );
}

export function FilterSelect({ value, onChange, options, style: extra = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 12px', border: '1px solid #D1D9E6', borderRadius: 8,
        fontSize: 13, color: '#374151', background: 'white',
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        fontWeight: 500, height: 38, ...extra,
      }}
      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,232,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = '#D1D9E6'; e.target.style.boxShadow = 'none'; }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ── Default export: full-page wrapper ─────────────────────────

export default function PageShell({ children, style: extra = {} }) {
  return (
    <div style={{ padding: '28px 32px', background: '#F1F5FB', minHeight: '100%', ...extra }}>
      {children}
    </div>
  );
}
