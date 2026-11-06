import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Sparkles,
  Layers,
  Database,
  Sliders,
  Eye,
  BarChart3,
  Cpu,
  BookOpen,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { AtlasProvider } from '../hooks/useAtlas';

const NAV_SECTIONS = [
  {
    title: 'EXPLORE',
    items: [
      { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
      { to: '/atlas', label: 'Feature Atlas', icon: Sparkles },
      { to: '/atlas?mode=explorer', label: 'Feature Explorer', icon: Eye },
      { to: '/feature/0', label: 'Top Activating Images', icon: Zap },
      { to: '/clusters', label: 'Clusters', icon: Layers },
      { to: '/steering', label: 'Steering Playground', icon: Sliders },
      { to: '/activation-maximization', label: 'Activation Maximization', icon: Sparkles, badge: 'Roadmap' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { to: '/sae-dashboard', label: 'SAE Dictionary', icon: Cpu },
      { to: '/performance', label: 'Model Benchmarks', icon: BarChart3, badge: 'Roadmap' },
    ],
  },
  {
    title: 'DATASET & SPECS',
    items: [
      { to: '/dataset', label: 'CIFAR-10 Dataset', icon: Database },
      { to: '/dataset#sae', label: 'Model & SAE Specs', icon: Cpu },
    ],
  },
  {
    title: 'DEVELOPER',
    items: [
      { to: '/settings#api', label: 'API Reference', icon: BookOpen },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState('dark');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <AtlasProvider>
      <div className="flex min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 selection:text-white">
        {/* Left Fixed Sidebar */}
        <aside className="sticky top-0 z-30 flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-800/80 bg-[#0c111e]/95 backdrop-blur-xl">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-4.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[15px] font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>NeuroLens</span>
                <span className="rounded bg-indigo-500/20 px-1 py-0.2 font-mono text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                  v2.4
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400">Interpretability Platform</div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-400/80">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => {
                          const active =
                            isActive &&
                            (!item.to.includes('?') || location.search.includes(item.to.split('?')[1]));
                          return `group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all duration-150 ${
                            active
                              ? 'border-l-2 border-indigo-400 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent font-semibold text-white shadow-sm shadow-indigo-500/10'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                          }`;
                        }}
                      >
                        {({ isActive }) => {
                          const active =
                            isActive &&
                            (!item.to.includes('?') || location.search.includes(item.to.split('?')[1]));
                          return (
                            <>
                              <div className="flex items-center gap-2.5">
                                <Icon
                                  className={`h-4 w-4 transition-colors ${
                                    active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'
                                  }`}
                                />
                                <span>{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className="rounded-full border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-purple-300">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          );
                        }}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Card at Bottom - Asmita Gupta */}
          <div className="border-t border-slate-800/80 p-3">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/60 p-2.5 text-left transition-all hover:border-indigo-500/40 hover:bg-slate-850"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 font-mono text-xs font-bold text-white shadow-md shadow-indigo-500/20">
                    AG
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0c111e] bg-emerald-400 ring-1 ring-emerald-500/40" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white">Asmita Gupta</div>
                  <div className="text-[10px] font-medium text-slate-400">Lead ML Researcher</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-300" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Global Bar - Midnight Glassmorphism */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#0c111e]/85 px-8 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[11px] text-indigo-300 font-medium">CIFAR-10 ResNet</span>
                <span className="text-slate-600">/</span>
                <span className="font-mono text-[11px] text-slate-300">SAE 4,096 features (TopK=256)</span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                title="Toggle Theme"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
              >
                {themeMode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="Notifications"
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition-colors hover:border-indigo-500/40 hover:text-slate-200"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-[#0c111e]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-10 z-50 w-76 rounded-2xl border border-slate-700/80 bg-[#0f172a] p-3.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs font-bold text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        System Notifications
                      </span>
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                        1 Active
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-2 text-xs text-slate-400">
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-2.5">
                        <p className="font-semibold text-indigo-200">Atlas Pre-computed</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          3,648 alive features with UMAP embeddings ready for interactive inspection.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Circle */}
              <div className="ml-2 flex items-center gap-2 border-l border-slate-800 pl-3">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-mono text-[11px] font-bold text-white shadow-md shadow-indigo-500/20 transition-transform hover:scale-105"
                >
                  AG
                </button>
              </div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
            <div className="mx-auto max-w-[1500px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AtlasProvider>
  );
}

