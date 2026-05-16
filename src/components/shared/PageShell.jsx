/**
 * PageShell — standard ERP page wrapper with consistent header, search, and layout.
 * Used by every list/detail page for visual consistency.
 */
import React from "react";
import { Search, Plus, Filter, Download } from "lucide-react";

const PRIMARY = '#1B4F8A';
const ACCENT  = '#00A86B';

// ── Reusable sub-components exported individually ─────────────

export function PageHeader({ title, subtitle, icon: Icon, accentColor = PRIMARY, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${accentColor}30`,
          }}>
            <Icon style={{ width: 22, height: 22, color: accentColor }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 3, fontWeight: 500 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

export function StatBar({ stats }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      {stats.map((stat, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, padding: '12px 18px',
          border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,43,91,0.05)',
          display: 'flex', alignItems: 'center', gap: 10, minWidth: 140,
        }}>
          {stat.icon && (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${stat.color || PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon style={{ width: 15, height: 15, color: stat.color || PRIMARY }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>{stat.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search…", children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
        <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94A3B8', pointerEvents: 'none' }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '9px 12px 9px 34px',
            border: '1.5px solid #E2E8F0', borderRadius: 9,
            fontSize: 13.5, color: '#0F172A', background: 'white',
            outline: 'none', transition: 'border-color 150ms',
            fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = PRIMARY}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />
      </div>
      {children}
    </div>
  );
}

export function ERPTable({ headers, children, emptyIcon: EmptyIcon, emptyTitle = "No records found", emptyDesc = "" }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '11px 16px', textAlign: h.right ? 'right' : 'left',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#64748B', whiteSpace: 'nowrap',
              }}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {React.Children.count(children) === 0
            ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '40px 16px', textAlign: 'center' }}>
                  {EmptyIcon && <EmptyIcon style={{ width: 36, height: 36, color: '#CBD5E1', margin: '0 auto 10px', display: 'block' }} />}
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{emptyTitle}</p>
                  {emptyDesc && <p style={{ fontSize: 12.5, color: '#CBD5E1', marginTop: 4 }}>{emptyDesc}</p>}
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
        borderBottom: '1px solid #F1F5F9',
        background: hovered ? '#EBF4FB' : (highlight ? '#FFFBEB' : 'white'),
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
      color: muted ? '#94A3B8' : (bold ? '#0F172A' : '#475569'),
      fontWeight: bold ? 700 : 500,
      ...extra,
    }}>
      {children}
    </td>
  );
}

export function StatusBadge({ status }) {
  const cfg = {
    paid:       { bg: '#E6F9F2', color: '#00875A' },
    sent:       { bg: '#EBF4FB', color: '#1B4F8A' },
    viewed:     { bg: '#F3E8FF', color: '#7C3AED' },
    overdue:    { bg: '#FEF2F2', color: '#DC2626' },
    draft:      { bg: '#F8FAFC', color: '#64748B' },
    partial:    { bg: '#FEF3C7', color: '#B45309' },
    cancelled:  { bg: '#F1F5F9', color: '#94A3B8' },
    active:     { bg: '#E6F9F2', color: '#00875A' },
    inactive:   { bg: '#F1F5F9', color: '#94A3B8' },
    pending:    { bg: '#FEF3C7', color: '#B45309' },
    posted:     { bg: '#E6F9F2', color: '#00875A' },
    void:       { bg: '#FEF2F2', color: '#DC2626' },
    approved:   { bg: '#E6F9F2', color: '#00875A' },
    rejected:   { bg: '#FEF2F2', color: '#DC2626' },
    open:       { bg: '#EBF4FB', color: '#1B4F8A' },
    closed:     { bg: '#F1F5F9', color: '#64748B' },
    received:   { bg: '#E6F9F2', color: '#00875A' },
    partial_received: { bg: '#FEF3C7', color: '#B45309' },
    in_progress: { bg: '#EBF4FB', color: '#1B4F8A' },
    completed:  { bg: '#E6F9F2', color: '#00875A' },
    on_hold:    { bg: '#FEF3C7', color: '#B45309' },
    depreciated:{ bg: '#F1F5F9', color: '#94A3B8' },
    disposed:   { bg: '#FEF2F2', color: '#DC2626' },
  }[status?.toLowerCase()] || { bg: '#F1F5F9', color: '#64748B' };

  const label = status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

export function ActionBtn({ onClick, icon: Icon, label, variant = 'ghost', danger }) {
  const [hov, setHov] = React.useState(false);
  const styles = {
    primary: { bg: PRIMARY,  hover: '#1A5276', color: 'white',    border: 'none' },
    accent:  { bg: ACCENT,   hover: '#00875A', color: 'white',    border: 'none' },
    outline: { bg: 'white',  hover: '#EBF4FB', color: PRIMARY,    border: `1.5px solid #AED6F1` },
    ghost:   { bg: 'transparent', hover: '#F1F5F9', color: '#64748B', border: 'none' },
  }[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: label ? '8px 16px' : '8px', borderRadius: 8,
        background: danger ? (hov ? '#DC2626' : '#EF4444') : (hov ? styles.hover : styles.bg),
        color: danger ? 'white' : styles.color,
        border: danger ? 'none' : styles.border,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
        padding: '9px 18px', borderRadius: 9,
        background: hov ? '#1A5276' : PRIMARY,
        color: 'white', border: 'none',
        fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
        transition: 'background 150ms', fontFamily: 'inherit',
        boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
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
        padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 9,
        fontSize: 13, color: '#475569', background: 'white',
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        fontWeight: 500, ...extra,
      }}
      onFocus={e => e.target.style.borderColor = PRIMARY}
      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
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
    <div style={{ padding: '28px 32px', background: '#F5F7FA', minHeight: '100%', ...extra }}>
      {children}
    </div>
  );
}
