import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { getClusterColor } from '../lib/clusters';

export function PageHeader({ title, description, actions, badge, breadcrumbs }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {breadcrumbs && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-indigo-400/80 font-mono">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-white lg:text-3xl font-sans">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

const STAT_THEMES = {
  indigo: {
    border: 'border-indigo-500/25 hover:border-indigo-500/50',
    bg: 'bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950/90',
    glow: 'from-indigo-500/10 to-transparent',
    iconBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    titleColor: 'text-indigo-300',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  emerald: {
    border: 'border-emerald-500/25 hover:border-emerald-500/50',
    bg: 'bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950/90',
    glow: 'from-emerald-500/10 to-transparent',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    titleColor: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  rose: {
    border: 'border-rose-500/25 hover:border-rose-500/50',
    bg: 'bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-950/90',
    glow: 'from-rose-500/10 to-transparent',
    iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    titleColor: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  amber: {
    border: 'border-amber-500/25 hover:border-amber-500/50',
    bg: 'bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950/90',
    glow: 'from-amber-500/10 to-transparent',
    iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    titleColor: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  cyan: {
    border: 'border-cyan-500/25 hover:border-cyan-500/50',
    bg: 'bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-950/90',
    glow: 'from-cyan-500/10 to-transparent',
    iconBg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    titleColor: 'text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  purple: {
    border: 'border-purple-500/25 hover:border-purple-500/50',
    bg: 'bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-950/90',
    glow: 'from-purple-500/10 to-transparent',
    iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    titleColor: 'text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
};

export function StatCard({ label, value, hint, icon: Icon, badge, color = 'indigo' }) {
  const theme = STAT_THEMES[color] || STAT_THEMES.indigo;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40`}
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${theme.glow} blur-xl`} />
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-[0.14em] uppercase ${theme.titleColor}`}>
          {label}
        </span>
        {Icon && (
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {badge && (
          <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold ${theme.badge}`}>
            {badge}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function ConfidenceBadge({ value, showPercent = false }) {
  const percentMap = { high: '94%', medium: '78%', low: '42%' };
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-xs shadow-emerald-500/10',
    medium: 'bg-amber-500/15 text-amber-300 border-amber-500/35 shadow-xs shadow-amber-500/10',
    low: 'bg-rose-500/15 text-rose-300 border-rose-500/35 shadow-xs shadow-rose-500/10',
  };
  const dotStyles = {
    high: 'bg-emerald-400',
    medium: 'bg-amber-400',
    low: 'bg-rose-400',
  };
  const cls = styles[value] || styles.low;
  const dotCls = dotStyles[value] || dotStyles.low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
      <span>Confidence: {showPercent ? percentMap[value] || value : `${value}`}</span>
    </span>
  );
}

export function ClusterTag({ clusterId, label, count }) {
  const color = getClusterColor(clusterId);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-200">
      <span className="h-2 w-2 rounded-full ring-2 ring-white/10" style={{ background: color }} />
      <span className="font-medium">{label || (clusterId === -1 ? 'Unclustered' : `Cluster ${clusterId}`)}</span>
      {count != null && <span className="font-mono text-[10px] text-slate-400">({count})</span>}
    </span>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-md shadow-indigo-500/20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 px-6 py-12 text-center backdrop-blur-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-200">{title}</p>
      {body && <p className="mt-1 max-w-sm text-xs text-slate-400">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-left backdrop-blur-md shadow-lg shadow-rose-950/20">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <div>
        <p className="text-xs font-bold text-rose-300">Backend Connection Error</p>
        <p className="mt-0.5 font-mono text-[11px] text-rose-400/90">{message}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Ensure FastAPI backend is running on <code className="text-indigo-300 font-mono">http://localhost:8000</code>.
        </p>
      </div>
    </div>
  );
}

